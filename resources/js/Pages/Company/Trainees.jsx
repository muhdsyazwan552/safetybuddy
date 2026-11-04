import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';

const date = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export const STATES = {
  active: { label: 'Active', tone: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'Awaiting payment', tone: 'bg-amber-50 text-amber-800' },
  expired: { label: 'Expired', tone: 'bg-orange-50 text-orange-700' },
  no_package: { label: 'No package', tone: 'bg-gray-100 text-gray-600' },
};

const fieldClass = 'mt-1 block rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold normal-case tracking-normal text-gray-900';

export default function Trainees({ trainees = [] }) {
  const [search, setSearch] = useState('');
  const [state, setState] = useState('');
  const [pkg, setPkg] = useState('');

  const packages = useMemo(() => [...new Set(trainees.map(trainee => trainee.package).filter(Boolean))].sort(), [trainees]);
  const shown = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return trainees.filter(trainee => (!state || trainee.state === state)
      && (!pkg || trainee.package === pkg)
      && (!needle || [trainee.company_name, trainee.company_code, trainee.email].some(value => (value ?? '').toLowerCase().includes(needle))));
  }, [trainees, search, state, pkg]);
  const active = trainees.filter(trainee => trainee.active).length;
  const filtered = search || state || pkg;
  const clear = () => { setSearch(''); setState(''); setPkg(''); };

  return <AppLayout title="Trainees">
    <Head title="Trainees"/>
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Companies under you</h2>
          <p className="text-sm text-gray-500">Companies that activated a package you bought. Open a company to see its full details.</p>
        </div>
        <p className="text-sm text-gray-500"><b className="text-gray-900">{trainees.length}</b> registered · <b className="text-emerald-700">{active}</b> active</p>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-2xl bg-white p-4 ring-1 ring-gray-200">
        <label className="min-w-[220px] flex-1 text-xs font-bold uppercase tracking-wider text-gray-500">Search
          <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Company name, code or email" className={`${fieldClass} w-full`}/>
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Status
          <select value={state} onChange={event => setState(event.target.value)} className={`${fieldClass} w-48`}>
            <option value="">All statuses</option>
            {Object.entries(STATES).map(([key, item]) => <option key={key} value={key}>{item.label} ({trainees.filter(trainee => trainee.state === key).length})</option>)}
          </select>
        </label>
        <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Package
          <select value={pkg} onChange={event => setPkg(event.target.value)} className={`${fieldClass} w-52`}>
            <option value="">All packages</option>
            {packages.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        {filtered && <button type="button" onClick={clear} className="pb-2 text-sm font-semibold text-gray-500 underline hover:text-gray-900">Clear filters</button>}
        <p className="ml-auto pb-2 text-sm text-gray-500">{shown.length} {shown.length === 1 ? 'result' : 'results'}</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-gray-500"><tr><th className="w-14 px-5 py-3">#</th><th className="px-5 py-3">Company</th><th className="px-5 py-3">Package</th><th className="px-5 py-3">Registered</th><th className="px-5 py-3">Expires</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Details</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {shown.map((trainee, index) => { const status = STATES[trainee.state] ?? STATES.no_package; return <tr key={trainee.id} className="hover:bg-gray-50">
              <td className="px-5 py-4 text-gray-400">{index + 1}</td>
              <td className="px-5 py-4"><Link href={`/training-provider/trainees/${trainee.id}`} className="font-semibold text-gray-900 hover:underline">{trainee.company_name ?? '—'}</Link><span className="block text-xs text-gray-500">{[trainee.company_code, trainee.email].filter(Boolean).join(' · ')}</span></td>
              <td className="px-5 py-4 text-gray-700">{trainee.package ?? '—'}</td>
              <td className="whitespace-nowrap px-5 py-4 text-gray-600">{date(trainee.registered_at)}</td>
              <td className="whitespace-nowrap px-5 py-4 text-gray-600">{date(trainee.end_date)}</td>
              <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${status.tone}`}>{status.label}</span></td>
              <td className="px-5 py-4 text-right"><Link href={`/training-provider/trainees/${trainee.id}`} className="rounded-lg bg-ink-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-ink-800">View</Link></td>
            </tr>; })}
            {!shown.length && <tr><td colSpan="7" className="px-5 py-12 text-center text-gray-500">{filtered ? 'No company matches these filters.' : 'No company has used one of your activation codes yet.'}</td></tr>}
          </tbody>
        </table></div>
      </section>
    </div>
  </AppLayout>;
}
