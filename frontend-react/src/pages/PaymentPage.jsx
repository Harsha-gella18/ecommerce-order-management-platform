import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CreditCard, Wallet, Banknote, CheckCircle2 } from 'lucide-react';
import { fetchOrder, fetchPaymentByOrder } from '../api/gateway.js';
import { PAYMENT_METHODS } from '../constants/index.js';
import { PageLoader } from '../components/ui/Spinner.jsx';
import { formatINR } from '../utils/formatCurrency.js';

const iconMap = {
  smartphone: Smartphone,
  'credit-card': CreditCard,
  wallet: Wallet,
  banknote: Banknote,
};

export function PaymentPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [err, setErr] = useState('');
  const [method, setMethod] = useState('upi');
  const [stage, setStage] = useState('pick');

  useEffect(() => {
    (async () => {
      try {
        const o = await fetchOrder(orderId);
        setOrder(o);
        try {
          const p = await fetchPaymentByOrder(orderId);
          setPayment(p);
        } catch {
          setPayment(null);
        }
      } catch {
        setErr('Could not load order/payment');
      }
    })();
  }, [orderId]);

  useEffect(() => {
    if (stage !== 'processing') return undefined;
    const t = window.setTimeout(() => setStage('done'), 1600);
    return () => clearTimeout(t);
  }, [stage]);

  if (err) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-red-600 font-medium">{err}</p>
        <Link to="/orders" className="mt-4 inline-block text-brand-blue font-semibold">
          Back to orders
        </Link>
      </div>
    );
  }
  if (!order) return <PageLoader />;

  const success = order.paymentStatus === 'SUCCESS' || payment?.status === 'SUCCESS';

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-navy dark:text-white mb-2">Payment</h1>
      <p className="text-slate-500 text-sm mb-8">Demo checkout — your order total is in Indian Rupees (INR). No real money is charged.</p>

      <AnimatePresence mode="wait">
        {stage === 'done' && success && (
          <motion.div
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="w-16 h-16 mx-auto rounded-full bg-emerald-500 flex items-center justify-center text-white mb-4"
            >
              <CheckCircle2 className="w-10 h-10" />
            </motion.div>
            <h2 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">Payment successful</h2>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">
              Order {order.id} · {method.toUpperCase()} (simulated)
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link
                to={`/orders/${order.id}/track`}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold"
              >
                Track order
              </Link>
              <Link to="/products" className="px-5 py-2.5 rounded-xl border border-emerald-600 text-emerald-800 dark:text-emerald-200 font-semibold">
                Continue shopping
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {stage !== 'done' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-6 shadow-sm space-y-6">
          <div>
            <p className="text-sm text-slate-500">Order</p>
            <p className="font-mono font-semibold text-navy dark:text-white">{order.id}</p>
            <p className="text-sm mt-2">
              Status: <span className="font-semibold">{order.status}</span> · Payment:{' '}
              <span className="font-semibold">{order.paymentStatus || payment?.status || 'n/a'}</span>
            </p>
            {order.totalAmount != null && (
              <p className="text-lg font-bold text-navy dark:text-white mt-3 tabular-nums">{formatINR(order.totalAmount)}</p>
            )}
          </div>

          {success ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                This order is already marked as paid. Pick a method below to see the confirmation screen again (demo
                only).
              </p>
              <div className="grid grid-cols-2 gap-3">
                {PAYMENT_METHODS.map((m) => {
                  const Icon = iconMap[m.icon] || CreditCard;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                        method === m.id
                          ? 'border-brand-blue bg-brand-blue/5'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-6 h-6 text-brand-blue" />
                      <span className="text-xs font-medium">{m.label}</span>
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setStage('processing')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-blue to-cyan-500 text-white font-semibold"
              >
                Confirm payment (demo)
              </button>
            </div>
          ) : (
            <p className="text-amber-700 dark:text-amber-300 text-sm">
              Payment did not succeed for this order. Go back to checkout, turn on &quot;Simulate successful payment&quot;,
              and try placing the order again.
            </p>
          )}
        </div>
      )}

      {stage === 'processing' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-14 h-14 rounded-full border-4 border-white border-t-transparent"
          />
        </div>
      )}
    </div>
  );
}
