// Monthly Inspection Report - pooled counts of the approved daily reports.
import React from 'react';
import { Link } from '@inertiajs/react';
import HeroMeta from '@/Components/shared/HeroMeta';
import ReviewProgress from '@/Components/shared/ReviewProgress';
import { Panel, RankMedal, RankStrip, SwitchText, HeroStatusText, ResultText, Status, pct, rm, num, benchLabel } from './parts';

const monthName = (period) => new Date(`${period}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

export default function MonthlyReportView({ report: m, dailyHref, children }) {
    const s = m.settings;
    const total = m.total;
    const spBelow = m.sp !== null && m.sp < s.sp_benchmark;
    const gBelow = m.g !== null && m.g < s.g_benchmark;
    const pBelow = m.p !== null && m.p < s.p_benchmark;
    const coverage = m.inspections_approved ? Math.round((m.sp_assessed / m.inspections_approved) * 100) : 0;

    const rows = [
        { k: 'SP', calc: m.sp_observations ? `${m.sp_compliant} ÷ ${m.sp_observations} × 100` : '-', score: m.sp, bench: benchLabel(s.sp_benchmark), res: m.sp === null ? 'na' : spBelow ? 'below' : 'meets' },
        { k: 'G', calc: total ? `${m.good} ÷ ${total} × 100` : '-', score: m.g, bench: benchLabel(s.g_benchmark), res: m.g === null ? 'na' : gBelow ? 'below' : 'meets' },
        { k: 'P', calc: total ? `100 − (${m.poor} ÷ ${total} × 100)` : '-', score: m.p, bench: benchLabel(s.p_benchmark), res: m.p === null ? 'na' : pBelow ? 'below' : 'meets' },
        { k: 'N', calc: total ? `100 − (${m.nc} ÷ ${total} × 100)` : '-', score: m.n, bench: null, note: `${m.nc} NC recorded` },
        { k: 'C', calc: total ? `100 − (${m.cc} ÷ ${total} × 100)` : '-', score: m.c, bench: null, note: `${m.cc} CC recorded` },
    ];

    const breakdown = [
        ['SP', `${m.penalty.sp_below} below × ${rm(s.sp_penalty)}`, m.penalty.sp],
        ['G', `${m.penalty.g_below} below × ${rm(s.g_penalty)}`, m.penalty.g],
        ['P', `${m.penalty.p_below} below × ${rm(s.p_penalty)}`, m.penalty.p],
        ['NC', `${m.nc} × ${rm(s.nc_penalty)}`, m.penalty.nc],
        ['CC', `${m.cc} × ${rm(s.cc_penalty)}`, m.penalty.cc],
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">{m.report_no}</p>
                    <h1 className="mt-1 text-xl font-extrabold leading-tight">Monthly Inspection Report</h1>
                    <p className="text-sm font-semibold text-gray-300">SPGPNC &amp; BSPR Performance</p>
                    <HeroMeta rows={[
                        ['Project', m.project],
                        ['Contractor', m.subcon],
                        ['Period', monthName(m.period)],
                        ['Status', <HeroStatusText key="s" value={m.status} />],
                        ['Settings', <SwitchText key="w" settings={s} />],
                    ]} />
                </div>
            </div>

            <ReviewProgress kind="visit" status={m.status} />
            <div className="grid gap-4 md:grid-cols-3">
                <Panel title="Monthly coverage">
                    <p className="text-lg font-bold text-slate-800">{m.inspections_approved} approved inspection{m.inspections_approved === 1 ? '' : 's'}</p>
                    <p className="text-sm text-slate-600">SP assessed: {m.sp_assessed} of {m.inspections_approved} • <b>{coverage}%</b> coverage</p>
                    {m.inspections_total > m.inspections_approved && (
                        <p className="mt-1 text-xs font-semibold text-amber-600">{m.inspections_total - m.inspections_approved} more inspection(s) are not approved yet and are not counted.</p>
                    )}
                </Panel>
                <Panel title="Safety Passport sampling">
                    <p className="text-lg font-bold text-slate-800">{num(m.sp_observations)} sampling observations</p>
                    <p className="text-sm text-slate-600">{m.sp_compliant} compliant • {m.sp_observations - m.sp_compliant} non-compliant</p>
                    <p className="mt-1 text-slate-600">SP: <b className="text-2xl text-ink-900">{pct(m.sp)}</b></p>
                </Panel>
                <Panel title="Inspection findings">
                    <p className="text-lg font-bold text-slate-800">{total} total</p>
                    <p className="text-sm font-semibold text-slate-700">{m.good} GOOD • {m.poor} POOR • {m.nc} NC • {m.cc} CC</p>
                </Panel>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-md shadow-gray-200/60">
                <table className="min-w-full text-center text-sm">
                    <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                        <tr><th className="px-4 py-2.5">Metric</th><th className="px-4 py-2.5">Monthly calculation</th><th className="px-4 py-2.5">Monthly score</th><th className="px-4 py-2.5">Benchmark</th><th className="px-4 py-2.5">Result</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((x) => (
                            <tr key={x.k}>
                                <td className="bg-amber-50 px-4 py-2.5 font-extrabold">{x.k}</td>
                                <td className="px-4 py-2.5 text-slate-600">{x.calc}</td>
                                <td className="px-4 py-2.5 font-bold text-ink-900">{pct(x.score)}</td>
                                <td className="px-4 py-2.5">{x.bench || 'No benchmark'}</td>
                                <td className="px-4 py-2.5">{x.note ? x.note : <ResultText result={x.res} />}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Panel title="Monthly SPGPNC">
                    <p className="text-5xl font-extrabold text-ink-900">{m.spgpnc !== null && s.scoring_on ? pct(m.spgpnc) : '-'}</p>
                    <p className="mt-1 text-sm text-slate-500">(SP + G + P + N + C) ÷ 5</p>
                    {m.spgpnc === null && <p className="mt-2 text-xs font-semibold text-amber-600">Complete SP coverage of every approved inspection is required for the overall score and rank.</p>}
                </Panel>
                <Panel title="BSPR rank" tone="grey">
                    <RankMedal rank={m.rank} />
                </Panel>
                <Panel title="Monthly calculated penalties" tone="gold">
                    <p className="text-5xl font-extrabold text-ink-900">{rm(m.penalty.total)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">Sum of inspection-level amounts • Manager review</p>
                </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Panel title={`Penalty breakdown • ${m.inspections_approved} inspections`}>
                    <table className="w-full text-sm">
                        <tbody className="divide-y divide-gray-100">
                            {breakdown.map(([k, calc, amount]) => (
                                <tr key={k}><td className="py-2 font-extrabold">{k}</td><td className="py-2 text-slate-600">{calc}</td><td className="py-2 text-right font-bold">= {rm(amount)}</td></tr>
                            ))}
                            <tr className="bg-amber-50"><td className="py-2.5 pl-2 font-extrabold" colSpan={2}>Total</td><td className="py-2.5 pr-2 text-right font-extrabold">= {rm(m.penalty.total)}</td></tr>
                        </tbody>
                    </table>
                </Panel>
                <div className="space-y-4">
                    <Panel title="Monthly interpretation">
                        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
                            <li>Use pooled monthly counts, not an average of daily percentages.</li>
                            <li>Repeated worker samples count as observations, not unique workers.</li>
                            <li>Penalties are summed from individual inspections, not reapplied to monthly scores.</li>
                        </ol>
                    </Panel>
                    <Panel title="BSPR ranking criteria"><RankStrip settings={s} /></Panel>
                </div>
            </div>

            {m.days?.length > 0 && (
                <Panel title={`Daily reports in this month (${m.days.length})`}>
                    <div className="divide-y divide-gray-100">
                        {m.days.map((d) => (
                            <Link key={d.id} href={dailyHref(d)} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm hover:bg-amber-50">
                                <span className="font-bold text-slate-800">{d.date}</span>
                                <span className="flex items-center gap-3">
                                    <span className="text-slate-600">{d.spgpnc !== null ? pct(d.spgpnc) : '-'} {d.rank || ''}</span>
                                    <span className="text-slate-600">{rm(d.penalty)}</span>
                                    <Status value={d.status} />
                                </span>
                            </Link>
                        ))}
                    </div>
                </Panel>
            )}

            {children}

            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-slate-600">
                Scores use unrounded values. Complete SP coverage is required for the monthly overall score and rank. Supervisor verification precedes Manager approval.
            </p>
        </div>
    );
}
