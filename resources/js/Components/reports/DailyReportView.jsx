// Daily Inspection Report - SPGPNC & BSPR performance of one contractor on one day.
import React from 'react';
import { Link } from '@inertiajs/react';
import { ChevronRight, ClipboardCheck, HardHat } from 'lucide-react';
import HeroMeta from '@/Components/shared/HeroMeta';
import { Panel, CompletionCard, RankMedal, RankStrip, SwitchText, HeroStatusText, ResultText, pct, rm, benchLabel } from './parts';

const EVAL_TEXT = { good: 'Good', poor: 'Poor', nonconformance: 'NC', clientcomplaint: 'CC' };

/** One row: opens the toolbox talk / inspection; the badge shows whether it is approved yet. */
function ItemLink({ href, icon: Icon, title, sub, status }) {
    const done = status === 'approved';
    const body = (
        <>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600"><Icon className="h-4 w-4" /></span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold text-gray-900">{title}</span>
                <span className="block truncate text-xs text-gray-500">{sub}</span>
            </span>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {done ? 'Approved' : 'Not approved'}
            </span>
            {href && <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />}
        </>
    );
    const cls = 'flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5';

    return href ? <Link href={href} className={`${cls} transition hover:border-gray-300 hover:bg-gray-50`}>{body}</Link> : <div className={cls}>{body}</div>;
}

export default function DailyReportView({ report: r, talkHref, inspectionHref, children }) {
    const s = r.settings;
    const penaltyNote = { pending_review: 'Confirmed automatically once the report is complete', confirmed: 'Confirmed automatically', waived: 'Waived' }[r.penalty_status];

    const rows = [
        { k: 'SP', actual: r.sp, bench: benchLabel(s.sp_benchmark), res: r.result.sp, pen: r.penalty.sp, note: null },
        { k: 'G', actual: r.g, bench: benchLabel(s.g_benchmark), res: r.result.g, pen: r.penalty.g, note: null },
        { k: 'P', actual: r.p, bench: benchLabel(s.p_benchmark), res: r.result.p, pen: r.penalty.p, note: null },
        { k: 'N', actual: r.n, bench: null, note: `${r.nc} NC × ${rm(s.nc_penalty)}`, pen: r.penalty.nc },
        { k: 'C', actual: r.c, bench: null, note: `${r.cc} CC × ${rm(s.cc_penalty)}`, pen: r.penalty.cc },
    ];

    return (
        <div className="space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">{r.report_no}</p>
                    <h1 className="mt-1 text-xl font-extrabold leading-tight">Daily Inspection Report</h1>
                    <p className="text-sm font-semibold text-gray-300">SPGPNC &amp; BSPR Performance</p>
                    <HeroMeta rows={[
                        ['Project', r.project],
                        ['Contractor', r.subcon],
                        ['Date', r.date],
                        ['Status', <HeroStatusText key="s" value={r.status} />],
                        ['Settings', <SwitchText key="w" settings={s} />],
                    ]} />
                </div>
            </div>

            <CompletionCard status={r.status} blockers={r.blockers} kind="daily report" />
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
                            {r.sp_sources?.length > 0 && (
                                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                                    {r.sp_sources.map((x) => (
                                        <li key={x.talk_id}>
                                            From <a href={talkHref?.({ id: x.talk_id })} className="font-bold underline">{x.code}</a>: {x.sampled} sampled, {x.not_registered} unregistered
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </>
                    )}
                </Panel>
                <Panel title="Inspection findings">
                    <p className="text-lg font-bold text-slate-800">{r.total} inspection{r.total === 1 ? '' : 's'}</p>
                    <p className="mt-1 text-base font-semibold text-slate-700">
                        {r.good} GOOD • {r.poor} POOR • {r.nc} NC • {r.cc} CC
                    </p>
                    <p className="mt-1.5 text-xs text-slate-500">
                        Counted from the {r.items?.inspections?.length ?? r.total} inspection{(r.items?.inspections?.length ?? r.total) === 1 ? '' : 's'} listed below
                        {r.items?.not_scored > 0 && ` (${r.items.not_scored} older record${r.items.not_scored === 1 ? '' : 's'} with an evaluation the score does not count)`}.
                    </p>
                </Panel>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-md shadow-gray-200/60">
                <table className="min-w-full text-center text-sm">
                    <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-500">
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

            {/* what this report is made of: open each toolbox talk / inspection */}
            <Panel title={`Toolbox talks (${r.items?.talks?.length ?? 0}) & inspections (${r.items?.inspections?.length ?? 0}) in this report`}>
                {(!r.items || (r.items.talks.length === 0 && r.items.inspections.length === 0)) ? (
                    <p className="text-sm text-slate-500">No toolbox talk or inspection is linked to this day.</p>
                ) : (
                    <div className="space-y-2">
                        {r.items.talks.map((t) => (
                            <ItemLink key={`t${t.id}`} href={talkHref?.(t)} icon={HardHat} title={t.code}
                                sub={`Toolbox talk · ${t.conducted ? 'conducted' : 'not conducted'} · ${t.attended} present`} status={t.status} />
                        ))}
                        {r.items.inspections.map((i) => (
                            <ItemLink key={`i${i.id}`} href={inspectionHref?.(i)} icon={ClipboardCheck} title={i.code}
                                sub={`Inspection · ${i.topic || '-'} · ${EVAL_TEXT[i.evaluation] || i.evaluation || '-'}`} status={i.status} />
                        ))}
                    </div>
                )}
            </Panel>

            {children}

            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-slate-600">
                <b>How this report is worked out.</b> Every figure is recalculated automatically from the toolbox talks and inspections of the day listed above, so it always matches them. Scores use the exact (unrounded) values. The report is <b>Complete</b> once every toolbox talk and inspection listed is approved; the calculated penalty is shown from the start and is confirmed automatically at that point. Closing an NC / CC case is a separate process and does not affect this report.
            </p>
        </div>
    );
}
