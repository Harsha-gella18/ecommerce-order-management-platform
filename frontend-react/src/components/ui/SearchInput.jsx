import { Search } from 'lucide-react';

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-navy dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-none transition-shadow"
      />
    </div>
  );
}
