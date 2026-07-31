import { cn } from '../lib/cn.js';

/**
 * Lightweight data table. `columns`: [{ key, header, render?, className?, align? }].
 * `rowKey`: fn(row) → key. Renders its own empty row when data is empty.
 */
export function Table({ columns, data = [], rowKey = (_r, i) => i, onRowClick, empty, className }) {
  return (
    <div className={cn('overflow-x-auto rounded-2xl border border-ink-200/70 bg-white shadow-card', className)}>
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-left">
            {columns.map((c) => (
              <th key={c.key} className={cn('px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-400', c.align === 'right' && 'text-right', c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-400">
                {empty || 'No records'}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('border-b border-ink-50 last:border-0 transition-colors', onRowClick && 'cursor-pointer hover:bg-ink-50')}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('px-4 py-3 text-ink-700', c.align === 'right' && 'text-right', c.cellClassName)}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
