import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import ReportShell from '@/Components/reports/ReportShell';
import { Panel, RankStrip, rm } from '@/Components/reports/parts';

const t = (v) => String(Number(v));

export default function LearnMore({ portal, settings: s, links }) {
    const back = portal === 'review' ? '/review/reports' : '/daily-reports';
    const rows = [
        ['SP', 'Compliant sampled workers ÷ total sampled workers × 100', `Minimum ${t(s.sp_benchmark)}%`, `${rm(s.sp_penalty)} when below benchmark`],
        ['G', 'GOOD findings ÷ total findings × 100', `Minimum ${t(s.g_benchmark)}%`, `${rm(s.g_penalty)} when below benchmark`],
        ['P', '100 − (POOR findings ÷ total findings × 100)', `Minimum ${t(s.p_benchmark)}%`, `${rm(s.p_penalty)} when below benchmark`],
        ['N', '100 − (NC findings ÷ total findings × 100)', 'No benchmark required', `${rm(s.nc_penalty)} per NC`],
        ['C', '100 − (CC findings ÷ total findings × 100)', 'No benchmark required', `${rm(s.cc_penalty)} per CC`],
        ['SPGPNC', '(SP + G + P + N + C) ÷ 5', 'Automatically calculated', 'Not applicable'],
    ];

    return (
        <ReportShell portal={portal} title="Learn more">
            <Head title="SPGPNC & BSPR" />
            <Link href={back} className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-gray-500"><ArrowLeft className="h-4 w-4" /> Back to reports</Link>

            <div className="space-y-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-ink-900">SPGPNC &amp; BSPR Performance</h1>
                    <p className="text-sm font-semibold text-brand-800">Configured benchmarks, penalties and ranking criteria</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm leading-6 text-slate-700 shadow-sm">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-brand-800">Safety Metrics &ndash; Objective</p>
                    <p className="mt-1.5">
                        Enable Safety Metrics to measure your company&apos;s safety compliance performance based on inspection results. You can use the default
                        settings or customise them to suit your company&apos;s requirements. If disabled, inspections can still be conducted, but SPGPNC scores,
                        penalties, and BSPR ratings will not be generated.
                    </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-full text-left text-sm">
                        <thead className="bg-ink-900 text-white">
                            <tr><th className="px-4 py-2.5">Metric</th><th className="px-4 py-2.5">Measurement</th><th className="px-4 py-2.5">Benchmark</th><th className="px-4 py-2.5">Penalty setting</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map(([k, m, b, p]) => (
                                <tr key={k}><td className="bg-amber-50 px-4 py-2.5 font-extrabold">{k}</td><td className="px-4 py-2.5">{m}</td><td className="px-4 py-2.5">{b}</td><td className="px-4 py-2.5">{p}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Panel title="BSPR • based on the SPGPNC score"><RankStrip settings={s} /></Panel>

                <div className="rounded-xl border border-gray-200 bg-amber-50 p-5 text-sm leading-6 text-slate-700">
                    <p>
                        The <b>SPGPNC</b> and <b>BSPR</b> functions are <b>optional</b> performance management tools to measure, monitor and benchmark
                        contractor safety performance. The performance targets, consequence values (RM) and ranking criteria are configured by your company.
                    </p>
                    <p className="mt-3">
                        SPGPNC evaluates contractor performance using five metrics: Safety Passport compliance (SP), Good (G), Poor (P),
                        Non-conformance (N) and Client complaint (C), each standardised to 0–100%. The score is their average and classifies the contractor as
                        GOLD, SILVER or BRONZE (Contractor Best Safety Practices Rank).
                    </p>
                    <p className="mt-3">
                        <b>Complete assessments are required</b> for the overall score and rank. SP, G and P penalties apply once per inspection when below
                        benchmark; NC and CC penalties apply per finding. Calculated penalties are subject to Manager review. An approved report keeps the
                        settings it was created with.
                    </p>
                </div>
            </div>
        </ReportShell>
    );
}
