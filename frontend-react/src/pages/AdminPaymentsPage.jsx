import { useEffect, useState } from 'react';
import { fetchAdminPayments, refundPayment } from '../api/gateway.js';
import { useToast } from '../hooks/useToast.js';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { DataTable } from '../components/ui/DataTable.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { formatINR } from '../utils/formatCurrency.js';

export function AdminPaymentsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundId, setRefundId] = useState(null);

  async function load() {
    const list = await fetchAdminPayments();
    setRows(list);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch {
        toast('Could not load payments', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  async function doRefund() {
    try {
      await refundPayment(refundId);
      toast('Refund processed', 'success');
      await load();
    } catch (ex) {
      toast(ex.response?.data?.message || 'Refund failed', 'error');
    }
  }

  const revenue = rows.filter((r) => r.status === 'SUCCESS').reduce((s, r) => s + Number(r.amount || 0), 0);

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Payments</h1>
      <p className="text-slate-400 text-sm mb-6">View transactions and process refunds. Amounts are in Indian Rupees (INR).</p>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs text-slate-500 uppercase">Successful capture</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{formatINR(revenue)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs text-slate-500 uppercase">Records</p>
          <p className="text-2xl font-bold text-white mt-1">{rows.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs text-slate-500 uppercase">Refunds</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{rows.filter((r) => r.status === 'REFUNDED').length}</p>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'id', label: 'Payment', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          { key: 'orderId', label: 'Order', render: (r) => <span className="font-mono text-xs">{r.orderId}</span> },
          {
            key: 'amount',
            label: 'Amount',
            render: (r) => formatINR(r.amount),
          },
          {
            key: 'status',
            label: 'Status',
            render: (r) => <StatusBadge status={r.status} />,
          },
          {
            key: 'actions',
            label: '',
            render: (r) =>
              r.status === 'SUCCESS' ? (
                <button type="button" className="text-amber-400 text-sm font-semibold" onClick={() => setRefundId(r.id)}>
                  Refund
                </button>
              ) : null,
          },
        ]}
        rows={rows}
      />

      <ConfirmDialog
        open={!!refundId}
        onClose={() => setRefundId(null)}
        onConfirm={doRefund}
        title="Process refund?"
        message="Marks the payment as REFUNDED and emits a domain event."
        confirmLabel="Refund"
        danger
      />
    </div>
  );
}
