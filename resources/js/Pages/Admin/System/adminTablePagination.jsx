import { useEffect, useState } from 'react';

export function useAdminTablePagination(rows, pageSize = 10, resetKey = '') {
  const [requestedPage, setRequestedPage] = useState(1);
  useEffect(() => setRequestedPage(1), [resetKey]);
  const total = rows.length;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, lastPage);
  const from = total ? (page - 1) * pageSize + 1 : 0;

  return {
    rows: rows.slice(from - (total ? 1 : 0), page * pageSize),
    from,
    to: Math.min(page * pageSize, total),
    total,
    page,
    lastPage,
    setPage: setRequestedPage,
  };
}

export function AdminTablePagination({ pagination }) {
  if (!pagination || pagination.lastPage <= 1) return null;

  const { from, to, total, page, lastPage, setPage } = pagination;
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm">
    <span className="text-ink-500">Showing {from}–{to} of {total}</span>
    <div className="flex items-center gap-2">
      <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-ink-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Previous</button>
      <span className="px-1 text-ink-500">Page {page} of {lastPage}</span>
      <button type="button" disabled={page === lastPage} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 text-ink-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Next</button>
    </div>
  </div>;
}
