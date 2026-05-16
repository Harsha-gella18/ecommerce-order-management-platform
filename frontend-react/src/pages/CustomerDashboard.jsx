import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ShoppingCart, Heart, Truck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { fetchMyOrders, fetchCart, fetchWishlist } from '../api/gateway.js';
import { PageLoader } from '../components/ui/Spinner.jsx';

export function CustomerDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [cartN, setCartN] = useState(0);
  const [wishN, setWishN] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [o, c, w] = await Promise.all([fetchMyOrders(), fetchCart(), fetchWishlist()]);
        setOrders(o.slice(0, 5));
        setCartN((c.items || []).reduce((s, i) => s + i.quantity, 0));
        setWishN((w.items || []).length);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader />;

  const cards = [
    { label: 'Cart items', value: cartN, to: '/cart', icon: ShoppingCart, color: 'from-brand-blue to-cyan-500' },
    { label: 'Wishlist', value: wishN, to: '/wishlist', icon: Heart, color: 'from-rose-500 to-orange-400' },
    { label: 'Open orders', value: orders.filter((x) => x.status !== 'DELIVERED' && x.status !== 'CANCELLED').length, to: '/orders', icon: Truck, color: 'from-emerald-500 to-teal-400' },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-bold text-navy dark:text-white">Hello, {user?.email?.split('@')[0]}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Your shopping command center.</p>
      </motion.div>
      <div className="grid sm:grid-cols-3 gap-6 mb-12">
        {cards.map(({ label, value, to, icon: Icon, color }) => (
          <Link key={label} to={to}>
            <motion.div
              whileHover={{ y: -3 }}
              className={`rounded-2xl p-6 text-white bg-gradient-to-br ${color} shadow-lg relative overflow-hidden`}
            >
              <Icon className="w-8 h-8 opacity-90 mb-3" />
              <p className="text-sm font-medium opacity-90">{label}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
            </motion.div>
          </Link>
        ))}
      </div>
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-navy dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-blue" /> Recent orders
          </h2>
          <Link to="/orders" className="text-sm font-semibold text-brand-blue">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {orders.map((o) => (
            <li key={o.id} className="py-3 flex justify-between gap-4 text-sm">
              <span className="font-mono text-slate-600 dark:text-slate-300">{o.id}</span>
              <span className="font-semibold">{o.status}</span>
              <Link to={`/orders/${o.id}/track`} className="text-brand-blue font-medium">
                Track
              </Link>
            </li>
          ))}
          {!orders.length && <li className="py-6 text-center text-slate-500">No orders yet.</li>}
        </ul>
      </div>
    </div>
  );
}
