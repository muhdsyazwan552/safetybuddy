import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
  ArrowRight, CalendarDays, Check, CheckCircle2, Clock3,
  History, Package, Phone, ShieldCheck,
} from 'lucide-react';
import { confirmLogout } from '@/Helpers/logout';

const common = [
  'All Safety Buddy features',
  'Contractor Portal',
  'Unlimited projects and contractor companies',
  'Unlimited safety inspections and toolbox talk records',
  'Unlimited NCR/CC transactions',
];

const money = value => value === null || value === undefined ? '—' : `RM ${Number(value).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function PlanCard({ plan, pending, hasActiveSafety, canPurchase }) {
  const form = useForm({ plan_id: plan.id });
  const popular = plan.code === 'PROFESSIONAL';
  const features = [
    `${plan.manager_limit} Manager`,
    `${plan.supervisor_limit} Supervisor`,
    `${plan.inspector_limit} Inspector${plan.inspector_limit > 1 ? 's' : ''}`,
    `${plan.contractor_limit ?? 1} Contractor${(plan.contractor_limit ?? 1) > 1 ? 's' : ''}`,
    plan.daily_pdf_limit === null ? 'Unlimited Daily Report PDFs' : `${plan.daily_pdf_limit} Daily Report PDFs / month (shared)`,
    plan.monthly_pdf_limit === null ? 'Unlimited Monthly Report PDFs' : `${plan.monthly_pdf_limit} Monthly Report PDFs / month (shared)`,
    ...common,
  ];

  return <article className={`relative flex h-full flex-col rounded-[26px] border p-7 shadow-sm ${popular ? 'border-brand-400 bg-ink-950 text-white shadow-xl' : 'border-ink-100 bg-white text-ink-950'}`}>
    {popular && <span className="absolute right-6 top-6 rounded-full bg-brand-400 px-3 py-1 text-xs font-black text-ink-950">POPULAR</span>}
    <p className={`text-xs font-black uppercase tracking-[.2em] ${popular ? 'text-brand-300' : 'text-brand-800'}`}>Safety Buddy package</p>
    <h3 className="mt-3 text-3xl font-black">{plan.name}</h3>
    <div className="mt-6 border-b border-current/10 pb-6"><span className="text-4xl font-black">RM {Number(plan.price_yearly).toLocaleString('en-MY')}</span><span className="ml-2 text-sm opacity-70">/ year</span></div>
    <ul className="mt-6 flex-1 space-y-3 text-sm">{features.map(feature => <li key={feature} className="flex items-start gap-3"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${popular ? 'text-brand-300' : 'text-emerald-600'}`} strokeWidth={3}/><span>{feature}</span></li>)}</ul>
    <form onSubmit={event => { event.preventDefault(); form.post('/plans/request'); }} className="mt-8">
      <button disabled={!canPurchase || pending || hasActiveSafety || form.processing} className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${popular ? 'bg-brand-400 text-ink-950 hover:bg-brand-300' : 'bg-ink-950 text-white hover:bg-ink-800'}`}>
        {!canPurchase ? 'Contact your company admin' : hasActiveSafety ? 'Current subscription active' : pending ? 'Request pending' : form.processing ? 'Sending…' : 'Request purchase'} <ArrowRight className="h-4 w-4"/>
      </button>
      {form.errors.plan_id && <p className="mt-2 text-sm text-rose-600">{form.errors.plan_id}</p>}
    </form>
  </article>;
}

function CurrentPackage({ currentPackage, dashboard }) {
  if (!currentPackage) return <section className="rounded-[28px] border border-dashed border-ink-200 bg-white p-7 sm:p-9">
    <div className="flex items-start gap-4"><span className="rounded-2xl bg-brand-100 p-3 text-ink-950"><Package className="h-6 w-6"/></span><div><h2 className="text-xl font-black text-ink-950">No Safety Buddy package yet</h2><p className="mt-2 text-sm text-ink-500">Choose a package below to start your Safety Buddy subscription.</p></div></div>
  </section>;

  const active = currentPackage.status === 'active';
  return <section className="relative overflow-hidden rounded-[28px] bg-ink-950 p-7 text-white sm:p-9">
    <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full border border-brand-400/20"/><div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border border-brand-400/20"/>
    <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
      <div>
        <p className="text-xs font-black uppercase tracking-[.22em] text-brand-300">{active ? 'Current package' : 'Previous package'}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3"><h2 className="text-3xl font-black sm:text-4xl">{currentPackage.package_name}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-orange-400/15 text-orange-200'}`}>{active ? 'Active' : 'Expired'}</span></div>
        <p className="mt-3 text-sm text-white/55">{currentPackage.module_name || 'Safety Buddy'} · {currentPackage.type === 'renew' ? 'Renewal' : 'Annual subscription'}</p>
        <div className="mt-7 grid gap-5 sm:grid-cols-3">
          <div><p className="text-xs uppercase tracking-wider text-white/45">Started</p><p className="mt-1 font-bold">{date(currentPackage.start_date)}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-white/45">Expiry date</p><p className="mt-1 font-bold text-brand-300">{date(currentPackage.end_date)}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-white/45">Package amount</p><p className="mt-1 font-bold">{money(currentPackage.amount)}</p></div>
        </div>
      </div>
      <div className="flex flex-col items-start gap-3 lg:items-end">
        {active && currentPackage.days_remaining !== null && <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/65"><CalendarDays className="h-4 w-4 text-brand-300"/>{currentPackage.days_remaining === 0 ? 'Expires today' : `${currentPackage.days_remaining} days remaining`}</span>}
        <Link href={active ? dashboard : '#available-plans'} className="inline-flex items-center gap-2 rounded-full bg-brand-400 px-5 py-3 text-sm font-black text-ink-950 transition hover:bg-brand-300">{active ? 'Go to dashboard' : 'Renew package'} <ArrowRight className="h-4 w-4"/></Link>
      </div>
    </div>
  </section>;
}

function InspectorAddon({ seats, canPurchase }) {
  const form = useForm({ quantity: 1 });
  const qty = Math.max(0, Number(form.data.quantity) || 0);
  const total = qty * seats.price;
  const limit = seats.included + seats.extra;

  return <section className="mt-10 rounded-[28px] border border-brand-300 bg-white p-7 shadow-sm sm:p-9" aria-labelledby="addon-title">
    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-xl">
        <p className="text-xs font-black uppercase tracking-[.2em] text-brand-800">Optional add-on · any package</p>
        <h2 id="addon-title" className="mt-2 text-2xl font-black">Extra Inspectors</h2>
        <p className="mt-2 text-sm text-ink-500">Your package includes {seats.included} Inspector{seats.included === 1 ? '' : 's'}. Need more? Add Inspector seats for <strong className="text-ink-900">RM {seats.price} per user</strong>, paid once. The seats are available straight away and stay with your company when you renew.</p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-ink-50 p-3"><p className="text-2xl font-black">{seats.included}</p><p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Included</p></div>
          <div className="rounded-2xl bg-ink-50 p-3"><p className="text-2xl font-black">{seats.extra}</p><p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Extra bought</p></div>
          <div className="rounded-2xl bg-ink-50 p-3"><p className="text-2xl font-black">{seats.used}<span className="text-base text-ink-400"> / {limit}</span></p><p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">In use</p></div>
        </div>
      </div>
      {canPurchase ? <form onSubmit={event => { event.preventDefault(); form.post('/plans/inspector-addon', { preserveScroll: true, onSuccess: () => form.reset() }); }} className="w-full shrink-0 rounded-2xl bg-ink-950 p-6 text-white lg:w-80">
        <label htmlFor="addon-qty" className="text-xs font-bold uppercase tracking-wider text-white/60">Extra Inspectors</label>
        <input id="addon-qty" type="number" min="1" max="50" value={form.data.quantity} onChange={event => form.setData('quantity', event.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-lg font-bold text-white"/>
        <p className="mt-4 flex items-baseline justify-between"><span className="text-sm text-white/60">{qty} × RM {seats.price}</span><span className="text-2xl font-black text-brand-300">RM {total.toLocaleString('en-MY')}</span></p>
        <button disabled={form.processing || qty < 1} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-400 px-5 py-3 font-black text-ink-950 transition hover:bg-brand-300 disabled:opacity-50">{form.processing ? 'Adding…' : 'Add Inspectors'} <ArrowRight className="h-4 w-4"/></button>
        {form.errors.quantity && <p className="mt-2 text-sm text-rose-300">{form.errors.quantity}</p>}
      </form> : <p className="rounded-2xl bg-ink-50 p-5 text-sm text-ink-500 lg:w-80">Only your company admin can buy extra Inspectors.</p>}
    </div>
    {seats.purchases.length > 0 && <div className="mt-6 border-t border-ink-100 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-ink-400">Add-on purchases</p><ul className="mt-2 divide-y divide-ink-100 text-sm">{seats.purchases.map(p => <li key={p.id} className="flex justify-between py-2"><span>{date(p.date)} · {p.quantity} Inspector{p.quantity > 1 ? 's' : ''}</span><strong>{money(p.total_amount)}</strong></li>)}</ul></div>}
  </section>;
}

function SubscriptionHistory({ history }) {
  if (!history.length) return null;
  return <section className="mt-10" aria-labelledby="history-title">
    <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-brand-100 p-2.5 text-ink-950"><History className="h-5 w-5"/></span><div><h2 id="history-title" className="text-xl font-black text-ink-950">Subscription history</h2><p className="text-sm text-ink-500">All subscription periods recorded for your company.</p></div></div>
    <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-sm"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-ink-50 text-xs font-bold uppercase tracking-wider text-ink-400"><tr><th className="px-5 py-4">Package / module</th><th className="px-5 py-4">Started</th><th className="px-5 py-4">Expires</th><th className="px-5 py-4">Amount</th><th className="px-5 py-4">Status</th></tr></thead><tbody className="divide-y divide-ink-100">{history.map(item => <tr key={item.id}><td className="px-5 py-4"><strong className="block text-ink-900">{item.package_name}</strong><span className="text-xs text-ink-400">{item.type === 'renew' ? 'Renewal' : 'New subscription'}{item.module_name && item.module_name !== item.package_name ? ` · ${item.module_name}` : ''}</span></td><td className="whitespace-nowrap px-5 py-4 text-ink-600">{date(item.start_date)}</td><td className="whitespace-nowrap px-5 py-4 font-semibold text-ink-900">{date(item.end_date)}</td><td className="whitespace-nowrap px-5 py-4 text-ink-600">{money(item.amount)}{!item.payment_recorded && <span className="block text-xs text-ink-400">Payment record unavailable</span>}</td><td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${item.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>{item.status === 'active' ? <CheckCircle2 className="h-3.5 w-3.5"/> : <Clock3 className="h-3.5 w-3.5"/>}{item.status === 'active' ? 'Active' : 'Expired'}</span></td></tr>)}</tbody></table></div>
  </section>;
}

export default function Plans({ plans = [], hasPurchased = false, hasActiveSafety = false, canPurchase = true, currentPackage = null, subscriptionHistory = [], latestRequest = null, inspectorSeats = null }) {
  const { flash = {}, auth } = usePage().props;
  const pending = latestRequest?.status === 'pending';
  const expired = hasPurchased && !hasActiveSafety;
  const [showExpiryModal, setShowExpiryModal] = useState(expired);
  const dashboard = [3, 4].includes(auth?.user?.role_id) ? '/review/dashboard' : [7, 8].includes(auth?.user?.role_id) ? '/inspector/dashboard' : '/dashboard';

  return <><Head title={hasPurchased ? 'Manage packages · Safety Buddy' : 'Safety Buddy packages'}/><main className="min-h-screen bg-[#F5F6F3] text-ink-950">
    <header className="border-b border-ink-100 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8"><Link href="/" className="flex items-center gap-3 font-black"><ShieldCheck className="h-9 w-9 text-brand-700"/> SAFETY BUDDY</Link><div className="flex items-center gap-4 text-sm font-semibold">{hasActiveSafety && <Link href={dashboard} className="text-brand-800 hover:underline">Dashboard</Link>}<button onClick={() => confirmLogout()} className="text-ink-500 hover:text-ink-950">Log out</button></div></div></header>
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="max-w-2xl"><p className="text-xs font-black uppercase tracking-[.25em] text-brand-800">Control · Performance · Report</p><h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{hasPurchased ? 'Manage packages' : 'Choose your package'}</h1><p className="mt-4 text-ink-500">{hasPurchased ? 'Review your current Safety Buddy package, expiry date and subscription history.' : 'Choose one annual package for your company. Your dashboard opens after payment is confirmed.'}</p></div>
      {flash.success && <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{flash.success}</div>}
      {pending && <div className="mt-7 flex items-start gap-3 rounded-xl border border-brand-300 bg-brand-50 p-4 text-sm text-ink-800"><Clock3 className="mt-0.5 h-5 w-5 shrink-0"/><div><strong>{latestRequest.plan?.name} request pending.</strong> Contact Ramzi at <a href="tel:+60168865619" className="font-bold underline">016-8865619</a> to arrange payment. Access begins after payment is verified.</div></div>}
      {latestRequest?.status === 'rejected' && <div className="mt-7 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Your previous request was not approved. You can choose a package again.</div>}

      {hasPurchased && <div className="mt-9"><CurrentPackage currentPackage={currentPackage} dashboard={dashboard}/>{inspectorSeats && <InspectorAddon seats={inspectorSeats} canPurchase={canPurchase}/>}<SubscriptionHistory history={subscriptionHistory}/></div>}

      <section id="available-plans" className={hasPurchased ? 'mt-14 scroll-mt-8' : 'mt-12'}><div className="mb-6"><p className="text-xs font-black uppercase tracking-[.2em] text-brand-800">Safety Buddy</p><h2 className="mt-2 text-2xl font-black">{hasPurchased ? 'Available packages' : 'Select a package'}</h2>{hasActiveSafety && <p className="mt-2 text-sm text-ink-500">Your current package is active. Contact Ramzi if you would like to change it before expiry.</p>}</div><div className="grid gap-6 lg:grid-cols-3">{plans.map(plan => <PlanCard key={plan.id} plan={plan} pending={pending} hasActiveSafety={hasActiveSafety} canPurchase={canPurchase}/>)}</div></section>
      <div className="mt-9 grid gap-4 rounded-2xl border border-ink-100 bg-white p-6 text-sm text-ink-500 sm:grid-cols-2"><p><strong className="text-ink-900">Additional Inspector:</strong> optional on any package, RM800 per Inspector, paid once. Added instantly from this page after your package is active.</p><p><strong className="text-ink-900">Training:</strong> Self-learning user manual is included. Formal training certificate is not included.</p></div>
      <p className="mt-7 flex items-center justify-center gap-2 text-sm text-ink-400"><Phone className="h-4 w-4"/> Questions? Ramzi <a href="tel:+60168865619" className="font-semibold text-brand-800">016-8865619</a></p>
    </div>
  </main>
    {showExpiryModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/75 p-5" role="presentation">
      <div role="alertdialog" aria-modal="true" aria-labelledby="expiry-title" aria-describedby="expiry-description" className="w-full max-w-md rounded-3xl bg-white p-7 text-ink-950 shadow-2xl sm:p-9">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-700"><CalendarDays className="h-6 w-6"/></span>
        <h2 id="expiry-title" className="mt-5 text-2xl font-black">Subscription expired</h2>
        <p id="expiry-description" className="mt-3 text-sm leading-6 text-ink-500">Payment must be confirmed before you can use Safety Buddy again. {canPurchase ? 'Choose a package below and contact Ramzi to arrange payment.' : 'Contact your company admin to renew the package and arrange payment.'}</p>
        {pending && <p className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-ink-800">Your renewal request is pending. Contact Ramzi at <a href="tel:+60168865619" className="font-bold underline">016-8865619</a> to arrange payment.</p>}
        <div className="mt-7 flex flex-wrap gap-3">{canPurchase && !pending && <button type="button" onClick={() => { setShowExpiryModal(false); document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-full bg-brand-400 px-5 py-3 text-sm font-black text-ink-950">Choose a package</button>}<a href="tel:+60168865619" className="rounded-full border border-ink-200 px-5 py-3 text-sm font-bold">Call Ramzi</a><button type="button" onClick={() => setShowExpiryModal(false)} className="rounded-full border border-ink-200 px-5 py-3 text-sm font-bold">View package details</button></div>
      </div>
    </div>}
  </>;
}
