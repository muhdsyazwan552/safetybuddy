import React from 'react';
import { Head, Link } from '@inertiajs/react';
import SystemAdminLayout from '@/Layouts/SystemAdminLayout';
import ActivityCharts from './ActivityCharts';

const rm = (value) => `RM ${Number(value || 0).toLocaleString('en-MY', { maximumFractionDigits: 0 })}`;

const waitingFor = (iso) => {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso.replace(' ', 'T')).getTime()) / 86400000);
  return days < 1 ? 'Waiting since today' : `Oldest waiting ${days} day${days === 1 ? '' : 's'}`;
};

function Change({ amount, previous }) {
  if (!previous) return <span className="text-slate-400">{amount ? 'Nothing last month' : 'No payments yet'}</span>;
  const pct = Math.round(((amount - previous) / previous) * 100);
  if (pct === 0) return <span className="text-slate-500">Same as last month <span className="text-slate-400">({rm(previous)})</span></span>;
  const up = pct > 0;
  return <span className={up ? 'text-emerald-600' : 'text-rose-600'}>{up ? '▲' : '▼'} {Math.abs(pct)}% <span className="text-slate-400">vs {rm(previous)} last month</span></span>;
}

function PaymentCard({ card }) {
  const slots = card.slots;
  const total = slots ? slots.inspector + slots.contractor : null;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <span className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-brand-100" aria-hidden="true" />
      <span className="mb-4 block h-1 w-8 rounded-full bg-brand-500" aria-hidden="true" />
      <p className="relative text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">{card.label}</p>
      {slots ? (
        <>
          <p className="relative mt-2 text-3xl font-bold tracking-tight text-ink-900">{total} <span className="text-base font-semibold text-slate-400">{total === 1 ? 'slot' : 'slots'}</span></p>
          <p className="relative mt-1 text-sm text-slate-600">Inspector <b>{slots.inspector}</b> · Contractor <b>{slots.contractor}</b></p>
          <p className="relative mt-3 text-xs"><span className="font-semibold text-slate-700">{rm(card.amount)} billed</span> · <Change amount={card.amount} previous={card.previous} /></p>
        </>
      ) : (
        <>
          <p className="relative mt-2 text-3xl font-bold tracking-tight text-ink-900">{rm(card.amount)}</p>
          <p className="relative mt-1 text-sm text-slate-500">{card.hint}</p>
          <p className="relative mt-3 text-xs"><Change amount={card.amount} previous={card.previous} /></p>
        </>
      )}
    </div>
  );
}

export default function SystemDashboard({ title, paymentCards, approvals, charts }) {
  const needsAction = approvals.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <Head title={title} />
      <SystemAdminLayout title={title} description="Payments, new accounts and approvals at a glance.">
        <section>
          <div className="mb-3">
            <h2 className="font-bold text-slate-800">Payments this month</h2>
            <p className="text-sm text-slate-500">{paymentCards.month} · confirmed payments only, compared with last month.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{paymentCards.cards.map((card) => <PaymentCard key={card.key} card={card} />)}</div>
        </section>

        <section>
          <div className="mb-3">
            <h2 className="font-bold text-slate-800">Needs your approval</h2>
            <p className="text-sm text-slate-500">{needsAction ? `${needsAction} item${needsAction === 1 ? '' : 's'} waiting for the system admin.` : 'Nothing is waiting for you.'}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {approvals.map((item) => (
              <Link key={item.label} href={item.href} className={`group rounded-xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${item.count ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                  <span className={`text-3xl font-black leading-none ${item.count ? 'text-amber-600' : 'text-slate-300'}`}>{item.count}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{item.hint}</p>
                <p className="mt-3 flex items-center justify-between text-xs font-semibold">
                  <span className={item.count ? 'text-amber-700' : 'text-slate-400'}>{item.count ? waitingFor(item.oldest) : 'All clear'}</span>
                  <span className="text-blue-600 group-hover:underline">Review →</span>
                </p>
              </Link>
            ))}
          </div>
        </section>

        <ActivityCharts charts={charts} />
      </SystemAdminLayout>
    </>
  );
}
