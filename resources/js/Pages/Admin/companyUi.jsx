export function StatusBadge({ status }) {
  const colors = {
    active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    trial: 'bg-sky-50 text-sky-700 ring-sky-200',
    upcoming: 'bg-blue-50 text-blue-800 ring-blue-200',
    pending: 'bg-amber-50 text-amber-800 ring-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    available: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    used: 'bg-blue-50 text-blue-700 ring-blue-200',
    'partially used': 'bg-sky-50 text-sky-700 ring-sky-200',
    rejected: 'bg-rose-50 text-rose-700 ring-rose-200',
    suspended: 'bg-amber-50 text-amber-800 ring-amber-200',
    expired: 'bg-slate-100 text-slate-600 ring-slate-200',
    cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${colors[status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>{status || 'Unknown'}</span>;
}

export function Detail({ label, children }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-wider text-ink-400">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-ink-900">{children || '—'}</dd></div>;
}
