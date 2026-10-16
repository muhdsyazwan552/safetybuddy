// Daily Inspection Report - SPGPNC & BSPR performance of one contractor on one day.
import React from 'react';
import { Panel, RankMedal, RankStrip, SwitchChips, ResultText, Status, pct, rm, num, benchLabel } from './parts';

export default function DailyReportView({ report: r, children }) {
    const s = r.settings;
    const penaltyNote = { pending_review: 'Pending Manager review', confirmed: 'Confirmed by Manager', waived: 'Waived by Manager' }[r.penalty_status];

    const rows = [
        { k: 'SP', actual: r.sp, bench: benchLabel(s.sp_benchmark), res: r.result.sp, pen: r.penalty.sp, note: null },
        { k: 'G', actual: r.g, bench: benchLabel(s.g_benchmark), res: r.result.g, pen: r.penalty.g, note: null },
        { k: 'P', actual: r.p, bench: benchLabel(s.p_benchmark), res: r.result.p, pen: r.penalty.p, note: null },
        { k: 'N', actual: r.n, bench: null, note: `${r.nc} NC × ${rm(s.nc_penalty)}`, pen: r.penalty.nc },
        { k: 'C', actual: r.c, bench: null, note: `${r.cc} CC × ${rm(s.cc_penalty)}`, pen: r.penalty.cc },
    ];

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-ink-900">Daily Inspection Report</h1>
                    <p className="text-sm font-semibold text-brand-800">SPGPNC &amp; BSPR Performance</p>
                </div>
                <div className="space-y-1 text-sm text-slate-700 sm:text-right">
                    <p><b>Project:</b> {r.project} &nbsp;|&nbsp; <b>Contractor:</b> {r.subcon}</p>
                    <p><b>Date:</b> {r.date} &nbsp;|&nbsp; <b>Report:</b> {r.report_no}</p>
                    <p className="flex flex-wrap items-center gap-2 sm:justify-end"><b>Status:</b> <Status value={r.status} /></p>
                    <SwitchChips settings={s} />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Panel title="Safety Passport sampling">
                    {r.sampled === null ? (
                        <p className="text-sm text-slate-500">No Safety Passport sampling was recorded for this day, so SP and the overall score are not available.</p>
                    ) : (
                        <>
                            <p className="text-lg font-bold text-slate-800">
                                {r.sampled} sampled • {r.compliant} registered • {r.not_registered} unregistered
                            </p>
                            <p className="mt-1 text-slate-600">SP compliance: <b className="text-3xl text-ink-900">{pct(r.sp)}</b></p>
                        </>
                    )}
                </Panel>
                <Panel title="Inspection findings">
                    <p className="text-lg font-bold text-slate-800">{r.total} total</p>
                    <p className="mt-1 text-base font-semibold text-slate-700">
                        {r.good} GOOD • {r.poor} POOR • {r.nc} NC • {r.cc} CC
                    </p>
                </Panel>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <table className="min-w-full text-center text-sm">
                    <thead className="bg-ink-900 text-white">
                        <tr>
                            <th className="px-4 py-2.5">Metric</th><th className="px-4 py-2.5">Actual score</th><th className="px-4 py-2.5">Benchmark</th>
                            <th className="px-4 py-2.5">Result</th><th className="px-4 py-2.5">Calculated penalty</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rows.map((x) => (
                            <tr key={x.k}>
                                <td className="bg-amber-50 px-4 py-2.5 font-extrabold">{x.k}</td>
                                <td className="px-4 py-2.5 font-bold text-ink-900">{pct(x.actual)}</td>
                                <td className="px-4 py-2.5">{x.bench || 'No benchmark'}</td>
                                <td className="px-4 py-2.5">{x.note ? x.note : <ResultText result={x.res} />}</td>
                                <td className="px-4 py-2.5">{rm(x.pen)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Panel title="SPGPNC score">
                    <p className="text-5xl font-extrabold text-ink-900">{r.complete && s.scoring_on ? pct(r.spgpnc) : '-'}</p>
                    <p className="mt-1 text-sm text-slate-500">(SP + G + P + N + C) ÷ 5</p>
                    {!r.complete && <p className="mt-2 text-xs font-semibold text-amber-600">Incomplete: needs Safety Passport sampling and at least one finding.</p>}
                </Panel>
                <Panel title="BSPR rank" tone="grey">
                    <RankMedal rank={r.rank} />
                    <p className="mt-2 text-sm text-slate-500">{r.rank ? 'Based on the configured ranking below.' : 'No rank until the report is complete.'}</p>
                </Panel>
                <Panel title="Calculated penalty" tone="gold">
                    <p className="text-5xl font-extrabold text-ink-900">{rm(r.penalty.total)}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{s.penalties_on ? penaltyNote : 'Penalties are switched off'}</p>
                    {r.reviewed_by && <p className="text-xs text-slate-500">By {r.reviewed_by}</p>}
                </Panel>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Panel title="Configured ranking"><RankStrip settings={s} /></Panel>
                <Panel title="Required follow-up">
                    {r.follow_up?.length ? (
                        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{r.follow_up.map((t) => <li key={t}>{t}</li>)}</ul>
                    ) : (
                        <p className="text-sm text-emerald-700">Nothing outstanding.</p>
                    )}
                </Panel>
            </div>

            {children}

            <p className="rounded-xl bg-amber-50 px-4 py-3 text-xs text-slate-600">
                Scores are calculated using unrounded values. Report approval and NC closure are separate processes. Calculated penalties are subject to Manager review before enforcement.
            </p>
        </div>
    );
}
