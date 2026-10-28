import React from 'react';
import { router, useForm } from '@inertiajs/react';

const input = 'w-full rounded-lg border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600';

export default function PlanRequests({ requests = [], plans = [] }) {
  const form = useForm({ code: '', name: '', price_yearly: '', manager_limit: 1, supervisor_limit: 1, inspector_limit: 1, daily_pdf_limit: '', monthly_pdf_limit: '' });
  const submit = e => { e.preventDefault(); form.post('/admin/subscription-plans', { onSuccess: () => form.reset() }); };
  const confirmPayment = request => {
    if (window.confirm(`Confirm payment of RM ${request.price_yearly} for ${request.company?.name} and activate ${request.plan?.name}?`)) {
      router.post(`/admin/plan-requests/${request.id}/approve`);
    }
  };

  return <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-800">Purchase requests</h2>
      <p className="mt-1 text-sm text-slate-500">Only confirm after payment has been verified outside the app.</p>
      <div className="mt-5 space-y-3">{requests.length ? requests.map(request => <div key={request.id} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
        <div><p className="font-semibold text-slate-800">{request.company?.name ?? `Company #${request.company_id}`}</p><p className="text-sm text-slate-500">{request.plan?.name} · RM {Number(request.price_yearly).toLocaleString('en-MY')} / year</p><p className="mt-1 text-xs text-slate-400">{new Date(request.created_at).toLocaleString('en-MY')} · <span className="capitalize">{request.status}</span></p></div>
        {request.status === 'pending' && <div className="flex gap-2"><button onClick={() => confirmPayment(request)} className="rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-800">Confirm payment</button><button onClick={() => router.post(`/admin/plan-requests/${request.id}/reject`)} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Reject</button></div>}
      </div>) : <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">No purchase requests yet.</p>}</div>
    </section>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-bold text-slate-800">Safety Buddy plans</h2>
      <p className="mt-1 text-sm text-slate-500">New plans appear on the public website and first-purchase page.</p>
      <div className="mt-4 flex flex-wrap gap-2">{plans.map(plan => <span key={plan.id} className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800">{plan.name} · RM {Number(plan.price_yearly).toLocaleString('en-MY')}</span>)}</div>
      <form onSubmit={submit} className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">
        <label className="col-span-2 text-xs font-semibold text-slate-600">Code<input className={`${input} mt-1`} value={form.data.code} onChange={e => form.setData('code', e.target.value.toUpperCase())} required/></label>
        <label className="col-span-2 text-xs font-semibold text-slate-600">Plan name<input className={`${input} mt-1`} value={form.data.name} onChange={e => form.setData('name', e.target.value)} required/></label>
        {[['price_yearly', 'Yearly price (RM)'], ['manager_limit', 'Managers'], ['supervisor_limit', 'Supervisors'], ['inspector_limit', 'Inspectors'], ['daily_pdf_limit', 'Daily PDFs / month (blank = unlimited)'], ['monthly_pdf_limit', 'Monthly PDFs / month (blank = unlimited)']].map(([key, label]) => <label key={key} className="text-xs font-semibold text-slate-600">{label}<input type="number" min="0" className={`${input} mt-1`} value={form.data[key]} onChange={e => form.setData(key, e.target.value)} required={!key.endsWith('pdf_limit')}/></label>)}
        {Object.values(form.errors).map(error => <p key={error} className="col-span-2 text-xs text-red-600">{error}</p>)}
        <button disabled={form.processing} className="col-span-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-50">Add plan</button>
      </form>
    </section>
  </div>;
}
