import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';

const date = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function statusOf(trainee) {
  if (trainee.state === 'active') return { label: 'Active', tone: 'bg-emerald-50 text-emerald-700' };
  if (trainee.state === 'pending') return { label: 'Awaiting payment', tone: 'bg-amber-50 text-amber-800' };
  if (trainee.state === 'expired') return { label: 'Expired', tone: 'bg-orange-50 text-orange-700' };
  return { label: 'No package', tone: 'bg-gray-100 text-gray-600' };
}

export default function Trainees({ trainees = [] }) {
  const active = trainees.filter(trainee => trainee.active).length;

  return <AppLayout title="Trainees">
    <Head title="Trainees"/>
    <div className="mx-auto max-w-6xl">
      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Companies under you</h2>
            <p className="text-xs text-gray-500">Companies that activated a package you bought.</p>
          </div>
          <p className="text-xs text-gray-500"><b className="text-gray-900">{trainees.length}</b> registered · <b className="text-emerald-700">{active}</b> active</p>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-gray-50 font-bold uppercase tracking-wider text-gray-500"><tr><th className="w-10 px-3 py-2">#</th><th className="px-3 py-2">Company</th><th className="px-3 py-2">Package</th><th className="px-3 py-2">Activation code</th><th className="px-3 py-2">Registered</th><th className="px-3 py-2">Expires</th><th className="px-3 py-2">Status</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {trainees.map((trainee, index) => { const status = statusOf(trainee); const codes = trainee.activation_codes ?? []; const latest = codes[0]; return <tr key={trainee.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-gray-400">{index + 1}</td>
              <td className="px-3 py-2"><strong className="text-sm font-semibold text-gray-900">{trainee.company_name ?? '—'}</strong><span className="block text-gray-500">{[trainee.company_code, trainee.email].filter(Boolean).join(' · ')}</span></td>
              <td className="px-3 py-2 text-gray-700">{trainee.package ?? '—'}</td>
              <td className="px-3 py-2">{latest ? <><code className="font-semibold text-gray-900">{latest.code}</code>{codes.length > 1 && <span className="ml-1 text-gray-400" title={codes.map(item => item.code).join('\n')}>+{codes.length - 1} more</span>}</> : <span className="text-gray-400">—</span>}</td>
              <td className="whitespace-nowrap px-3 py-2 text-gray-600">{date(trainee.registered_at)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-gray-600">{date(trainee.end_date)}</td>
              <td className="px-3 py-2"><span className={`rounded-full px-2.5 py-0.5 font-semibold ${status.tone}`}>{status.label}</span></td>
            </tr>; })}
            {!trainees.length && <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No company has used one of your activation codes yet.</td></tr>}
          </tbody>
        </table></div>
      </section>
    </div>
  </AppLayout>;
}
