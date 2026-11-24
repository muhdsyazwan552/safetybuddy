import BackLink from '@/Components/shared/BackLink';
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/Pages/WSIS/Layout';
import { STATES } from './Trainees';

const rm = value => `RM ${Number(value).toLocaleString('en-MY')}`;
const date = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const SUBSCRIPTION = {
  active: 'bg-emerald-50 text-emerald-700',
  expired: 'bg-orange-50 text-orange-700',
};

function Field({ label, children }) {
  return <div className="grid gap-1 px-6 py-3.5 sm:grid-cols-[180px_1fr] sm:gap-4">
    <dt className="text-sm text-gray-500">{label}</dt>
    <dd className="text-sm font-semibold text-gray-900">{children || '—'}</dd>
  </div>;
}

export default function TraineeDetails({ trainee, subscriptions = [], codes = [] }) {
  const status = STATES[trainee.state] ?? STATES.no_package;
  const left = trainee.days_left;
  const canRenew = left === null || left <= 90;

  return <AppLayout title={trainee.company_name}>
    <Head title={trainee.company_name}/>
    <div className="w-full space-y-6">
      <BackLink href="/training-provider/trainees" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900"><ArrowLeft className="h-4 w-4"/>Back</BackLink>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-black tracking-tight text-gray-900">{trainee.company_name}</h1><span className={`rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}>{status.label}</span></div>
          <p className="mt-1 text-sm text-gray-500">{trainee.company_code}</p>
        </div>
        {canRenew && <Link href="/training-provider/packages/renew" className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-ink-900 transition hover:bg-amber-400">Renew this Participant</Link>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white ring-1 ring-gray-200">
          <h2 className="border-b border-gray-100 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Participant</h2>
          <dl className="divide-y divide-gray-100">
            <Field label="Participant name">{trainee.company_name}</Field>
            <Field label="Participant code">{trainee.company_code}</Field>
            <Field label="Email">{trainee.email}</Field>
            <Field label="Contact">{trainee.contact}</Field>
            <Field label="Registered under you">{date(trainee.registered_at)}</Field>
          </dl>
        </section>

        <section className="rounded-2xl bg-white ring-1 ring-gray-200">
          <h2 className="border-b border-gray-100 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Current package</h2>
          <dl className="divide-y divide-gray-100">
            <Field label="Package">{trainee.package}</Field>
            <Field label="Status">{status.label}</Field>
            <Field label="Started">{date(trainee.start_date)}</Field>
            <Field label="Expires">{date(trainee.end_date)}</Field>
            <Field label="Time left">{left === null ? null : left < 0 ? `Ended ${Math.abs(left)} days ago` : left === 0 ? 'Expires today' : `${left} days left`}</Field>
          </dl>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <h2 className="border-b border-gray-100 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Package history</h2>
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500"><tr><th className="px-6 py-3">Package</th><th className="px-6 py-3">Type</th><th className="px-6 py-3">Started</th><th className="px-6 py-3">Ends</th><th className="px-6 py-3">Status</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {subscriptions.map(item => <tr key={item.id}>
              <td className="px-6 py-3.5 font-semibold text-gray-900">{item.package ?? '—'}</td>
              <td className="px-6 py-3.5 text-gray-600">{item.type === 'renew' ? 'Renewal' : 'New'}</td>
              <td className="whitespace-nowrap px-6 py-3.5 text-gray-600">{date(item.start_date)}</td>
              <td className="whitespace-nowrap px-6 py-3.5 text-gray-600">{date(item.end_date)}</td>
              <td className="px-6 py-3.5"><span className={`rounded-full px-3 py-1 text-xs font-bold ${SUBSCRIPTION[item.status] ?? 'bg-gray-100 text-gray-600'}`}>{item.status === 'active' ? 'Active' : item.status === 'expired' ? 'Expired' : item.status}</span></td>
            </tr>)}
            {!subscriptions.length && <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">This participant has no package yet.</td></tr>}
          </tbody>
        </table></div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <h2 className="border-b border-gray-100 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Activation codes used</h2>
        <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500"><tr><th className="px-6 py-3">Activation code</th><th className="px-6 py-3">Package</th><th className="px-6 py-3">Price</th><th className="px-6 py-3">Order</th><th className="px-6 py-3">Used on</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {codes.map(item => <tr key={item.id}>
              <td className="px-6 py-3.5"><code className="font-bold tracking-wider text-gray-900">{item.code}</code></td>
              <td className="px-6 py-3.5 text-gray-700">{item.package ?? '—'}</td>
              <td className="whitespace-nowrap px-6 py-3.5 text-gray-700">{rm(item.price)}</td>
              <td className="px-6 py-3.5 text-gray-600">{item.batch_ref}</td>
              <td className="whitespace-nowrap px-6 py-3.5 text-gray-600">{date(item.used_at)}</td>
            </tr>)}
            {!codes.length && <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No activation code from you has been used by this participant.</td></tr>}
          </tbody>
        </table></div>
      </section>
    </div>
  </AppLayout>;
}
