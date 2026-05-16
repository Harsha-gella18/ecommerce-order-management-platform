import { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fetchProducts, fetchInventory, restockInventory } from '../api/gateway.js';
import { useToast } from '../hooks/useToast.js';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { DataTable } from '../components/ui/DataTable.jsx';
import { Modal } from '../components/ui/Modal.jsx';

export function ManageInventoryPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restock, setRestock] = useState(null);
  const [qty, setQty] = useState('');

  async function load() {
    const products = await fetchProducts({ sort: 'name_asc' });
    const merged = await Promise.all(
      products.map(async (p) => {
        try {
          const inv = await fetchInventory(p.id);
          return { ...p, stock: inv.quantity };
        } catch {
          return { ...p, stock: null };
        }
      })
    );
    setRows(merged);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch {
        toast('Could not load inventory', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  async function submitRestock(e) {
    e.preventDefault();
    try {
      await restockInventory(restock.id, { quantity: Number(qty) });
      toast('Stock updated', 'success');
      setRestock(null);
      setQty('');
      await load();
    } catch {
      toast('Restock failed', 'error');
    }
  }

  const low = rows.filter((r) => r.stock != null && r.stock < 10);
  const chartData = low.slice(0, 8).map((r) => ({ name: r.name?.slice(0, 12) || r.id, stock: r.stock }));

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Inventory</h1>
        <p className="text-slate-400 text-sm">View stock levels and add inventory when products run low.</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 h-64">
        <h2 className="text-lg font-semibold text-white mb-4">Low stock snapshot</h2>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
            <YAxis stroke="#94a3b8" fontSize={10} />
            <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12 }} />
            <Bar dataKey="stock" fill="#06B6D4" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Product' },
          { key: 'category', label: 'Category' },
          {
            key: 'stock',
            label: 'Stock',
            render: (r) => (
              <span className={r.stock != null && r.stock < 10 ? 'text-amber-400 font-semibold' : ''}>
                {r.stock ?? '—'}
              </span>
            ),
          },
          {
            key: 'actions',
            label: '',
            render: (r) => (
              <button
                type="button"
                className="text-cyan-400 text-sm font-semibold"
                onClick={() => {
                  setRestock(r);
                  setQty(String(r.stock ?? 0));
                }}
              >
                Restock
              </button>
            ),
          },
        ]}
        rows={rows}
      />

      <Modal open={!!restock} onClose={() => setRestock(null)} title="Restock">
        <p className="text-sm text-slate-400 mb-4">{restock?.name}</p>
        <form onSubmit={submitRestock} className="space-y-3">
          <div>
            <label className="text-xs text-slate-400">New quantity</label>
            <input
              type="number"
              min={0}
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-white text-sm"
            />
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold">
            Apply
          </button>
        </form>
      </Modal>
    </div>
  );
}
