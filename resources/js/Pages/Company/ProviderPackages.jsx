import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { ArrowUpRight, Check, ChevronDown, Copy, KeyRound } from 'lucide-react';
import OrderReview from '@/Components/OrderReview';
import TableToolbar, { ToolbarSelect } from '@/Components/shared/TableToolbar';
import AppLayout from '@/Pages/WSIS/Layout';

const rm = value => `RM ${Number(value).toLocaleString('en-MY')}`;
const STATUS = {
  pending: { label: 'Waiting for payment', tone: 'bg-amber-50 text-amber-800' },
  available: { label: 'Ready to use', tone: 'bg-emerald-50 text-emerald-700' },
  used: { label: 'Already used', tone: 'bg-gray-100 text-gray-600' },
  rejected: { label: 'Not approved', tone: 'bg-rose-50 text-rose-700' },
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
  const tone = state === 'copied' ? 'bg-emerald-600 text-white' : state === 'failed' ? 'bg-rose-100 text-rose-700' : 'bg-ink-900 text-white hover:bg-ink-800';
  return <button type="button" onClick={copy} aria-label={`Copy activation code ${value}`} className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm transition ${tone}`}>
    {state === 'copied' ? <Check className="h-3.5 w-3.5" strokeWidth={3}/> : <Copy className="h-3.5 w-3.5"/>}
    {state === 'copied' ? 'Copied' : state === 'failed' ? 'Press Ctrl+C' : 'Copy code'}
  </button>;
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
    <p className="font-semibold text-gray-900">{renewal ? `Renewed 1-year ${code.package} for ${code.renewal_for}` : `Bought 1 × ${code.package} (1 year) for a new participant`}</p>
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

const tile = (value, label) => <div className="rounded-xl bg-gray-50 p-3 text-center"><p className="text-2xl font-black">{value}</p><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p></div>;
const darkPanel = 'mt-5 rounded-xl bg-ink-900 p-5 text-white';
const buyButton = 'mt-4 w-full rounded-lg bg-brand-400 px-5 py-2.5 font-black text-ink-900 transition hover:bg-brand-300 disabled:opacity-50';
const darkField = 'mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-lg font-bold text-white';

export function PlanOrder({ plan, counts = {} }) {
  const form = useForm({ plan_id: plan.id, quantity: 1 });
  const quantity = Math.max(0, Number(form.data.quantity) || 0);
  const total = plan.price * quantity;
  const [reviewing, setReviewing] = useState(false);
  const review = event => { event.preventDefault(); if (total >= 1) setReviewing(true); };
  const confirm = () => form.post('/training-provider/packages', { preserveScroll: true, onSuccess: () => { form.reset('quantity'); setReviewing(false); } });
  const bought = Object.values(counts).reduce((sum, value) => sum + Number(value), 0);

  return <section id="purchase-plan" className="flex scroll-mt-6 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-bold text-gray-900">Purchase activation code</h2>
    <p className="mt-1 text-sm text-gray-500">{rm(plan.price)} per {plan.name} package, valid 1 year. Each package becomes one activation code for a new participant.</p>
    <div className="mt-5 grid grid-cols-3 gap-3">{tile(bought, 'Packages bought')}{tile(Number(counts.available ?? 0), 'Codes ready')}{tile(Number(counts.used ?? 0), 'Codes used')}</div>
    <form onSubmit={review} className={darkPanel}>
      {reviewing && <OrderReview
        title="Review your purchase"
        details={[
          { label: 'Order type', value: 'New purchase of contractor plan' },
          { label: 'Plan', value: plan.name },
          { label: 'Number of packages', value: `${quantity} (${quantity} activation ${quantity === 1 ? 'code' : 'codes'})` },
          { label: 'Each package includes', value: planSeats(plan).map(seat => `${seat.n} ${seat.label}`).join(' · ') },
          { label: 'Valid for', value: '1 year from the day a participant activates the code' },
        ]}
        lines={[{ name: plan.name, note: 'Annual package', qty: quantity, unit: plan.price }]}
        notes={['Step 1: Click Place Order. You will get an order number (e.g. SB-EP-2611-001).', 'Step 2: WhatsApp us at 016-8865619 with your order number to pay, then send your receipt.', 'Step 3: Once payment is confirmed, the activation codes appear in the table below. Give a code to a participant to activate it.']}
        confirmLabel="Place Order" processing={form.processing} error={form.errors.quantity || form.errors.plan_id}
        onConfirm={confirm} onBack={() => setReviewing(false)}/>}
      <label htmlFor="packages-qty" className="text-xs font-bold uppercase tracking-wider text-white/60">Packages to buy</label>
      <input id="packages-qty" type="number" min="1" max="20" value={form.data.quantity} onChange={event => form.setData('quantity', event.target.value)} className={darkField}/>
      <p className="mt-3 flex items-baseline justify-between"><span className="text-sm text-white/60">{quantity} × {rm(plan.price)}</span><span className="text-2xl font-black text-brand-300">{rm(total)}</span></p>
      <button disabled={total < 1} className={buyButton}>Buy Now</button>
      {(form.errors.quantity || form.errors.plan_id) && <p className="mt-2 text-sm text-rose-300">{form.errors.quantity || form.errors.plan_id}</p>}
    </form>
  </section>;
}

/** Renews the plan of one participant: the code works for that participant only. */
export function RenewOrder({ plan, trainees, windowDays }) {
  const form = useForm({ plan_id: plan.id, quantity: 1, company_id: '' });
  const chosen = trainees.find(trainee => String(trainee.id) === String(form.data.company_id));
  const [reviewing, setReviewing] = useState(false);
  const review = event => { event.preventDefault(); if (chosen) setReviewing(true); };
  const confirm = () => form.post('/training-provider/packages', { preserveScroll: true, onSuccess: () => { form.reset('company_id'); setReviewing(false); } });
  const detail = trainee => {
    if (!trainee.end_date) return 'No plan yet';
    if (trainee.state === 'expired') return `ended ${trainee.end_date}`;
    return `ends ${trainee.end_date}`;
  };
  const renewable = trainees.filter(trainee => trainee.can_renew);

  return <section id="renew-plan" className="flex scroll-mt-6 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-bold text-gray-900">Renew a Participant</h2>
    <p className="mt-1 text-sm text-gray-500">{rm(plan.price)} per renewal, 1 year. The activation code works for the chosen participant only. You can renew {windowDays} days before the end date, or any time after it ends.</p>
    <div className="mt-5 grid grid-cols-3 gap-3">{tile(trainees.length, 'Participants')}{tile(trainees.filter(trainee => trainee.state === 'active').length, 'Active')}{tile(renewable.length, 'Can renew now')}</div>
    <form onSubmit={review} className={darkPanel}>
      {reviewing && chosen && <OrderReview
        title="Review your renewal"
        details={[
          { label: 'Order type', value: 'Renewal of contractor plan' },
          { label: 'Participant', value: chosen.name },
          { label: 'Current plan', value: chosen.end_date ? `${TRAINEE_STATE[chosen.state].label} · ${chosen.state === 'expired' ? 'ended' : 'ends'} ${chosen.end_date}` : 'No plan has been activated yet' },
          { label: 'Plan', value: plan.name },
          { label: 'Renewal period', value: chosen.state === 'active' ? '1 year, starting the day after the current plan ends' : '1 year, starting when the participant activates the code' },
          { label: 'Activation code', value: `1 code, works for ${chosen.name} only` },
        ]}
        lines={[{ name: `${plan.name} renewal`, note: chosen.name, qty: 1, unit: plan.price }]}
        notes={['Step 1: Click Place Order. You will get an order number (e.g. SB-EP-2611-001).', 'Step 2: WhatsApp us at 016-8865619 with your order number to pay, then send your receipt.', `Step 3: Once payment is confirmed, the code appears in the table below. ${chosen.name} enters it to renew.`]}
        confirmLabel="Place Order" processing={form.processing} error={form.errors.company_id}
        onConfirm={confirm} onBack={() => setReviewing(false)}/>}
      <label htmlFor="renew-company" className="text-xs font-bold uppercase tracking-wider text-white/60">Participant to renew</label>
      <select id="renew-company" value={form.data.company_id} onChange={event => form.setData('company_id', event.target.value)} className={`${darkField} text-base`} disabled={!renewable.length}>
        <option value="" className="text-gray-900">{trainees.length ? (renewable.length ? 'Choose a participant' : 'No participant can be renewed yet') : 'No participants yet'}</option>
        {renewable.map(trainee => <option key={trainee.id} value={trainee.id} className="text-gray-900">{trainee.name} · {detail(trainee)}</option>)}
      </select>
      <p className="mt-3 flex items-baseline justify-between"><span className="text-sm text-white/60">1 × {rm(plan.price)}</span><span className="text-2xl font-black text-brand-300">{rm(chosen ? plan.price : 0)}</span></p>
      <button disabled={!chosen} className={buyButton}>Buy Now</button>
      {form.errors.company_id && <p className="mt-2 text-sm text-rose-300">{form.errors.company_id}</p>}
    </form>
  </section>;
}

const TRAINEE_STATE = {
  no_package: { label: 'No plan yet', tone: 'bg-gray-100 text-gray-600' },
  expired: { label: 'Expired', tone: 'bg-rose-50 text-rose-700' },
  active: { label: 'Active', tone: 'bg-emerald-50 text-emerald-700' },
};

const waLink = code => `https://wa.me/60168865619?text=${encodeURIComponent(`Hello Safety Buddy, I would like to make payment for my order.\nOrder number: ${code.batch_ref}\nItem: ${code.type === 'renewal' ? `Renewal ${code.package} for ${code.renewal_for}` : `${code.package} package (1 year)`}\nAmount: ${rm(code.price)}`)}`;

/** One package of an order: pending shows the WhatsApp payment button, paid rows open to show the activation code and whether it is used. Green = code still valid, grey = used / rejected. */
function CodeRow({ code, number, open, onToggle }) {
  const paid = code.status === 'available' || code.status === 'used';
  const tone = code.status === 'available' ? 'bg-emerald-50/70 border-l-4 border-l-emerald-500' : code.status === 'used' || code.status === 'rejected' ? 'bg-gray-100 text-gray-500 border-l-4 border-l-gray-300' : 'border-l-4 border-l-amber-400';
  const state = STATUS[code.status] ?? STATUS.pending;
  return <>
    <tr className={`border-b border-gray-100 ${tone}`}>
      <td className="px-5 py-4 text-gray-400">{number}</td>
      <td className="whitespace-nowrap px-5 py-4">{code.created_at}</td>
      <td className="whitespace-nowrap px-5 py-4 font-bold">{code.batch_ref}</td>
      <td className="px-5 py-4"><Description code={code}/></td>
      <td className="whitespace-nowrap px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${state.tone}`}>{code.status === 'available' ? 'Ready to use' : state.label}</span></td>
      <td className="whitespace-nowrap px-5 py-4 text-right font-bold">{rm(code.price)}</td>
      <td className="whitespace-nowrap px-5 py-4 text-right">
        <span className="inline-flex items-center gap-2">
        {code.status === 'pending' && <a href={waLink(code)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-400 px-3 py-1.5 text-xs font-black text-ink-950 hover:bg-brand-300">Pay by WhatsApp</a>}
        {paid && <button type="button" onClick={onToggle} aria-expanded={open} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-900 hover:border-brand-400">Code <ChevronDown className={`h-3.5 w-3.5 transition ${open ? 'rotate-180' : ''}`}/></button>}
        <Link href={`/training-provider/packages/orders/${code.batch_ref}`} className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-900 hover:border-brand-400">Details</Link>
        </span>
      </td>
    </tr>
    {paid && open && <tr className={`border-b border-gray-100 ${code.status === 'available' ? 'bg-emerald-50/70' : 'bg-gray-100'}`}>
      <td colSpan="7" className="px-5 pb-5 pt-1">
        <div className={`flex w-full flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border bg-white px-4 py-3 shadow-sm lg:flex-nowrap ${code.status === 'available' ? 'border-emerald-200' : 'border-gray-200'}`}>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${code.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}><KeyRound className="h-5 w-5"/></span>
          <div className="min-w-0 flex-1 basis-full lg:basis-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Activation code</p>
            <p className={`mt-1.5 w-full select-all break-all rounded-lg px-4 py-2.5 font-mono text-sm font-bold ring-1 ${code.status === 'available' ? 'bg-emerald-50 text-emerald-900 ring-emerald-200' : 'bg-gray-50 text-gray-500 ring-gray-200'}`}>{code.code}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${code.status === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${code.status === 'available' ? 'bg-emerald-600' : 'bg-gray-500'}`}/>{code.status === 'available' ? 'Ready to use' : 'Already used'}</span>
            <CopyButton value={code.code}/>
          </div>
        </div>
      </td>
    </tr>}
  </>;
}

const TABS = [
  { section: 'plan', key: 'purchase', label: 'Purchase plan' },
  { section: 'plan', key: 'renew', label: 'Renew a plan' },
  { section: 'log', key: 'log', label: 'Purchase log' },
  { section: 'log', key: 'codes', label: 'Activation codes' },
];

export default function ProviderPackages({ plans = [], trainees = [], renewWindowDays = 90, section = 'plan', tab = 'purchase', codes = null, status = null, type = null, search = '', counts = {}, typeCounts = {} }) {
  const { flash = {} } = usePage().props;
  const [openId, setOpenId] = useState(null);
  const [query, setQuery] = useState(search);
  const firstRun = useRef(true);
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
    const next = { tab, ...(type ? { type } : {}), ...(status ? { status } : {}), ...(query.trim() ? { search: query.trim() } : {}), ...change };
    Object.keys(next).forEach(key => { if (next[key] === '' || next[key] == null) delete next[key]; });
    router.get(pageHref, next, { preserveScroll: true, preserveState: true });
  };
  const pageHref = '/training-provider/packages';
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return; }
    const timer = setTimeout(() => applyFilter({ search: query.trim() }), 350);
    return () => clearTimeout(timer);
  }, [query]);
  const copy = { title: 'Purchase', text: 'Buy activation codes for new participants and renew the subscription of your existing participants here. Every order is listed below, and its activation code appears once the order is paid.' };

  return <AppLayout title={copy.title}>
    <Head title={copy.title}/>
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{copy.title}</h2>
        <p className="text-sm text-gray-500">{copy.text}</p>
      </div>
      {flash.success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{flash.success}</div>}

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div><h3 className="font-bold text-gray-900">Buy activation code</h3><p className="mt-1 text-sm text-gray-500">Each package becomes one activation code for a participant to use for one year.</p></div>
        <div className="flex flex-wrap gap-2">
          <Link href="/training-provider/packages/purchase" className="inline-flex items-center gap-1.5 rounded-xl bg-brand-400 px-5 py-2.5 text-sm font-black text-ink-950 transition hover:bg-brand-300">Purchase activation code</Link>
          <Link href="/training-provider/packages/renew" className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-black text-ink-900 transition hover:border-brand-400 hover:bg-brand-50">Renew a Participant</Link>
        </div>
      </section>

      {codes && <>
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4"><h3 className="font-bold text-gray-900">Purchase log</h3><p className="mt-1 text-xs text-gray-500">Green = paid and ready to use. Grey = already used or not approved.</p></div>
        <TableToolbar search={query} onSearch={setQuery} placeholder="Search order no., code, package or participant…" count={codes.total} noun="result" onClear={(status || type || query) ? () => { setQuery(''); router.get(pageHref, {}, { preserveScroll: true }); } : null}>
          <ToolbarSelect label="Type" value={type ?? ''} onChange={value => applyFilter({ type: value })}>
            {TYPES.map(item => <option key={item.label} value={item.key ?? ''}>{item.label} ({typeCountFor(item.key)})</option>)}
          </ToolbarSelect>
          <ToolbarSelect label="Status" value={status ?? ''} onChange={value => applyFilter({ status: value })}>
            {FILTERS.map(filter => <option key={filter.label} value={filter.key ?? ''}>{filter.label} ({countFor(filter.key)})</option>)}
          </ToolbarSelect>
        </TableToolbar>
        <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-ink-950 text-xs font-bold uppercase tracking-wider text-brand-400"><tr><th className="w-14 px-5 py-3">#</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Order no.</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Price</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
          <tbody>
            {codes.data.map((code, index) => <CodeRow key={code.id} code={code} number={first + index} open={openId === code.id} onToggle={() => setOpenId(current => current === code.id ? null : code.id)}/>)}
            {!codes.data.length && <tr><td colSpan="7" className="px-5 py-12 text-center text-gray-500">{status || type ? 'No orders match these filters.' : 'No packages bought yet.'}</td></tr>}
          </tbody>
        </table></div>

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
