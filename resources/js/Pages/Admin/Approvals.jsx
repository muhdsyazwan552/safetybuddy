import { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import SystemAdminLayout from '@/Layouts/SystemAdminLayout';
import { StatusBadge } from './companyUi';
import { AdminTablePagination, useAdminTablePagination } from './adminTablePagination';

const money = value => `RM ${Number(value || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

export default function Approvals({ title, planRequests }) {
  const { flash = {}, errors = {} } = usePage().props;
  const [selected, setSelected] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const rows = statusFilter ? planRequests.filter(item => item.status === statusFilter) : planRequests;
  const pending = planRequests.filter(item => item.status === 'pending').length;
  const pagination = useAdminTablePagination(rows, 10, statusFilter);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = event => { if (event.key === 'Escape') setSelected(null); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [selected]);

  const approve = () => {
    if (!selected || processing) return;
    setProcessing(true);
    router.post(route('system.admin.plan-requests.approve', selected.id), {}, {
      preserveScroll: true,
      onSuccess: () => setSelected(null),
      onFinish: () => setProcessing(false),
    });
  };
  const reject = request => {
    if (window.confirm(`Reject the subscription request from ${request.company?.name || `Company #${request.company_id}`}?`)) {
      router.post(route('system.admin.plan-requests.reject', request.id), {}, { preserveScroll: true });
    }
  };

  return <><Head title={title} /><SystemAdminLayout title={title} description="Review company subscription purchase requests and confirm verified payments.">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4"><p className="text-sm font-semibold text-brand-900">{pending} subscription request{pending === 1 ? '' : 's'} awaiting approval</p><Link href="/admin/subscriptions" className="text-sm font-semibold text-ink-800 hover:underline">View subscriptions →</Link></div>
    {flash.success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{flash.success}</div>}
    {Object.entries(errors).map(([key, value]) => <p key={key} className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{value}</p>)}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 p-5 sm:p-6"><div><h2 className="text-lg font-bold text-ink-900">Subscription requests</h2><p className="mt-1 text-sm text-ink-500">Confirm payment only after checking it outside the app.</p></div><label className="text-xs font-semibold text-ink-500">Status<select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="mt-1 block rounded-xl border-slate-200 text-sm focus:border-brand-500 focus:ring-brand-500"><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></label></div>
      <div className="overflow-x-auto"><table className="min-w-[800px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-ink-400"><tr><th className="px-5 py-3">#</th><th className="px-5 py-3">Company</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Requested</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{pagination.rows.map((request, index) => <tr key={request.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 text-ink-400">{pagination.from + index}</td><td className="px-5 py-4"><p className="font-semibold text-ink-900">{request.company?.name || `Company #${request.company_id}`}</p><p className="mt-0.5 text-xs text-ink-400">{request.company?.code || `#${request.company_id}`}</p></td><td className="px-5 py-4"><p className="font-medium text-ink-800">{request.plan?.name || 'Unknown plan'}</p><p className="text-xs text-ink-400">{request.plan?.code}</p></td><td className="px-5 py-4 font-semibold text-ink-800">{money(request.price_yearly)}</td><td className="whitespace-nowrap px-5 py-4 text-ink-500">{request.created_at ? new Date(request.created_at).toLocaleString('en-MY') : '—'}</td><td className="px-5 py-4"><StatusBadge status={request.status} /></td><td className="px-5 py-4 text-right">{request.status === 'pending' && <div className="flex justify-end gap-2"><button type="button" onClick={() => setSelected(request)} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800">Approve</button><button type="button" onClick={() => reject(request)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Reject</button></div>}</td></tr>)}{!rows.length && <tr><td colSpan="7" className="px-5 py-12 text-center text-ink-500">No subscription requests found.</td></tr>}</tbody></table></div><AdminTablePagination pagination={pagination} />
    </section>
    {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}><div role="dialog" aria-modal="true" aria-labelledby="confirm-approval-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="confirm-approval-title" className="text-lg font-bold text-ink-900">Confirm subscription approval</h2><p className="mt-3 text-sm text-ink-600">Confirm that payment of <strong>{money(selected.price_yearly)}</strong> from <strong>{selected.company?.name || `Company #${selected.company_id}`}</strong> has been verified. This will activate the <strong>{selected.plan?.name || 'selected'}</strong> plan.</p><div className="mt-6 flex justify-end gap-3"><button type="button" autoFocus onClick={() => setSelected(null)} disabled={processing} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-slate-50">Cancel</button><button type="button" onClick={approve} disabled={processing} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{processing ? 'Approving…' : 'Confirm approval'}</button></div></div></div>}
  </SystemAdminLayout></>;
}
