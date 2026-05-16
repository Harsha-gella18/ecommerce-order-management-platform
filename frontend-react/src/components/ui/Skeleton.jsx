export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-900/80 p-4 animate-pulse shadow-sm">
      <div className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4" />
      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-pulse">
      <div className="h-10 bg-slate-200 dark:bg-slate-700" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900" />
      ))}
    </div>
  );
}
