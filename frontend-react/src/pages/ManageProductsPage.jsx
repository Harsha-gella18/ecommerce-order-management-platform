import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { fetchProducts, createProduct, updateProduct, deleteProduct, fetchCategories } from '../api/gateway.js';
import { useToast } from '../hooks/useToast.js';
import { DataTable } from '../components/ui/DataTable.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { formatINR } from '../utils/formatCurrency.js';

const empty = {
  name: '',
  description: '',
  category: '',
  price: '',
  rating: 4.2,
  images: '',
  active: true,
};

export function ManageProductsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [delId, setDelId] = useState(null);
  const [cats, setCats] = useState([]);

  async function load() {
    const list = await fetchProducts({ sort: 'newest' });
    setRows(list);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await load();
        setCats(await fetchCategories().catch(() => []));
      } catch {
        toast('Could not load products', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setModal(true);
  }

  function openEdit(p) {
    setEditing(p);
    setForm({
      name: p.name || '',
      description: p.description || '',
      category: p.category || '',
      price: String(p.price ?? ''),
      rating: p.rating ?? 0,
      images: (p.images || []).join('\n'),
      active: p.active !== false,
    });
    setModal(true);
  }

  async function save(e) {
    e.preventDefault();
    const body = {
      name: form.name,
      description: form.description,
      category: form.category,
      price: Number(form.price),
      rating: Number(form.rating),
      images: form.images
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      active: form.active,
    };
    try {
      if (editing) await updateProduct(editing.id, body);
      else await createProduct(body);
      toast('Saved', 'success');
      setModal(false);
      await load();
    } catch (ex) {
      toast(ex.response?.data?.message || 'Save failed', 'error');
    }
  }

  async function doDelete() {
    try {
      await deleteProduct(delId);
      toast('Deleted', 'success');
      await load();
    } catch {
      toast('Delete failed', 'error');
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-slate-400 text-sm">Add, edit, or remove catalog items. Prices are in Indian Rupees (INR).</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-blue text-white font-semibold"
        >
          <Plus className="w-5 h-5" /> Add product
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'category', label: 'Category' },
          { key: 'price', label: 'Price (INR)', render: (r) => formatINR(r.price) },
          {
            key: 'actions',
            label: '',
            render: (r) => (
              <div className="flex gap-2">
                <button type="button" className="p-2 rounded-lg bg-slate-800 text-cyan-400" onClick={() => openEdit(r)}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button type="button" className="p-2 rounded-lg bg-slate-800 text-red-400" onClick={() => setDelId(r.id)}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ),
          },
        ]}
        rows={rows}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit product' : 'Add product'} size="lg">
        <form onSubmit={save} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Category</label>
              <input
                required
                list="pcats"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
              />
              <datalist id="pcats">
                {cats.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400">Price (INR)</label>
              <input
                required
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Rating</label>
              <input
                type="number"
                step="0.1"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
                className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400">Image URLs (one per line)</label>
            <textarea
              value={form.images}
              onChange={(e) => setForm({ ...form, images: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-xl bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Active
          </label>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-brand-blue text-white font-semibold">
            Save product
          </button>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!delId}
        onClose={() => setDelId(null)}
        onConfirm={doDelete}
        title="Delete product?"
        message="This removes the catalog item for shoppers."
        danger
      />
    </div>
  );
}
