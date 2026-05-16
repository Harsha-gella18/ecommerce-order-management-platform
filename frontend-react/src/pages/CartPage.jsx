import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { fetchCart, updateCartItem, removeCartItem } from '../api/gateway.js';
import { useToast } from '../hooks/useToast.js';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { formatINR } from '../utils/formatCurrency.js';

export function CartPage() {
  const toast = useToast();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const c = await fetchCart();
    setCart(c);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch {
        toast('Could not load cart', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const items = cart?.items || [];
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0),
    [items]
  );

  async function setQty(productId, quantity) {
    try {
      const c = await updateCartItem(productId, { quantity });
      setCart(c);
    } catch {
      toast('Update failed', 'error');
    }
  }

  async function remove(productId) {
    try {
      const c = await removeCartItem(productId);
      setCart(c);
      toast('Item removed', 'success');
    } catch {
      toast('Remove failed', 'error');
    }
  }

  if (loading) return <PageLoader />;
  if (!items.length) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse the catalog and add products to your cart."
        action={
          <Link to="/products" className="px-5 py-2.5 rounded-xl bg-brand-blue text-white font-semibold">
            Browse products
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-3xl font-bold text-navy dark:text-white">Shopping cart</h1>
        {items.map((i) => (
          <motion.div
            layout
            key={i.productId}
            className="flex gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 shadow-sm"
          >
            <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0" />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-navy dark:text-white truncate">{i.name || i.productId}</h3>
              <p className="text-brand-blue font-bold mt-1">{formatINR(i.price)}</p>
              <div className="flex items-center gap-3 mt-3">
                <label className="text-xs text-slate-500">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={i.quantity}
                  onChange={(e) => setQty(i.productId, Number(e.target.value))}
                  className="w-20 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={() => remove(i.productId)}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  aria-label="Remove"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div>
        <div className="sticky top-28 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/90 p-6 shadow-soft">
          <h2 className="font-semibold text-lg text-navy dark:text-white mb-4">Order summary</h2>
          <p className="text-xs text-slate-500 mb-4">
            Totals match checkout — order service builds the amount from your live cart.
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between font-bold text-navy dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Estimated total</span>
              <span>{formatINR(subtotal)}</span>
            </div>
          </div>
          <Link
            to="/checkout"
            className="mt-6 block text-center w-full py-3 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 text-white font-semibold shadow-md"
          >
            Proceed to checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
