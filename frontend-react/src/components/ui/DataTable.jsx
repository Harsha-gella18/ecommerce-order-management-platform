export function DataTable({ columns, rows, empty }) {
  if (!rows?.length) {
    return empty || null;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-semibold">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-4 py-3 whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {rows.map((row, i) => (
            <tr key={row.id ?? i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
              {columns.map((c) => (
                <td key={c.key} className="px-4 py-3 text-slate-700 dark:text-slate-200">
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
