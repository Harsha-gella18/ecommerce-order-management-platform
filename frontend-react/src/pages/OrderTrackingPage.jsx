import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { fetchOrder } from '../api/gateway.js';
import { ORDER_STATUSES, ORDER_STATUS_LABEL } from '../constants/index.js';
import { PageLoader } from '../components/ui/Spinner.jsx';

export function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const o = await fetchOrder(id);
        setOrder(o);
      } catch {
        setOrder(null);
      }
    })();
  }, [id]);

  if (!order) return <PageLoader />;

  const idx = ORDER_STATUSES.indexOf(order.status);
  const steps = ORDER_STATUSES.filter((s) => s !== 'CANCELLED');
  const activeIdx = order.status === 'CANCELLED' ? -1 : idx;

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/orders" className="text-sm text-brand-blue font-medium hover:underline mb-6 inline-block">
        ← Orders
      </Link>
      <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Track order</h1>
      <p className="font-mono text-slate-500 mb-8">{order.id}</p>

      {order.status === 'CANCELLED' ? (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 text-red-800 dark:text-red-200">
          This order was cancelled.
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" aria-hidden />
          <ul className="space-y-6">
            {steps.map((s, i) => {
              const done = activeIdx >= i;
              return (
                <motion.li
                  key={s}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-4 items-start relative"
                >
                  <div
                    className={`z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                      done
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-400'
                    }`}
                  >
                    {done ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  <div>
                    <p className={`font-semibold ${done ? 'text-navy dark:text-white' : 'text-slate-400'}`}>
                      {ORDER_STATUS_LABEL[s]}
                    </p>
                    <p className="text-xs text-slate-500">{done ? 'Completed' : 'Pending'}</p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-900/60">
        <h3 className="font-semibold text-navy dark:text-white mb-2">Delivery details</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{order.shippingAddress}</p>
        <p className="text-xs text-slate-400 mt-4">Estimated delivery is simulated based on operational status updates.</p>
      </div>
    </div>
  );
}
