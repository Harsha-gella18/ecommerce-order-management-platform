import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export function AnalyticsStatCard({ title, value, hint, accent = 'blue' }) {
  const accents = {
    blue: 'from-brand-blue/20 to-cyan-500/10 text-brand-blue',
    emerald: 'from-emerald-500/20 to-emerald-400/5 text-emerald-600 dark:text-emerald-400',
    amber: 'from-amber-500/20 to-amber-400/5 text-amber-600 dark:text-amber-400',
    rose: 'from-rose-500/20 to-rose-400/5 text-rose-600 dark:text-rose-400',
  };
  const cls = accents[accent] || accents.blue;
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-gradient-to-br ${cls} p-5 shadow-soft`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-navy dark:text-white mt-1 tabular-nums">{value}</p>
          {hint && <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{hint}</p>}
        </div>
        <div className="p-2 rounded-xl bg-white/60 dark:bg-slate-900/40">
          <TrendingUp className="w-5 h-5 opacity-80" aria-hidden />
        </div>
      </div>
    </motion.div>
  );
}
