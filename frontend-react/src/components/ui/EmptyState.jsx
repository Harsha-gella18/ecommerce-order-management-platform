import { motion } from 'framer-motion';
import { PackageOpen } from 'lucide-react';

export function EmptyState({ title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40"
    >
      <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center mb-4">
        <PackageOpen className="w-7 h-7 text-brand-blue" aria-hidden />
      </div>
      <h3 className="text-lg font-semibold text-navy dark:text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6">{description}</p>}
      {action}
    </motion.div>
  );
}
