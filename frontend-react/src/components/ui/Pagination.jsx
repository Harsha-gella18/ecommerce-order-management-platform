import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-2 mt-8" aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="p-2 rounded-xl border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300 px-3">
        Page {page} of {totalPages}
      </span>
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="p-2 rounded-xl border border-slate-200 dark:border-slate-600 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
        aria-label="Next page"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </nav>
  );
}
