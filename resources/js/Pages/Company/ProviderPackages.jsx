import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowUpRight, Check } from 'lucide-react';
import OrderReview from '@/Components/OrderReview';
import AppLayout from '@/Pages/WSIS/Layout';

const rm = value => `RM ${Number(value).toLocaleString('en-MY')}`;
const STATUS = {
  pending: { label: 'Awaiting payment', tone: 'bg-amber-50 text-amber-800' },
  available: { label: 'Available', tone: 'bg-emerald-50 text-emerald-700' },
  used: { label: 'Used', tone: 'bg-gray-100 text-gray-600' },
  rejected: { label: 'Rejected', tone: 'bg-rose-50 text-rose-700' },
};
const FILTERS = [{ key: null, label: 'All' }, ...Object.entries(STATUS).map(([key, value]) => ({ key, label: value.label }))];

/** Copies text; falls back to a hidden textarea when the clipboard API is blocked (plain http, older browsers). */
async function copyText(value) {
  try { await navigator.clipboard.writeText(value); return true; } catch { /* try the fallback */ }
  const area = document.createElement('textarea');
  area.value = value; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
  document.body.appendChild(area); area.select();
  let ok = false;
  try { ok = document.execCommand('copy'); } catch { /* code stays visible */ }
  document.body.removeChild(area);
  return ok;
}

function CopyButton({ value }) {
  const [state, setState] = useState(null);
  const copy = async () => { setState((await copyText(value)) ? 'copied' : 'failed'); setTimeout(() => setState(null), 1800); };
  return <button type="button" onClick={copy} aria-label={`Copy activation code ${value}`} className={`rounded-md px-3 py-1 text-xs font-semibold transition ${state === 'copied' ? 'bg-emerald-100 text-emerald-800' : state === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{state === 'copied' ? 'Copied ✓' : state === 'failed' ? 'Press Ctrl+C' : 'Copy code'}</button>;
}

const TYPES = [
  { key: null, label: 'All orders' },
  { key: 'purchase', label: 'New purchases' },
  { key: 'renewal', label: 'Renewals' },
];

const NOTE = {
  pending: 'Awaiting payment confirmation',
  available: 'Paid · code ready to give to a company',
  used: 'Paid · code already used',
  rejected: 'Order rejected',
};

function Description({ code }) {
  const renewal = code.type === 'renewal';
  return <div>
    <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${renewal ? 'bg-amber-50 text-amber-800 ring-amber-100' : 'bg-blue-50 text-blue-700 ring-blue-100'}`}>{renewal ? 'Renewal' : 'New purchase'}</span>
    <p className="mt-2 font-semibold text-gray-900">{renewal ? `Renewed 1-year ${code.package} for ${code.renewal_for}` : `Bought 1 × ${code.package} (1 year) for a new company`}</p>
    <p className="mt-0.5 text-xs text-gray-500">{NOTE[code.status] ?? NOTE.pending}{code.used_by ? ` · activated by ${code.used_by}` : ''}</p>
  </div>;
}

const planSeats = plan => [
  { n: plan.manager_limit, label: 'Manager' },
  { n: plan.supervisor_limit, label: 'Supervisor' },
  { n: plan.inspector_limit, label: 'Inspector' },
  { n: plan.contractor_limit ?? 1, label: 'Contractor' },
];

const planItems = plan => [
  plan.daily_pdf_limit == null ? 'Unlimited Daily Report PDFs' : `${plan.daily_pdf_limit} Daily Report PDFs per month (shared)`,
  plan.monthly_pdf_limit == null ? 'Unlimited Monthly Report PDFs' : `${plan.monthly_pdf_limit} Monthly Report PDFs per month (shared)`,
  'All Safety Buddy modules and features',
  'Contractor Portal access',
  'Unlimited projects and contractor companies',
  'Unlimited inspections, toolbox talks and NC / CC records',
];

/** Landing-page pricing content laid out across the full width: plan details on the left, the order controls on the right. */
function PlanCard({ plan, as: Tag = 'div', onSubmit, children }) {
  return <Tag onSubmit={onSubmit} className="grid gap-10 border-t border-gray-200 pt-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-14">
    <div>
      <p className="text-3xl font-medium tracking-tight">{plan.name}</p>
      <p className="mt-1 text-sm text-gray-500">Annual package</p>
      <p className="mt-5 text-6xl font-medium tracking-[-0.06em]">RM {Number(plan.price).toLocaleString('en-MY')}<span className="ml-1 text-base font-normal tracking-normal text-gray-500">/ year</span></p>
      {plan.price !== plan.normal_price && <p className="mt-1 text-xs text-gray-400">Normal price <span className="line-through">{rm(plan.normal_price)}</span></p>}

      <p className="mt-8 text-[11px] font-bold uppercase tracking-widest text-brand-700">User accounts per package</p>
      <p className="mt-1 text-sm text-gray-500">The company that activates one package can create this many users.</p>
      <dl className="mt-3 grid grid-cols-2 divide-x divide-gray-200 rounded-xl bg-white ring-1 ring-gray-200 sm:grid-cols-4">
        {planSeats(plan).map(seat => <div key={seat.label} className="px-4 py-3 text-center">
          <dt className="text-sm text-gray-500">{seat.label}</dt>
          <dd className="text-2xl font-bold text-ink-900">{seat.n}</dd>
        </div>)}
      </dl>

      <p className="mt-8 text-[11px] font-bold uppercase tracking-widest text-brand-700">What’s included</p>
      <ul className="mt-3 grid gap-x-8 gap-y-3 text-sm md:grid-cols-2">
        {[...planItems(plan), 'Buy packages for your trainees and share activation codes'].map(item => <li key={item} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" strokeWidth={3}/> {item}</li>)}
      </ul>
    </div>
    <div className="flex flex-col lg:border-l lg:border-gray-200 lg:pl-10">{children}</div>
  </Tag>;
}

const pillButton = 'group mt-6 flex w-full items-center justify-between rounded-full bg-ink-900 py-2 pl-5 pr-2 text-sm font-semibold text-white transition hover:bg-ink-800 disabled:opacity-50';
const pillArrow = <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-400 text-ink-900 transition group-hover:rotate-45"><ArrowUpRight className="h-4 w-4"/></span>;

function PlanOrder({ plan }) {
  const form = useForm({ plan_id: plan.id, quantity: 1 });
  const total = plan.price * Math.max(0, Number(form.data.quantity) || 0);
  const [reviewing, setReviewing] = useState(false);
  const quantity = Math.max(0, Number(form.data.quantity) || 0);
  const review = event => { event.preventDefault(); if (total >= 1) setReviewing(true); };
  const confirm = () => form.post('/training-provider/packages', { preserveScroll: true, onSuccess: () => { form.reset('quantity'); setReviewing(false); } });

  return <PlanCard plan={plan} as="form" onSubmit={review}>
    {reviewing && <OrderReview
      title="Review your purchase"
      details={[
        { label: 'Order type', value: 'New purchase of contractor plan' },
        { label: 'Plan', value: plan.name },
        { label: 'Number of packages', value: `${quantity} (${quantity} activation ${quantity === 1 ? 'code' : 'codes'})` },
        { label: 'Each package includes', value: planSeats(plan).map(seat => `${seat.n} ${seat.label}`).join(' · ') },
        { label: 'Valid for', value: '1 year from the day a company activates the code' },
      ]}
      lines={[{ name: plan.name, note: 'Annual package', qty: quantity, unit: plan.price }]}
      notes={['Your order is sent to us and each package becomes one activation code.', 'Contact Ramzi at 016-8865619 to arrange payment.', 'Once payment is confirmed the codes appear under Log > Activation codes. Give a code to a company to activate it.']}
      confirmLabel="Confirm purchase" processing={form.processing} error={form.errors.quantity || form.errors.plan_id}
      onConfirm={confirm} onBack={() => setReviewing(false)}/>}
    <h3 className="text-lg font-bold text-gray-900">Buy a package</h3>
    <p className="mt-1 text-sm text-gray-500">Each package creates one activation code for a company to use for one year.</p>
    <label className="mt-5 text-xs font-bold uppercase tracking-wider text-gray-500">Number of packages
      <input type="number" min="1" max="20" value={form.data.quantity} onChange={event => form.setData('quantity', event.target.value)} className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-2.5 text-base font-semibold normal-case tracking-normal"/>
    </label>
    <p className="mt-4 flex items-baseline justify-between text-sm text-gray-500"><span>Total</span><strong className="text-xl text-gray-900">{rm(total)}</strong></p>
    <button disabled={total < 1} className={pillButton}>Review order{pillArrow}</button>
    {(form.errors.quantity || form.errors.plan_id) && <p className="mt-2 text-sm text-rose-600">{form.errors.quantity || form.errors.plan_id}</p>}
  </PlanCard>;
}

const TRAINEE_STATE = {
  no_package: { label: 'No plan yet', tone: 'bg-gray-100 text-gray-600' },
  expired: { label: 'Expired', tone: 'bg-rose-50 text-rose-700' },
  active: { label: 'Active', tone: 'bg-emerald-50 text-emerald-700' },
};

/** Renews the plan of one company under this provider: the code works for that company only. A company list, not a price card, so it never looks like a purchase. */
function RenewOrder({ plan, trainees, windowDays }) {
  const form = useForm({ plan_id: plan.id, quantity: 1, company_id: '' });
  const chosen = trainees.find(trainee => String(trainee.id) === String(form.data.company_id));
  const [reviewing, setReviewing] = useState(false);
  const review = event => { event.preventDefault(); if (chosen) setReviewing(true); };
  const confirm = () => form.post('/training-provider/packages', { preserveScroll: true, onSuccess: () => { form.reset('company_id'); setReviewing(false); } });
  const detail = trainee => {
    if (!trainee.end_date) return 'No plan has been activated yet';
    if (trainee.state === 'expired') return `Ended ${trainee.end_date}`;
    return `Ends ${trainee.end_date} · ${trainee.days_left} days left`;
  };

  return <form onSubmit={review} className="space-y-5">
    {reviewing && chosen && <OrderReview
      title="Review your renewal"
      details={[
        { label: 'Order type', value: 'Renewal of contractor plan' },
        { label: 'Company', value: chosen.name },
        { label: 'Current plan', value: chosen.end_date ? `${TRAINEE_STATE[chosen.state].label} · ${chosen.state === 'expired' ? 'ended' : 'ends'} ${chosen.end_date}` : 'No plan has been activated yet' },
        { label: 'Plan', value: plan.name },
        { label: 'Renewal period', value: chosen.state === 'active' ? '1 year, starting the day after the current plan ends' : '1 year, starting when the company activates the code' },
        { label: 'Activation code', value: `1 code, works for ${chosen.name} only` },
      ]}
      lines={[{ name: `${plan.name} renewal`, note: chosen.name, qty: 1, unit: plan.price }]}
      notes={['Your renewal order is sent to us.', 'Contact Ramzi at 016-8865619 to arrange payment.', `Once payment is confirmed the code appears under Log > Activation codes. ${chosen.name} enters it to renew.`]}
      confirmLabel="Confirm renewal" processing={form.processing} error={form.errors.company_id}
      onConfirm={confirm} onBack={() => setReviewing(false)}/>}
    <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
      <h3 className="text-lg font-bold text-amber-900">Renew a company’s plan</h3>
      <p className="mt-1 text-sm text-amber-900/80">Pick the company to renew. The new year starts when its current plan ends, and the activation code works for that company only. You can renew {windowDays} days before the end date, or any time after it has ended.</p>
    </div>

    <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
      {!trainees.length && <li className="p-8 text-center text-sm text-gray-500">No companies are registered under you yet.</li>}
      {trainees.map(trainee => {
        const state = TRAINEE_STATE[trainee.state];
        const selected = String(form.data.company_id) === String(trainee.id);
        return <li key={trainee.id}>
          <label className={`flex items-center gap-4 px-5 py-4 ${trainee.can_renew ? 'cursor-pointer hover:bg-gray-50' : 'cursor-not-allowed opacity-60'} ${selected ? 'bg-amber-50/60' : ''}`}>
            <input type="radio" name="company" className="h-4 w-4 accent-amber-600" disabled={!trainee.can_renew} checked={selected} onChange={() => form.setData('company_id', trainee.id)}/>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-gray-900">{trainee.name}</span>
              <span className="block text-xs text-gray-500">{detail(trainee)}</span>
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${state.tone}`}>{state.label}</span>
            {!trainee.can_renew && <span className="text-xs text-gray-400">Not yet open</span>}
          </label>
        </li>;
      })}
    </ul>

    <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 ring-1 ring-gray-200">
      <p className="text-sm text-gray-600">{chosen ? <>Renew <b className="text-gray-900">{plan.name}</b> for <b className="text-gray-900">{chosen.name}</b> · 1 year · <b className="text-gray-900">{rm(plan.price)}</b></> : 'Choose a company above to see the renewal total.'}</p>
      <button disabled={!form.data.company_id} className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-ink-900 transition hover:bg-amber-400 disabled:opacity-50">Review renewal</button>
    </div>
    {form.errors.company_id && <p className="text-sm text-rose-600">{form.errors.company_id}</p>}
  </form>;
}

const TABS = [
  { section: 'plan', key: 'purchase', label: 'Purchase plan' },
  { section: 'plan', key: 'renew', label: 'Renew a plan' },
  { section: 'log', key: 'log', label: 'Purchase log' },
  { section: 'log', key: 'codes', label: 'Activation codes' },
];

export default function ProviderPackages({ plans = [], trainees = [], renewWindowDays = 90, section = 'plan', tab = 'purchase', codes = null, status = null, type = null, counts = {}, typeCounts = {} }) {
  const { flash = {} } = usePage().props;
  const plan = plans[0];
  const isCodes = tab === 'codes';
  const total = Object.values(counts).reduce((sum, value) => sum + Number(value), 0);
  const paid = Number(counts.available ?? 0) + Number(counts.used ?? 0);
  const tabCount = { log: total, codes: paid };
  const countFor = key => (key === null ? (isCodes ? paid : total) : Number(counts[key] ?? 0));
  const typeCountFor = key => (key === null ? Number(typeCounts.purchase ?? 0) + Number(typeCounts.renewal ?? 0) : Number(typeCounts[key] ?? 0));
  const statusFilters = isCodes ? FILTERS.filter(filter => [null, 'available', 'used'].includes(filter.key)) : FILTERS;
  const first = codes?.from ?? 0;
  const applyFilter = change => {
    const next = { tab, ...(type ? { type } : {}), ...(status ? { status } : {}), ...change };
    Object.keys(next).forEach(key => { if (next[key] === '' || next[key] == null) delete next[key]; });
    router.get(pageHref, next, { preserveScroll: true });
  };
  const isPlan = section === 'plan';
  const pageHref = isPlan ? '/training-provider/packages' : '/training-provider/activation-codes';
  const copy = isPlan
    ? { title: 'Plan', text: 'Buy a contractor plan, or renew the plan of a company under you. Each package is one activation code, sent to the Log once payment is confirmed.' }
    : { title: 'Log', text: 'Every package you bought or renewed, and the activation codes to give to your companies. A code appears once its order is paid; the company activates it for one year.' };

  return <AppLayout title={copy.title}>
    <Head title={copy.title}/>
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{copy.title}</h2>
        <p className="text-sm text-gray-500">{copy.text}</p>
      </div>
      {flash.success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{flash.success}</div>}

      <div role="tablist" aria-label="Sections" className="flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.filter(item => (item.section === section)).map(item => {
          const active = tab === item.key;
          return <Link key={item.key} role="tab" aria-selected={active} href={pageHref} data={{ tab: item.key }} className={`-mb-px whitespace-nowrap border-b-2 px-5 py-3 text-sm font-bold transition ${active ? 'border-ink-900 text-ink-900' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>{item.label}{item.key in tabCount && <span className="ml-1.5 text-xs font-semibold text-gray-400">{tabCount[item.key]}</span>}</Link>;
        })}
      </div>

      {(tab === 'purchase' || tab === 'renew') && (plan
        ? <section>{tab === 'purchase' ? <PlanOrder plan={plan}/> : <RenewOrder plan={plan} trainees={trainees} windowDays={renewWindowDays}/>}</section>
        : <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">No package is available to buy yet.</p>)}

      {codes && <>
        <div className="flex flex-wrap items-end gap-4 rounded-2xl bg-white p-4 ring-1 ring-gray-200">
          {!isCodes && <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Type
            <select value={type ?? ''} onChange={event => applyFilter({ type: event.target.value })} className="mt-1 block w-48 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-gray-900">
              {TYPES.map(item => <option key={item.label} value={item.key ?? ''}>{item.label} ({typeCountFor(item.key)})</option>)}
            </select>
          </label>}
          <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Status
            <select value={status ?? ''} onChange={event => applyFilter({ status: event.target.value })} className="mt-1 block w-52 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-gray-900">
              {statusFilters.map(filter => <option key={filter.label} value={filter.key ?? ''}>{filter.label} ({countFor(filter.key)})</option>)}
            </select>
          </label>
          {(status || type) && <Link href={pageHref} data={{ tab }} preserveScroll className="pb-2 text-sm font-semibold text-gray-500 underline hover:text-gray-900">Clear filters</Link>}
          <p className="ml-auto pb-2 text-sm text-gray-500">{codes.total} {codes.total === 1 ? 'result' : 'results'}</p>
        </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">{isCodes ? <table className="w-full min-w-[940px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500"><tr><th className="w-14 px-5 py-3">#</th><th className="px-5 py-3">Activation code</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Package</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Used by</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {codes.data.map((code, index) => { const state = STATUS[code.status] ?? STATUS.pending; return <tr key={code.id}>
              <td className="px-5 py-4 text-gray-400">{first + index}</td>
              <td className="px-5 py-4"><span className="flex items-center gap-2"><code className="font-bold tracking-wider text-gray-900">{code.code}</code><CopyButton value={code.code}/></span></td>
              <td className="px-5 py-4">{code.type === 'renewal' ? <><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-100">Renewal</span><span className="mt-1 block text-xs text-gray-500">{code.renewal_for}</span></> : <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">New purchase</span>}</td>
              <td className="px-5 py-4">{code.package}</td>
              <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${state.tone}`}>{state.label}</span></td>
              <td className="px-5 py-4">{code.used_by ? <>{code.used_by}<span className="block text-xs text-gray-400">{code.used_at}</span></> : '—'}</td>
            </tr>; })}
            {!codes.data.length && <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-500">{status ? 'No codes match this filter.' : 'No paid activation codes yet.'}</td></tr>}
          </tbody>
        </table> : <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500"><tr><th className="w-14 px-5 py-3">#</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Package</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Order</th><th className="px-5 py-3">Date</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {codes.data.map((code, index) => <tr key={code.id}>
              <td className="px-5 py-4 text-gray-400">{first + index}</td>
              <td className="px-5 py-4"><Description code={code}/></td>
              <td className="px-5 py-4">{code.package}</td>
              <td className="whitespace-nowrap px-5 py-4">{rm(code.price)}</td>
              <td className="px-5 py-4 text-gray-700">{code.batch_ref}</td>
              <td className="whitespace-nowrap px-5 py-4 text-gray-500">{code.created_at}</td>
            </tr>)}
            {!codes.data.length && <tr><td colSpan="6" className="px-5 py-12 text-center text-gray-500">{status || type ? 'No orders match these filters.' : 'No packages bought yet.'}</td></tr>}
          </tbody>
        </table>}</div>

        {codes.last_page > 1 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 text-sm">
          <span className="text-gray-500">Showing {codes.from}–{codes.to} of {codes.total}</span>
          <nav aria-label="Pages" className="flex flex-wrap gap-1.5">
            {codes.links.map((link, index) => link.url
              ? <Link key={index} href={link.url} preserveScroll className={`min-w-9 rounded-lg border px-3 py-1.5 text-center font-semibold ${link.active ? 'border-brand-400 bg-brand-400 text-ink-900' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`} dangerouslySetInnerHTML={{ __html: link.label }}/>
              : <span key={index} className="min-w-9 rounded-lg border border-gray-100 px-3 py-1.5 text-center text-gray-300" dangerouslySetInnerHTML={{ __html: link.label }}/>)}
          </nav>
        </div>}
      </section>
      </>}
    </div>
  </AppLayout>;
}
