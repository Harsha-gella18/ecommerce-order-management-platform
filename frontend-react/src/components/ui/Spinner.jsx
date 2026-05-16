import { motion } from 'framer-motion';

export function Spinner({ className = '' }) {
  return (
    <motion.div
      className={`w-10 h-10 rounded-full border-2 border-brand-blue border-t-transparent ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-slate-500 dark:text-slate-400">
      <Spinner />
      <p className="text-sm font-medium">Loading…</p>
    </div>
  );
}
