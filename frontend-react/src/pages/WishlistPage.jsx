import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWishlist, removeWishlistItem, addCartItem } from '../api/gateway.js';
import { useToast } from '../hooks/useToast.js';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { motion } from 'framer-motion';
import { formatINR } from '../utils/formatCurrency.js';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';

export function WishlistPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const w = await fetchWishlist();
    setItems(w.items || []);
  }

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch {
        toast('Could not load wishlist', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  async function remove(productId) {
    try {
      const w = await removeWishlistItem(productId);
      setItems(w.items || []);
      toast('Removed', 'success');
    } catch {
      toast('Failed', 'error');
    }
  }

  async function moveToCart(i) {
    try {
      await addCartItem({
        productId: i.productId,
        name: i.name,
        price: Number(i.price),
        quantity: 1,
      });
      await remove(i.productId);
      toast('Moved to cart', 'success');
    } catch {
      toast('Could not move to cart', 'error');
    }
  }

  if (loading) return <PageLoader />;
  if (!items.length) {
    return (
      <EmptyState
        title="Wishlist is empty"
        description="Save items while browsing to see them here."
        action={
          <Link to="/products" className="px-5 py-2.5 rounded-xl bg-brand-blue text-white font-semibold">
            Browse catalog
          </Link>
        }
      />
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-navy dark:text-white mb-8">Wishlist</h1>
      <div className="grid sm:grid-cols-2 gap-6">
        {items.map((i) => (
          <motion.div
            layout
            key={i.productId}
            className="flex gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80"
          >
            <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
              {i.image ? <img src={i.image} alt="" className="w-full h-full object-cover" /> : <Heart className="w-8 h-8 m-auto mt-6 text-slate-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <Link to={`/products/${i.productId}`} className="font-semibold text-navy dark:text-white hover:text-brand-blue line-clamp-2">
                {i.name || i.productId}
              </Link>
              <p className="text-brand-blue font-bold mt-1">{formatINR(i.price)}</p>
              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => moveToCart(i)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-blue text-white text-sm font-medium"
                >
                  <ShoppingCart className="w-4 h-4" /> Cart
                </button>
                <button
                  type="button"
                  onClick={() => remove(i.productId)}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 text-red-500"
                  aria-label="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
