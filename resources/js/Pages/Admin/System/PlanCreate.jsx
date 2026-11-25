import BackLink from '@/Components/shared/BackLink';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import SystemAdminLayout from '@/Layouts/SystemAdminLayout';

const input = 'mt-1 w-full rounded-xl border-slate-200 text-sm focus:border-brand-500 focus:ring-brand-500';
const Field = ({ label, children }) => <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">{label}{children}</label>;

export default function PlanCreate({ title }) {
  const form = useForm({
    code: '', name: '', price_yearly: '', provider_price_yearly: '',
    manager_limit: 1, supervisor_limit: 1, inspector_limit: 1, contractor_limit: 1,
    daily_pdf_limit: '', monthly_pdf_limit: '',
  });
  const submit = event => { event.preventDefault(); form.post(route('system.admin.plans.store')); };

  return <><Head title={title} /><SystemAdminLayout title={title} description="Set pricing, included seats, and report limits for a new plan." width="max-w-4xl">
    <BackLink href="/admin/packages" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-ink-900"><ArrowLeft size={17} /> Back</BackLink>
    <form onSubmit={submit} className="space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div><h2 className="text-lg font-bold text-ink-900">Plan details</h2><p className="mt-1 text-sm text-ink-500">The plan is added as an active Standard plan. Its code stays fixed after creation.</p><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Plan code"><input className={input} value={form.data.code} onChange={e => form.setData('code', e.target.value.toUpperCase())} maxLength={50} placeholder="E.g. STARTER_PLUS" required /></Field><Field label="Plan name"><input className={input} value={form.data.name} onChange={e => form.setData('name', e.target.value)} maxLength={100} required /></Field><Field label="Yearly price (RM)"><input type="number" min="0" step="1" className={input} value={form.data.price_yearly} onChange={e => form.setData('price_yearly', e.target.value)} required /></Field><Field label="Training Provider price (RM)"><input type="number" min="0" step="1" className={input} value={form.data.provider_price_yearly} onChange={e => form.setData('provider_price_yearly', e.target.value)} placeholder="Use yearly price" /></Field></div></div>
      <div className="border-t border-slate-100 pt-6"><h2 className="font-bold text-ink-900">Included seats</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['manager_limit', 'Managers'], ['supervisor_limit', 'Supervisors'], ['inspector_limit', 'Inspectors'], ['contractor_limit', 'Contractors']].map(([key, label]) => <Field key={key} label={label}><input type="number" min="0" max="65535" className={input} value={form.data[key]} onChange={e => form.setData(key, e.target.value)} required /></Field>)}</div></div>
      <div className="border-t border-slate-100 pt-6"><h2 className="font-bold text-ink-900">Report limits</h2><p className="mt-1 text-sm text-ink-500">Leave blank for unlimited reports.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{[['daily_pdf_limit', 'Daily PDFs per month'], ['monthly_pdf_limit', 'Monthly PDFs per month']].map(([key, label]) => <Field key={key} label={label}><input type="number" min="0" max="65535" className={input} value={form.data[key]} onChange={e => form.setData(key, e.target.value)} /></Field>)}</div></div>
      {Object.entries(form.errors).map(([key, error]) => <p key={key} className="text-xs font-medium text-red-700">{error}</p>)}
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6"><Link href="/admin/packages" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-ink-600 hover:bg-slate-50">Cancel</Link><button disabled={form.processing} className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-50">{form.processing ? 'Creating…' : 'Create plan'}</button></div>
    </form>
  </SystemAdminLayout></>;
}
