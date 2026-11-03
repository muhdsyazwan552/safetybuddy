import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';

const rm = value => `RM ${Number(value).toLocaleString('en-MY')}`;
function PlanOrder({ plan }) {
  const form = useForm({ plan_id: plan.id, quantity: 1 });
  const total = plan.price * Math.max(0, Number(form.data.quantity) || 0);
  const submit = event => { event.preventDefault(); form.post('/training-provider/packages', { preserveScroll: true, onSuccess: () => form.reset('quantity') }); };

  return <form onSubmit={submit} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
    <p className="mt-3 text-3xl font-bold tracking-tight">{rm(plan.price)}<span className="ml-1 text-sm font-normal text-gray-500">/ year each</span></p>
    {plan.price !== plan.normal_price && <p className="text-xs text-gray-400">Normal price <span className="line-through">{rm(plan.normal_price)}</span></p>}
    <p className="mt-3 text-sm text-gray-500">{plan.manager_limit} Manager · {plan.supervisor_limit} Supervisor · {plan.inspector_limit} Inspector · {plan.contractor_limit ?? 1} Contractor</p>
    <label className="mt-5 text-xs font-bold uppercase tracking-wider text-gray-500">Number of packages
      <input type="number" min="1" max="20" value={form.data.quantity} onChange={event => form.setData('quantity', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base font-semibold normal-case tracking-normal"/>
    </label>
    <p className="mt-4 flex items-baseline justify-between text-sm text-gray-500"><span>Total</span><strong className="text-xl text-gray-900">{rm(total)}</strong></p>
    <button disabled={form.processing || total < 1} className="mt-4 rounded-xl bg-ink-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-ink-800 disabled:opacity-50">{form.processing ? 'Sending…' : 'Buy package'}</button>
    {(form.errors.quantity || form.errors.plan_id) && <p className="mt-2 text-sm text-rose-600">{form.errors.quantity || form.errors.plan_id}</p>}
  </form>;
}

const TRAINEE_STATE = {
  no_package: 'No package yet',
  expired: 'Expired',
  active: 'Active',
};

/** Renews the package of one company under this provider: the code works for that company only. */
function RenewOrder({ plan, trainees, windowDays }) {
  const form = useForm({ plan_id: plan.id, quantity: 1, company_id: '' });
  const chosen = trainees.find(trainee => String(trainee.id) === String(form.data.company_id));
  const submit = event => { event.preventDefault(); form.post('/training-provider/packages', { preserveScroll: true, onSuccess: () => form.reset('company_id') }); };
  const hint = trainee => trainee.end_date
    ? (trainee.state === 'expired' ? `expired ${trainee.end_date}` : `ends ${trainee.end_date}`)
    : 'no package yet';

  return <form onSubmit={submit} className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="text-xl font-bold text-gray-900">Renew a package</h3>
    <p className="mt-2 text-sm text-gray-500">Renew {plan.name} for a company under you. The code works for that company only, and the new year starts when its current package ends. Renewal opens {windowDays} days before the end date.</p>
    <label className="mt-5 text-xs font-bold uppercase tracking-wider text-gray-500">Company
      <select value={form.data.company_id} onChange={event => form.setData('company_id', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base font-semibold normal-case tracking-normal">
        <option value="">{trainees.length ? 'Choose a company' : 'No companies registered under you yet'}</option>
        {trainees.map(trainee => <option key={trainee.id} value={trainee.id} disabled={!trainee.can_renew}>{trainee.name} · {hint(trainee)}{trainee.can_renew ? '' : ' (not yet)'}</option>)}
      </select>
    </label>
    {chosen && <p className="mt-3 text-xs text-gray-500">{TRAINEE_STATE[chosen.state]}{chosen.end_date ? ` · ${chosen.state === 'expired' ? 'ended' : 'ends'} ${chosen.end_date}` : ''}</p>}
    <p className="mt-4 flex items-baseline justify-between text-sm text-gray-500"><span>Total</span><strong className="text-xl text-gray-900">{rm(plan.price)}</strong></p>
    <button disabled={form.processing || !form.data.company_id} className="mt-4 rounded-xl bg-brand-400 px-5 py-3 text-sm font-bold text-ink-900 transition hover:bg-brand-300 disabled:opacity-50">{form.processing ? 'Sending…' : 'Renew package'}</button>
    {form.errors.company_id && <p className="mt-2 text-sm text-rose-600">{form.errors.company_id}</p>}
  </form>;
}

export default function ProviderPackages({ plans = [], trainees = [], renewWindowDays = 90, codeCounts = {} }) {
  const { flash = {} } = usePage().props;
  const plan = plans[0];
  const codeTotal = Object.values(codeCounts).reduce((sum, value) => sum + Number(value), 0);

  return <AppLayout title="Buy Package">
    <Head title="Buy Package"/>
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-ink-900 p-6 text-white">
        <div>
          <h2 className="text-xl font-bold">Buy or renew packages for companies under you</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-300">Each package you buy creates one activation code. Once payment is confirmed the code appears in your log. Give it to a company: when they enter it, their package activates for one year. To extend a company that is already running, renew it for that company.</p>
        </div>
        
      </section>
      {flash.success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{flash.success}</div>}

      {plan
        ? <section className="grid gap-5 md:grid-cols-2"><PlanOrder plan={plan}/><RenewOrder plan={plan} trainees={trainees} windowDays={renewWindowDays}/></section>
        : <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">No package is available to buy yet.</p>}

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-bold text-gray-900">Your activation codes</h2>
          <p className="mt-1 text-sm text-gray-500">{codeTotal} bought · <b className="text-emerald-700">{Number(codeCounts.available ?? 0)}</b> available · <b className="text-amber-700">{Number(codeCounts.pending ?? 0)}</b> awaiting payment · {Number(codeCounts.used ?? 0)} used</p>
        </div>
        <Link href="/training-provider/activation-codes" className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800">View purchase &amp; renewal log</Link>
      </section>
    </div>
  </AppLayout>;
}
