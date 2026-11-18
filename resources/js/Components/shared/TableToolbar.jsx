import React from 'react';
import { Search, X } from 'lucide-react';

/** Search box + filters + result count, placed directly above a table header. `children` are the filter controls. */
export default function TableToolbar({ search = '', onSearch, placeholder = 'Search…', count = null, noun = 'result', onClear = null, children }) {
  return <div className="flex flex-wrap items-end gap-3 border-b border-gray-100 bg-white px-5 py-4">
    <label className="relative min-w-[220px] flex-1 sm:max-w-sm">
      <span className="sr-only">{placeholder}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input type="search" value={search} onChange={event => onSearch(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200" />
      {search && <button type="button" onClick={() => onSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-700"><X className="h-4 w-4" /></button>}
    </label>
    {children}
    {onClear && <button type="button" onClick={onClear} className="pb-2.5 text-sm font-semibold text-gray-500 underline hover:text-gray-900">Clear filters</button>}
    {count !== null && <p className="ml-auto pb-2.5 text-sm text-gray-500">{count} {count === 1 ? noun : `${noun}s`}</p>}
  </div>;
}

/** Filter select used inside TableToolbar. */
export function ToolbarSelect({ label, value, onChange, children }) {
  return <label className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}
    <select value={value} onChange={event => onChange(event.target.value)} className="mt-1 block min-w-[150px] rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm font-semibold normal-case tracking-normal text-gray-900">{children}</select>
  </label>;
}

/** Case-insensitive match of every word of the query against the given text parts. */
export const matchesSearch = (query, ...parts) => {
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = parts.filter(part => part != null).join(' ').toLowerCase();
  return words.every(word => haystack.includes(word));
};
