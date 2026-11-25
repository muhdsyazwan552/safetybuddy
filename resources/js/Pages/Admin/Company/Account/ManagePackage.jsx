import BackLink from '@/Components/shared/BackLink';
import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, FileText, MessageCircle } from 'lucide-react';
import OrderReview from '@/Components/OrderReview';
import AccountPageLayout from '@/Layouts/AccountPageLayout';
import TableToolbar, { ToolbarSelect, matchesSearch } from '@/Components/shared/TableToolbar';

const rm = value => `RM ${Number(value).toLocaleString('en-MY')}`;

function SeatCard({ seat }) {
  const form = useForm({ type: seat.type, quantity: 1 });
  const qty = Math.max(0, Number(form.data.quantity) || 0);
  const limit = (seat.included ?? 0) + seat.extra;
  const noun = seat.type === 'executor' ? 'Contractor' : seat.label;
  const [reviewing, setReviewing] = useState(false);
  const review = event => { event.preventDefault(); if (qty >= 1) setReviewing(true); };
  const confirm = () => form.post('/manage-package/seats', { preserveScroll: true, onSuccess: () => { form.reset('quantity'); setReviewing(false); } });

  return <section id={seat.type === 'executor' ? 'contractor-slots' : 'inspector-slots'} className="flex scroll-mt-6 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-bold text-gray-900">Extra {noun} slots</h2>
    <p className="mt-1 text-sm text-gray-500">{rm(seat.price)} per {noun}, paid once. Seats you buy stay when the package renews.</p>
    <div className="mt-5 grid grid-cols-3 gap-3 text-center">
      <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-black">{seat.included ?? 0}</p><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Included</p></div>
      <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-black">{seat.extra}</p><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Extra bought</p></div>
      <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-black">{seat.used}<span className="text-base text-gray-400"> / {limit}</span></p><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">In use</p></div>
    </div>
    <form onSubmit={review} className="mt-5 rounded-xl bg-ink-900 p-5 text-white">
      {reviewing && <OrderReview
        title={`Review your extra ${noun} slots`}
        details={[
          { label: 'Order type', value: `Extra ${noun} slots (add-on)` },
          { label: 'Slots to add', value: qty },
          { label: `${noun} slots now`, value: `${limit} (${seat.included ?? 0} included + ${seat.extra} extra) · ${seat.used} in use` },
          { label: `${noun} slots after`, value: `${limit + qty}` },
          { label: 'Payment', value: 'Paid once, not yearly' },
        ]}
        lines={[{ name: `Extra ${noun} slot`, note: 'One-time add-on', qty, unit: seat.price }]}
        notes={['The slots are added to your company as soon as you confirm.', 'They stay with your company when the package renews.']}
        confirmLabel="Place Order" processing={form.processing} error={form.errors.quantity}
        onConfirm={confirm} onBack={() => setReviewing(false)}/>}
      <label htmlFor={`qty-${seat.type}`} className="text-xs font-bold uppercase tracking-wider text-white/60">Seats to add</label>
      <input id={`qty-${seat.type}`} type="number" min="1" max="50" value={form.data.quantity} onChange={event => form.setData('quantity', event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-lg font-bold text-white"/>
      <p className="mt-3 flex items-baseline justify-between"><span className="text-sm text-white/60">{qty} × {rm(seat.price)}</span><span className="text-2xl font-black text-brand-300">{rm(qty * seat.price)}</span></p>
      <button disabled={qty < 1} className="mt-4 w-full rounded-lg bg-brand-400 px-5 py-2.5 font-black text-ink-900 transition hover:bg-brand-300 disabled:opacity-50">Buy Now</button>
      {form.errors.quantity && <p className="mt-2 text-sm text-rose-300">{form.errors.quantity}</p>}
    </form>
  </section>;
}

const dateTime = value => value ? new Date(value.replace(' ', 'T')).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';
const statusStyle = { completed: 'bg-emerald-50 text-emerald-700', pending: 'bg-amber-100 text-amber-900', failed: 'bg-rose-50 text-rose-700' };
const statusLabel = { completed: 'Paid', pending: 'Pending payment', failed: 'Failed' };
const whatsappLink = row => `https://wa.me/60168865619?text=${encodeURIComponent(`Hello Safety Buddy, I would like to make payment for my slot order.
Order number: ${row.order_no ?? '-'}
Item: Extra ${row.type} ${row.quantity === 1 ? 'slot' : 'slots'} × ${row.quantity}
Amount: ${rm(row.amount)}`)}`;

function SlotHistory({ history: allRows }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const history = allRows.filter(row => (!status || row.status === status) && matchesSearch(search, row.order_no, row.type, `${row.quantity}`, row.amount, statusLabel[row.status]));
  return <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" aria-labelledby="slot-history-title">
    <div className="border-b border-gray-100 px-5 py-4">
      <h2 id="slot-history-title" className="font-bold text-ink-950">Slot purchase history</h2>
      <p className="mt-1 text-xs text-gray-500">Every slot order with its order number and payment status. For a pending order, tap Pay by WhatsApp to send us the order details.</p>
    </div>
    <TableToolbar search={search} onSearch={setSearch} placeholder="Search order no., slot or amount…" count={history.length} onClear={(search || status) ? () => { setSearch(''); setStatus(''); } : null}>
      <ToolbarSelect label="Status" value={status} onChange={setStatus}><option value="">All statuses</option><option value="pending">Pending payment</option><option value="completed">Paid</option><option value="failed">Failed</option></ToolbarSelect>
    </TableToolbar>
    {history.length ? <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm">
      <thead className="bg-ink-950 text-xs font-bold uppercase tracking-wider text-brand-400"><tr>
        <th className="px-5 py-3">Date</th><th className="px-5 py-3">Order no.</th><th className="px-5 py-3">Slot</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Action</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-100">{history.map(row => <tr key={row.id} className="align-top">
        <td className="whitespace-nowrap px-5 py-4 text-gray-600">{dateTime(row.date)}</td>
        <td className="whitespace-nowrap px-5 py-4 font-bold text-ink-950">{row.order_no || '—'}</td>
        <td className="px-5 py-4"><p className="font-semibold text-ink-950">Extra {row.type} {row.quantity === 1 ? 'slot' : 'slots'} × {row.quantity}</p><p className="mt-1 text-xs text-gray-500">{rm(row.unit_price)} each, paid once</p></td>
        <td className="whitespace-nowrap px-5 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusStyle[row.status] || 'bg-gray-100 text-gray-600'}`}>{statusLabel[row.status] || row.status}</span></td>
        <td className="whitespace-nowrap px-5 py-4 text-right font-bold text-ink-950">{rm(row.amount)}</td>
        <td className="whitespace-nowrap px-5 py-4 text-right">
          {row.status === 'pending' && <a href={whatsappLink(row)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-400 px-3 py-1.5 text-xs font-black text-ink-950 hover:bg-brand-300"><MessageCircle className="h-3.5 w-3.5" /> Pay by WhatsApp</a>}
          {row.status === 'completed' && row.payment_id && <a href={`/manage-package/payments/${row.payment_id}/receipt`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-bold text-ink-900 hover:border-brand-400 hover:bg-brand-50"><FileText className="h-3.5 w-3.5" /> Receipt</a>}
        </td>
      </tr>)}</tbody>
    </table></div> : <p className="px-5 py-10 text-center text-sm text-gray-500">{allRows.length ? 'No slot orders match your search.' : 'No slot orders yet.'}</p>}
  </section>;
}

export default function ManagePackage({ active, seats = [], history = [] }) {
  const { flash = {} } = usePage().props;

  return <AccountPageLayout>
    <Head title="Manage Slot"/>
    <div className="mx-auto max-w-6xl space-y-6">
      {flash.success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{flash.success}</div>}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-ink-950">Manage Slot</h1>
        <BackLink href="/profile#membership" className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-ink-900 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"><ArrowLeft className="h-4 w-4" />Back</BackLink>
      </div>

      {active ? <div id="membership" className="grid scroll-mt-6 gap-5 md:grid-cols-2">{seats.map(seat => <SeatCard key={seat.type} seat={seat}/>)}</div>
        : <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Activate a package first, then you can add Inspector and Contractor seats here.</p>}

      <SlotHistory history={history} />
    </div>
  </AccountPageLayout>;
}
