import BackLink from '@/Components/shared/BackLink';
import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import SystemAdminLayout from '@/Layouts/SystemAdminLayout';
import DateInput from '@/Components/shared/DateInput';

const date = new Date().toLocaleDateString('en-CA');
const nextYear = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-CA');
const input = 'mt-1 w-full rounded-xl border-slate-200 text-sm focus:border-brand-500 focus:ring-brand-500';
const Field = ({ label, children }) => <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">{label}{children}</label>;

export default function SubscriptionCreate({ title, companies, packages, subscriptionPlans, renew }) {
  const form = useForm({
    company_id: renew?.company_id || '', module_id: renew?.module_id || '', subscription_plan_id: renew?.subscription_plan_id || '',
    start_date: renew?.start_date || date, end_date: renew?.end_date || nextYear,
    status: 'active', type: renew ? 'renew' : 'new', total_amount: '', payment_type: 'bank_transfer', payment_status: 'not_recorded',
  });
  const selectedPackage = packages.find(item => String(item.id) === String(form.data.module_id));
  const safetyPackage = selectedPackage?.code === 'SB360-WSIS';
  const choosePackage = id => {
    const selected = packages.find(item => String(item.id) === String(id));
    form.setData({ ...form.data, module_id: id, subscription_plan_id: '', total_amount: selected ? String(selected.price) : '' });
  };
  const choosePlan = id => {
    const selected = subscriptionPlans.find(item => String(item.id) === String(id));
    form.setData({ ...form.data, subscription_plan_id: id, total_amount: selected ? String(selected.price_yearly) : '' });
  };
  const submit = event => { event.preventDefault(); form.post(route('system.admin.subscriptions.store')); };

  return <><Head title={title} /><SystemAdminLayout title={title} description="Create a new access period and optionally record a verified payment." width="max-w-5xl">
    <BackLink href="/admin/subscriptions" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-ink-900"><ArrowLeft size={17} /> Back</BackLink>
    {renew && <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">Renewing <strong>{renew.company_name}</strong> · {renew.module_name}. Dates begin after the previous period when it is still current.</div>}
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_290px]">
      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div><h2 className="text-lg font-bold text-ink-900">Subscription details</h2><p className="mt-1 text-sm text-ink-500">Each save creates a separate history record.</p></div>
        <Field label="Company"><select className={input} value={form.data.company_id} onChange={e => form.setData('company_id', e.target.value)} required><option value="">Select company</option>{companies.map(company => <option key={company.id} value={company.id}>{company.code ? `${company.code} · ` : ''}{company.name}</option>)}</select></Field>
        <Field label="Package"><select className={input} value={form.data.module_id} onChange={e => choosePackage(e.target.value)} required><option value="">Select package</option>{packages.map(item => <option key={item.id} value={item.id} disabled={item.is_active !== 'Y' && String(item.id) !== String(form.data.module_id)}>{item.name}{item.is_active !== 'Y' ? ' (inactive)' : ''}</option>)}</select></Field>
        {safetyPackage && <Field label="Safety Buddy plan"><select className={input} value={form.data.subscription_plan_id} onChange={e => choosePlan(e.target.value)} required><option value="">Select plan and employee limits</option>{subscriptionPlans.map(plan => <option key={plan.id} value={plan.id}>{plan.name} · {plan.manager_limit} Manager / {plan.supervisor_limit} Supervisor / {plan.inspector_limit} Inspector</option>)}</select></Field>}
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Start date"><DateInput  className={input} value={form.data.start_date} onChange={e => form.setData('start_date', e.target.value)} required /></Field><Field label="End date"><DateInput  min={form.data.start_date} className={input} value={form.data.end_date} onChange={e => form.setData('end_date', e.target.value)} required /></Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Type"><select className={input} value={form.data.type} onChange={e => form.setData('type', e.target.value)}><option value="new">New</option><option value="renew">Renew</option><option value="trial">Trial</option><option value="manual">Manual</option></select></Field><Field label="Access status"><select className={input} value={form.data.status} onChange={e => form.setData('status', e.target.value)}><option value="active">Active</option><option value="trial">Trial</option><option value="suspended">Suspended</option><option value="cancelled">Cancelled</option></select></Field></div>
      </section>
      <aside className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div><h2 className="text-lg font-bold text-ink-900">Payment record</h2><p className="mt-1 text-sm text-ink-500">Choose “Do not record” if payment is handled separately.</p></div><Field label="Payment status"><select className={input} value={form.data.payment_status} onChange={e => form.setData('payment_status', e.target.value)}><option value="not_recorded">Do not record</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option></select></Field>{form.data.payment_status !== 'not_recorded' && <><Field label="Amount (RM)"><input type="number" min="0" step="0.01" className={input} value={form.data.total_amount} onChange={e => form.setData('total_amount', e.target.value)} /></Field><Field label="Payment method"><input className={input} value={form.data.payment_type} onChange={e => form.setData('payment_type', e.target.value)} /></Field></>}{Object.entries(form.errors).map(([key, error]) => <p key={key} className="text-xs font-medium text-red-700">{error}</p>)}<button disabled={form.processing} className="w-full rounded-xl bg-ink-900 px-4 py-3 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-50">{form.processing ? 'Saving…' : renew ? 'Create renewal' : 'Create subscription'}</button></aside>
    </form>
  </SystemAdminLayout></>;
}
