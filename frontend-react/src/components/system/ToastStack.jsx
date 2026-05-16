import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { dismissToast } from '../../redux/slices/toastSlice';

function Icon({ variant }) {
  if (variant === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" aria-hidden />;
  if (variant === 'error') return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" aria-hidden />;
  return <Info className="w-5 h-5 text-brand-blue shrink-0" aria-hidden />;
}

function ToastItem({ t, onDismiss }) {
  const dispatch = useDispatch();
  useEffect(() => {
    const ms = t.duration ?? 4200;
    const id = window.setTimeout(() => dispatch(dismissToast(t.id)), ms);
    return () => clearTimeout(id);
  }, [t.id, t.duration, dispatch]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.96 }}
      className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200/80 dark:border-slate-600 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-soft px-4 py-3"
      role="status"
    >
      <Icon variant={t.variant} />
      <p className="text-sm text-slate-700 dark:text-slate-200 flex-1 leading-snug">{t.message}</p>
      <button
        type="button"
        className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
        onClick={() => onDismiss(t.id)}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastStack() {
  const items = useSelector((s) => s.toast.items);
  const dispatch = useDispatch();

  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {items.map((t) => (
          <ToastItem key={t.id} t={t} onDismiss={(id) => dispatch(dismissToast(id))} />
        ))}
      </AnimatePresence>
    </div>
  );
}
