import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AccountPageLayout from '@/Layouts/AccountPageLayout';

const rm = value => `RM ${Number(value).toLocaleString('en-MY')}`;

function SeatCard({ seat }) {
  const form = useForm({ type: seat.type, quantity: 1 });
  const qty = Math.max(0, Number(form.data.quantity) || 0);
  const limit = (seat.included ?? 0) + seat.extra;
  const noun = seat.type === 'executor' ? 'Contractor' : seat.label;
  const submit = event => { event.preventDefault(); form.post('/manage-package/seats', { preserveScroll: true, onSuccess: () => form.reset('quantity') }); };

  return <section id={seat.type === 'executor' ? 'contractor-slots' : 'inspector-slots'} className="flex scroll-mt-6 flex-col rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
    <h2 className="text-xl font-bold text-gray-900">Extra {noun} slots</h2>
    <p className="mt-1 text-sm text-gray-500">{rm(seat.price)} per {noun}, paid once. Seats you buy stay when the package renews.</p>
    <div className="mt-5 grid grid-cols-3 gap-3 text-center">
      <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-black">{seat.included ?? 0}</p><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Included</p></div>
      <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-black">{seat.extra}</p><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Extra bought</p></div>
      <div className="rounded-xl bg-gray-50 p-3"><p className="text-2xl font-black">{seat.used}<span className="text-base text-gray-400"> / {limit}</span></p><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">In use</p></div>
    </div>
    <form onSubmit={submit} className="mt-5 rounded-xl bg-ink-900 p-5 text-white">
      <label htmlFor={`qty-${seat.type}`} className="text-xs font-bold uppercase tracking-wider text-white/60">Seats to add</label>
      <input id={`qty-${seat.type}`} type="number" min="1" max="50" value={form.data.quantity} onChange={event => form.setData('quantity', event.target.value)} className="mt-2 w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-lg font-bold text-white"/>
      <p className="mt-3 flex items-baseline justify-between"><span className="text-sm text-white/60">{qty} × {rm(seat.price)}</span><span className="text-2xl font-black text-brand-300">{rm(qty * seat.price)}</span></p>
      <button disabled={form.processing || qty < 1} className="mt-4 w-full rounded-lg bg-brand-400 px-5 py-2.5 font-black text-ink-900 transition hover:bg-brand-300 disabled:opacity-50">{form.processing ? 'Adding…' : `Add ${noun} ${qty === 1 ? 'slot' : 'slots'}`}</button>
      {form.errors.quantity && <p className="mt-2 text-sm text-rose-300">{form.errors.quantity}</p>}
    </form>
  </section>;
}

export default function ManagePackage({ active, seats = [] }) {
  const { flash = {} } = usePage().props;

  return <AccountPageLayout>
    <Head title="Manage Slot"/>
    <div className="mx-auto max-w-6xl space-y-6">
      {flash.success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800" role="status">{flash.success}</div>}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-ink-950">Manage Slot</h1>
        <Link href="/profile#membership" className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-ink-900 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"><ArrowLeft className="h-4 w-4" />Back to membership</Link>
      </div>

      {active ? <div id="membership" className="grid scroll-mt-6 gap-5 md:grid-cols-2">{seats.map(seat => <SeatCard key={seat.type} seat={seat}/>)}</div>
        : <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">Activate a package first, then you can add Inspector and Contractor seats here.</p>}
    </div>
  </AccountPageLayout>;
}
