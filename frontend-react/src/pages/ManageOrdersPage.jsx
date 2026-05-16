import { useEffect, useState } from 'react';
import { fetchAdminOrders, updateOrderStatus } from '../api/gateway.js';
import { useToast } from '../hooks/useToast.js';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { DataTable } from '../components/ui/DataTable.jsx';
import { StatusBadge } from '../components/ui/StatusBadge.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { ADMIN_ORDER_STATUS_OPTIONS } from '../constants/index.js';
import { downloadOrderInvoice } from '../utils/orderInvoice.js';
import { formatINR } from '../utils/formatCurrency.js';

export function ManageOrdersPage() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  async function load() {
    const list = await fetchAdminOrders();
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

  async function setStatus(id, status) {
    try {
      await updateOrderStatus(id, status);
      toast('Status updated', 'success');
      await load();
    } catch (ex) {
      toast(ex.response?.data?.message || 'Update failed', 'error');
    }
  }

  const filtered = orders.filter((o) => !q.trim() || o.id?.toLowerCase().includes(q.toLowerCase()));

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
      <h1 className="text-3xl font-bold text-white mb-2">Orders</h1>
      <p className="text-slate-400 text-sm mb-6">Review and update order status for customers.</p>
      <SearchInput value={q} onChange={setQ} placeholder="Search order id…" className="max-w-md mb-6" />

      <DataTable
        columns={[
          { key: 'id', label: 'Order', render: (r) => <span className="font-mono text-xs">{r.id}</span> },
          {
            key: 'status',
            label: 'Status',
            render: (r) => <StatusBadge status={r.status} />,
          },
          {
            key: 'total',
            label: 'Total',
            render: (r) => formatINR(r.totalAmount),
          },
          { key: 'customerId', label: 'Customer', render: (r) => <span className="font-mono text-xs">{r.customerId}</span> },
          {
            key: 'next',
            label: 'Update',
            render: (r) => (
              <select
                className="rounded-lg bg-slate-800 border border-slate-600 text-xs text-white px-2 py-1"
                value={r.status}
                onChange={(e) => setStatus(r.id, e.target.value)}
              >
                {ADMIN_ORDER_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ),
          },
          {
            key: 'invoice',
            label: '',
            render: (r) => (
              <button type="button" className="text-cyan-400 text-xs font-semibold" onClick={() => onInvoice(r.id)}>
                Invoice
              </button>
            ),
          },
        ]}
        rows={filtered}
      />
    </div>
  );
}
