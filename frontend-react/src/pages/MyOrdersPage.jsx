import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { fetchMyOrders, cancelOrder } from '../api/gateway.js';
import { useToast } from '../hooks/useToast.js';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { DataTable } from '../components/ui/DataTable.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { ORDER_STATUSES } from '../constants/index.js';
import { downloadOrderInvoice } from '../utils/orderInvoice.js';
import { formatINR } from '../utils/formatCurrency.js';

export function MyOrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [cancelId, setCancelId] = useState(null);

  async function load() {
    const list = await fetchMyOrders();
    setOrders(list);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch {
        toast('Could not load orders', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (status && o.status !== status) return false;
      if (!q.trim()) return true;
      const qq = q.toLowerCase();
      return o.id?.toLowerCase().includes(qq);
    });
  }, [orders, q, status]);

  async function doCancel(id) {
    try {
      await cancelOrder(id);
      toast('Order cancelled', 'success');
      await load();
    } catch (ex) {
      toast(ex.response?.data?.message || 'Cannot cancel', 'error');
    }
  }

  async function onInvoice(orderId) {
    try {
      await downloadOrderInvoice(orderId);
      toast('Invoice downloaded', 'success');
    } catch {
      toast('Could not download invoice', 'error');
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">My orders</h1>
      <p className="text-slate-500 text-sm mb-8">Search and filter your fulfillment history.</p>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by order id"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 py-2.5 px-3 text-sm"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        empty={
          <EmptyState title="No orders yet" description="Your placed orders will appear here." action={<Link to="/products" className="text-brand-blue font-semibold">Browse</Link>} />
        }
        columns={[
          { key: 'id', label: 'Order' },
          {
            key: 'status',
            label: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
          },
          {
            key: 'total',
            label: 'Total',
            render: (row) => formatINR(row.totalAmount),
          },
          {
            key: 'pay',
            label: 'Payment',
            render: (row) => <StatusBadge status={row.paymentStatus} />,
          },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Link to={`/orders/${row.id}/track`} className="text-brand-blue text-sm font-semibold hover:underline">
                  Track
                </Link>
                <button
                  type="button"
                  className="text-slate-500 text-sm hover:underline"
                  onClick={() => onInvoice(row.id)}
                >
                  Invoice
                </button>
                {!['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(row.status) && (
                  <button type="button" className="text-red-500 text-sm font-medium" onClick={() => setCancelId(row.id)}>
                    Cancel
                  </button>
                )}
              </div>
            ),
          },
        ]}
        rows={filtered}
      />

      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={() => doCancel(cancelId)}
        title="Cancel order?"
        message="This will cancel the order if it has not shipped."
        confirmLabel="Cancel order"
        danger
      />
    </div>
  );
}
