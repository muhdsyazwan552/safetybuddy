import BackLink from '@/Components/shared/BackLink';
import React from 'react';
import { Head } from '@inertiajs/react';
import { ArrowLeft, Clock3, FileText, MessageCircle } from 'lucide-react';
import AppLayout from '@/Pages/WSIS/Layout';

const rm = value => `RM ${Number(value).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;
const STATUS = {
  pending: { label: 'Waiting for payment', tone: 'bg-amber-100 text-amber-900' },
  paid: { label: 'Paid', tone: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Not approved', tone: 'bg-rose-100 text-rose-700' },
};
const CODE = {
  pending: { label: 'Waiting for payment', row: '' },
  available: { label: 'Ready to use', row: 'bg-emerald-50/70' },
  used: { label: 'Already used', row: 'bg-gray-100 text-gray-500' },
  rejected: { label: 'Not approved', row: 'bg-gray-100 text-gray-500' },
};

export default function ProviderOrderDetails({ order }) {
  const status = STATUS[order.status];
  const description = order.type === 'renewal' ? `Renewal of ${order.package} for ${order.renewal_for}` : `${order.package} package (1 year) for new participants`;
  const wa = `https://wa.me/60168865619?text=${encodeURIComponent(`Hello Safety Buddy, I would like to make payment for my order.\nOrder number: ${order.batch_ref}\nItem: ${description}\nPackages: ${order.codes.length}\nAmount: ${rm(order.total)}`)}`;
  const steps = [
    { title: 'Order placed', text: `Done. Placed on ${order.placed_at}.`, done: true },
    { title: 'Pay by WhatsApp', text: order.status === 'pending' ? <>Click <a href={wa} target="_blank" rel="noreferrer" className="font-bold underline">016-8865619</a> to open WhatsApp with your order details filled in, then follow our reply to pay and send your receipt.</> : 'Payment received.', done: order.status !== 'pending', current: order.status === 'pending' },
    { title: 'Payment approved', text: order.paid_at ? `Approved on ${String(order.paid_at).slice(0, 16)}.` : 'We check your receipt and approve the order.', done: order.status === 'paid' },
    { title: 'Activation codes ready', text: 'The codes appear below. Give a code to a participant to activate it for one year.', done: order.status === 'paid' },
  ];

  return <AppLayout title={`Order ${order.batch_ref}`}>
    <Head title={`Order ${order.batch_ref}`}/>
    <div className="w-full max-w-5xl space-y-6">
      <BackLink href="/training-provider/packages" className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-gray-900"><ArrowLeft className="h-4 w-4"/>Back</BackLink>

      <section className="overflow-hidden rounded-2xl border border-brand-300 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-200 bg-brand-50 px-5 py-4">
          <div><p className="text-xs font-black uppercase tracking-[.2em] text-brand-800">Order number</p><p className="mt-1 text-2xl font-black text-ink-950">{order.batch_ref}</p></div>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}>{order.status === 'pending' && <Clock3 className="h-3.5 w-3.5"/>}{status.label}</span>
        </div>
        <dl className="grid gap-4 px-5 py-4 text-sm sm:grid-cols-3">
          <div><dt className="text-gray-500">Description</dt><dd className="font-bold text-gray-900">{description}</dd></div>
          <div><dt className="text-gray-500">Packages</dt><dd className="font-bold text-gray-900">{order.codes.length}</dd></div>
          <div><dt className="text-gray-500">Total</dt><dd className="font-bold text-gray-900">{rm(order.total)}</dd></div>
          <div><dt className="text-gray-500">Placed on</dt><dd className="font-bold text-gray-900">{order.placed_at}</dd></div>
          <div><dt className="text-gray-500">Placed by</dt><dd className="font-bold text-gray-900">{order.placed_by || '—'}</dd></div>
          <div><dt className="text-gray-500">Payment approved</dt><dd className="font-bold text-gray-900">{order.paid_at ? String(order.paid_at).slice(0, 16) : '—'}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-2 border-t border-gray-100 px-5 py-4">
          {order.status === 'pending' && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-400 px-4 py-2 text-sm font-black text-ink-950 hover:bg-brand-300"><MessageCircle className="h-4 w-4"/>Pay by WhatsApp</a>}
          {order.payment_id && <a href={`/manage-package/payments/${order.payment_id}/receipt`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-ink-900 hover:border-brand-400"><FileText className="h-4 w-4"/>Receipt {order.receipt_no}</a>}
        </div>
      </section>

      {order.status !== 'rejected' && <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[.2em] text-gray-500">Progress</p>
        <ol className="mt-3 space-y-3">{steps.map((step, index) => <li key={step.title} className="flex items-start gap-3">
          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${step.done ? 'bg-emerald-500 text-white' : step.current ? 'bg-brand-400 text-ink-950' : 'bg-gray-100 text-gray-500'}`}>{step.done ? '✓' : index + 1}</span>
          <div className="text-sm"><p className="font-bold text-gray-900">{step.title}{step.current && <span className="ml-2 text-xs font-semibold text-brand-800">You are here</span>}</p><p className="text-gray-500">{step.text}</p></div>
        </li>)}</ol>
      </section>}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4"><h2 className="font-bold text-gray-900">Packages and activation codes</h2><p className="mt-1 text-xs text-gray-500">Green is a valid code that has not been used. Grey is used or rejected.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-ink-950 text-xs font-bold uppercase tracking-wider text-brand-400"><tr><th className="px-5 py-3">#</th><th className="px-5 py-3">Activation code</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Used by</th><th className="px-5 py-3">Used on</th><th className="px-5 py-3 text-right">Price</th></tr></thead>
          <tbody>{order.codes.map((code, index) => <tr key={code.id} className={`border-b border-gray-100 ${CODE[code.status]?.row ?? ''}`}>
            <td className="px-5 py-3 text-gray-400">{index + 1}</td>
            <td className="px-5 py-3 font-mono font-bold tracking-wider">{code.code ?? <span className="font-sans text-xs font-normal text-gray-400">Available after payment</span>}</td>
            <td className="whitespace-nowrap px-5 py-3 font-semibold">{CODE[code.status]?.label ?? code.status}</td>
            <td className="px-5 py-3">{code.used_by ?? '—'}</td>
            <td className="whitespace-nowrap px-5 py-3">{code.used_at ?? '—'}</td>
            <td className="whitespace-nowrap px-5 py-3 text-right font-bold">{rm(code.price)}</td>
          </tr>)}</tbody>
        </table></div>
      </section>
    </div>
  </AppLayout>;
}
