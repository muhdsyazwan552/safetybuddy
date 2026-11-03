import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';

const rm = value => `RM ${Number(value).toLocaleString('en-MY')}`;
const STATUS = {
  pending: { label: 'Awaiting payment', tone: 'bg-amber-50 text-amber-800' },
  available: { label: 'Available', tone: 'bg-emerald-50 text-emerald-700' },
  used: { label: 'Used', tone: 'bg-gray-100 text-gray-600' },
  rejected: { label: 'Rejected', tone: 'bg-rose-50 text-rose-700' },
};
const FILTERS = [{ key: null, label: 'All' }, ...Object.entries(STATUS).map(([key, value]) => ({ key, label: value.label }))];

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* code stays visible */ }
  };
  return <button type="button" onClick={copy} className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200">{copied ? 'Copied' : 'Copy'}</button>;
}

const TYPES = [
  { key: null, label: 'All orders' },
  { key: 'purchase', label: 'New purchases' },
  { key: 'renewal', label: 'Renewals' },
];

export default function ActivationCodes({ codes, status = null, type = null, counts = {}, typeCounts = {} }) {
  const total = Object.values(counts).reduce((sum, value) => sum + Number(value), 0);
  const countFor = key => (key === null ? total : Number(counts[key] ?? 0));
  const typeCountFor = key => (key === null ? Number(typeCounts.purchase ?? 0) + Number(typeCounts.renewal ?? 0) : Number(typeCounts[key] ?? 0));
  const first = codes.from ?? 0;
  const chip = (active) => `rounded-full px-4 py-2 text-sm font-semibold ring-1 transition ${active ? 'bg-ink-900 text-brand-400 ring-ink-900' : 'bg-white text-gray-600 ring-gray-200 hover:bg-gray-50'}`;

  return <AppLayout title="Purchase & Renewal Log">
    <Head title="Purchase & Renewal Log"/>
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Purchase &amp; renewal log</h2>
          <p className="text-sm text-gray-500">Every package you bought or renewed, newest first. Each row is one activation code. Codes are shown once the order is paid, and used codes show which company activated them.</p>
        </div>
        <Link href="/training-provider/packages" className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800">Buy or renew packages</Link>
      </div>

      <div className="space-y-3">
        <div role="tablist" aria-label="Filter by type" className="flex flex-wrap gap-2">
          {TYPES.map(item => {
            const active = (type ?? null) === item.key;
            return <Link key={item.label} role="tab" aria-selected={active} href="/training-provider/activation-codes" data={status ? { ...(item.key ? { type: item.key } : {}), status } : (item.key ? { type: item.key } : {})} preserveScroll className={chip(active)}>{item.label} <span className={active ? 'text-brand-400/80' : 'text-gray-400'}>{typeCountFor(item.key)}</span></Link>;
          })}
        </div>
        <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {FILTERS.map(filter => {
            const active = (status ?? null) === filter.key;
            return <Link key={filter.label} role="tab" aria-selected={active} href="/training-provider/activation-codes" data={type ? { ...(filter.key ? { status: filter.key } : {}), type } : (filter.key ? { status: filter.key } : {})} preserveScroll className={`${chip(active)} !px-3.5 !py-1.5`}>{filter.label} <span className={active ? 'text-brand-400/80' : 'text-gray-400'}>{countFor(filter.key)}</span></Link>;
          })}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500"><tr><th className="w-14 px-5 py-3">#</th><th className="px-5 py-3">Activation code</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Package</th><th className="px-5 py-3">Price</th><th className="px-5 py-3">Order</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Used by</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {codes.data.map((code, index) => { const state = STATUS[code.status] ?? STATUS.pending; return <tr key={code.id}>
              <td className="px-5 py-4 text-gray-400">{first + index}</td>
              <td className="px-5 py-4">{code.code ? <span className="flex items-center gap-2"><code className="font-bold tracking-wider text-gray-900">{code.code}</code>{code.status === 'available' && <CopyButton value={code.code}/>}</span> : <span className="text-xs text-gray-400">Shown after payment is confirmed</span>}</td>
              <td className="px-5 py-4">{code.type === 'renewal' ? <><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-100">Renewal</span><span className="mt-1 block text-xs text-gray-500">{code.renewal_for}</span></> : <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">New purchase</span>}</td>
              <td className="px-5 py-4">{code.package}</td>
              <td className="whitespace-nowrap px-5 py-4">{rm(code.price)}</td>
              <td className="px-5 py-4 text-xs text-gray-500">{code.batch_ref}<br/>{code.created_at}</td>
              <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${state.tone}`}>{state.label}</span></td>
              <td className="px-5 py-4">{code.used_by ? <>{code.used_by}<span className="block text-xs text-gray-400">{code.used_at}</span></> : '—'}</td>
            </tr>; })}
            {!codes.data.length && <tr><td colSpan="8" className="px-5 py-12 text-center text-gray-500">{status || type ? 'No codes match these filters.' : 'No packages bought yet.'}</td></tr>}
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
    </div>
  </AppLayout>;
}
