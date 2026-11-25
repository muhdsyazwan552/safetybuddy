import React, { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const PERIODS = [
  { key: 'weekly', label: 'Weekly', hint: 'Last 8 weeks, Monday to Sunday' },
  { key: 'monthly', label: 'Monthly', hint: 'Last 6 months' },
];

const MONEY = [
  { key: 'standard', name: 'Standard package', color: '#12171E' },
  { key: 'provider_plan', name: 'Training Provider plan', color: '#F5B800' },
  { key: 'provider_orders', name: 'Packages bought by providers', color: '#2563EB' },
  { key: 'slots', name: 'Extra user slots', color: '#0D9488' },
];

const COUNTS = [
  { key: 'registrations', name: 'New accounts registered', color: '#2563EB' },
  { key: 'purchases', name: 'Packages bought', color: '#D97706' },
];

const rm = (value) => `RM ${Number(value || 0).toLocaleString('en-MY', { maximumFractionDigits: 0 })}`;
const shortRm = (value) => (value >= 1000 ? `${value / 1000}k` : value);
const axis = { fontSize: 12, fill: '#64748b' };

function Panel({ title, subtitle, empty, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500">{subtitle}</p>
      <div className="relative mt-4 h-72">
        {children}
        {empty && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-400">Nothing recorded in this period yet</p>}
      </div>
    </section>
  );
}

export default function ActivityCharts({ charts }) {
  const [period, setPeriod] = useState('weekly');
  const data = charts[period];
  const current = PERIODS.find((p) => p.key === period);
  const noMoney = data.every((row) => MONEY.every((m) => !row[m.key]));
  const noCounts = data.every((row) => COUNTS.every((c) => !row[c.key]));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-bold text-slate-800">Activity</h2>
          <p className="text-sm text-slate-500">Payments, new accounts and package purchases · {current.hint}</p>
        </div>
        <div className="inline-flex rounded-lg bg-slate-100 p-1" role="tablist" aria-label="Chart period">
          {PERIODS.map((p) => (
            <button key={p.key} role="tab" aria-selected={period === p.key} onClick={() => setPeriod(p.key)} className={`rounded-md px-4 py-1.5 text-sm font-semibold transition ${period === p.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{p.label}</button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Payments (RM)" subtitle="Confirmed payments by type; extra slots are counted when billed" empty={noMoney}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={shortRm} width={44} />
              <Tooltip formatter={(value, name) => [rm(value), name]} cursor={{ fill: 'rgba(148,163,184,.15)' }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              {MONEY.map((m) => <Bar key={m.key} dataKey={m.key} name={m.name} stackId="money" fill={m.color} maxBarSize={44} />)}
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="New accounts and package purchases" subtitle="Company accounts registered and packages paid for" empty={noCounts}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
              <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              {COUNTS.map((c) => <Line key={c.key} type="linear" dataKey={c.key} name={c.name} stroke={c.color} strokeWidth={2.5} dot={{ r: 3.5 }} activeDot={{ r: 5 }} />)}
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </section>
  );
}
