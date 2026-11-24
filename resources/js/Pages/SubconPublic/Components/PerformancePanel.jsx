// Leader only: daily BSPR table (SP / G / P / N / C, score, rank, penalty) with the explanation and the formula.
import React, { useState } from 'react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { Calculator, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';

const RANK = {
    GOLD: { cls: 'bg-amber-100 text-amber-900', text: 'Your company shows strong safety compliance. Maintain the practices that earned this rank.' },
    SILVER: { cls: 'bg-slate-100 text-slate-800', text: 'Your company shows moderate safety compliance. Focus on areas that fall below your benchmarks.' },
    BRONZE: { cls: 'bg-orange-100 text-orange-900', text: 'Your company’s safety practices need improvement. Address the most important inspection findings first.' },
};

const pct = (v) => (v === null || v === undefined ? '–' : `${Math.round(Number(v))}%`);
const score = (v) => (v === null || v === undefined ? 'Incomplete' : `${Number(v).toFixed(2)}%`);

const COLS = [
    ['sp', 'SP'], ['g', 'G'], ['p', 'P'], ['n', 'N'], ['c', 'C'],
];

const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const shift = (iso, days) => {
    const [y, m, d] = iso.split('-').map(Number);
    return toISO(new Date(y, m - 1, d + days));
};

export default function PerformancePanel({ performance }) {
    const { daily = [], monthly = null } = performance;
    const today = toISO(new Date());
    const [date, setDate] = useState(today);
    const rows = daily.filter((d) => d.date === date);
    const latest = daily[0]?.date;

    return (
        <div className="space-y-4">
            <section aria-label="Daily BSPR report" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-900 text-brand-400">
                            <Trophy aria-hidden="true" className="h-5 w-5" />
                        </span>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">Daily BSPR</h3>
                            <p className="text-xs text-gray-600">Best Safety Practices Rank</p>
                        </div>
                    </div>
                    {monthly && (
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                            Monthly · {monthly.period} · {Number(monthly.spgpnc ?? 0).toFixed(2)}% {monthly.rank || ''}
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                    <button type="button" onClick={() => setDate(shift(date, -1))} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600" aria-label="Previous day"><ChevronLeft className="h-4 w-4" /></button>
                    <input
                        type="date"
                        value={date}
                        max={today}
                        onChange={(e) => e.target.value && setDate(e.target.value)}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-800"
                        aria-label="Report date"
                    />
                    <button type="button" onClick={() => setDate(shift(date, 1))} disabled={date >= today} className="rounded-xl border border-gray-200 bg-white p-2 text-gray-600 disabled:opacity-40" aria-label="Next day"><ChevronRight className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setDate(today)} disabled={date === today} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-40">Today</button>
                    {latest && latest !== date && (
                        <button type="button" onClick={() => setDate(latest)} className="ml-auto text-xs font-bold text-brand-800 hover:underline">Latest report: {latest}</button>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm [&_th]:!rounded-none">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-extrabold uppercase tracking-wider text-gray-600">
                                <th className="px-3 py-2.5 text-left">As of</th>
                                <th className="px-3 py-2.5 text-left">Project</th>
                                {COLS.map(([k, l]) => <th key={k} className="px-2 py-2.5 text-center">{l}</th>)}
                                <th className="px-3 py-2.5 text-center">SPGPNC Score</th>
                                <th className="px-3 py-2.5 text-center">BSPR</th>
                                <th className="px-3 py-2.5 text-right">Total Penalty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.length === 0 && (
                                <tr><td colSpan={10} className="px-4 py-6 text-center text-gray-400">{date === today ? 'No report yet for today.' : `No report for ${date}.`}</td></tr>
                            )}
                            {rows.map((d) => (
                                <tr key={d.id}>
                                    <td className="whitespace-nowrap px-3 py-2.5 font-bold text-gray-900">{d.date}</td>
                                    <td className="max-w-[160px] truncate px-3 py-2.5 text-gray-600">{d.project}</td>
                                    {COLS.map(([k]) => <td key={k} className="px-2 py-2.5 text-center text-gray-700">{pct(d[k])}</td>)}
                                    <td className="px-3 py-2.5 text-center font-extrabold text-ink-900">{score(d.spgpnc)}</td>
                                    <td className="px-3 py-2.5 text-center">
                                        {d.rank ? <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${RANK[d.rank]?.cls || 'bg-gray-100 text-gray-800'}`}>{d.rank}</span> : '–'}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-gray-700">RM{Number(d.penalty).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-gray-900">Rank guide</h3>
                    <Popover>
                        <PopoverButton className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900">
                            <Calculator aria-hidden="true" className="h-4 w-4" />
                            How it’s calculated
                        </PopoverButton>
                        <PopoverPanel anchor={{ to: 'bottom end', gap: '8px', padding: '12px' }} className="z-50 max-h-[60vh] w-[min(28rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-gray-200 bg-white p-4 text-gray-700 shadow-xl">
                            <h4 className="mb-3 text-sm font-bold text-gray-900">Score, rank and penalty formulas</h4>
                            <ul className="space-y-2 text-sm leading-relaxed">
                                <li><b>SP</b> = (Sampled &minus; Not registered) &divide; Sampled</li>
                                <li><b>G</b> = GOOD &divide; Total findings</li>
                                <li><b>P</b> = 100% &minus; (POOR &divide; Total findings)</li>
                                <li><b>N</b> = 100% &minus; (Nonconformance &divide; Total findings)</li>
                                <li><b>C</b> = 100% &minus; (Client complaint &divide; Total findings)</li>
                                <li><b>SPGPNC Score</b> = average of SP, G, P, N and C. It shows &ldquo;Incomplete&rdquo; if there is no Safety Passport sample or no finding that day.</li>
                                <li><b>BSPR</b>: Gold = 90% or more &middot; Silver = 60% or more &middot; Bronze = below 60%</li>
                                <li>
                                    <b>Total Penalty</b> = RM300 each for SP below 100%, G below 80% and P below 80%,
                                    + RM100 for every nonconformance + RM500 for every client complaint
                                </li>
                            </ul>
                        </PopoverPanel>
                    </Popover>
                </div>
                <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                    {Object.entries(RANK).map(([name, { cls, text }]) => (
                        <div key={name} className="rounded-xl bg-gray-50 p-3">
                            <dt className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>{name}</dt>
                            <dd className="mt-2 text-sm leading-relaxed text-gray-700">{text}</dd>
                        </div>
                    ))}
                </dl>
                <p className="mt-4 text-sm text-gray-600">
                    Total Penalty is the amount the system automatically calculates for scores below their benchmarks and for each recorded
                    nonconformance or client complaint. It helps raise safety awareness and serves as a reference for the project owner.
                </p>
            </section>
        </div>
    );
}
