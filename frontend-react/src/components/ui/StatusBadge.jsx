import { ORDER_STATUS_LABEL } from '../../constants/index.js';

const styles = {
  PLACED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  CONFIRMED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  PACKED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  SHIPPED: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-200',
  DELIVERED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  SUCCESS: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  REFUNDED: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  BLOCKED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
};

export function StatusBadge({ status }) {
  const key = status?.toUpperCase?.() || '';
  const label = ORDER_STATUS_LABEL[key] || status || '—';
  const cls = styles[key] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
