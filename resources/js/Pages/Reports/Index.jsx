import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { SearchX, BookOpen } from 'lucide-react';
import ReportShell from '@/Components/reports/ReportShell';
import ListControls, { Pager } from '@/Components/shared/ListControls';
import { RankMedal, Status, pct, rm } from '@/Components/reports/parts';
import { cardTone } from '@/Components/inspector/kit';

const monthName = (period) => new Date(`${period}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

export default function Index({ portal, tab, rows = [], meta, counts = {}, filters = {}, projects = [], links }) {
    const isReview = portal === 'review';
    const path = isReview ? '/review/reports' : tab === 'monthly' ? '/monthly-reports' : '/daily-reports';
    const tabHref = (t) => (isReview ? `/review/reports?tab=${t}` : t === 'monthly' ? '/monthly-reports' : '/daily-reports');
    const detail = (r) => (isReview ? `/review/reports/${tab}/${r.id}` : `/${tab}-reports/${r.id}`);

    const tabs = [
        ['all', 'All', counts.all],
        ['pending_verification', 'Pending verification', counts.pending_verification],
        ['verified', 'Verified', counts.verified],
        ['approved', 'Approved', counts.approved],
        ['rejected', 'Returned', counts.rejected],
    ];

    return (
        <ReportShell portal={portal} title="Reports" wide>
            <Head title="Reports" />
            <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-900">SPGPNC &amp; BSPR reports</h1>
                        <p className="text-sm text-gray-500">Contractor performance from the inspections, Safety Passport sampling and findings.</p>
                    </div>
                    <Link href={links.learn} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
                        <BookOpen className="h-4 w-4" /> Learn more
                    </Link>
                </div>

                <div className="inline-flex rounded-xl bg-gray-200/70 p-1">
                    {[['daily', 'Daily reports'], ['monthly', 'Monthly reports']].map(([t, label]) => (
                        <Link key={t} href={tabHref(t)} className={`rounded-lg px-5 py-2.5 text-sm font-bold ${tab === t ? 'bg-white text-ink-900 shadow' : 'text-gray-500'}`}>
                            {label}
                        </Link>
                    ))}
                </div>

                <ListControls
                    path={path}
                    filters={{ ...filters, tab }}
                    tabs={tabs}
                    tabKey="status"
                    projects={projects}
                    placeholder="Search project, contractor, report no…"
                    extras={[{ key: 'rank', label: 'BSPR rank', options: [['all', 'Any rank'], ['GOLD', 'Gold'], ['SILVER', 'Silver'], ['BRONZE', 'Bronze']] }]}
                />

                {rows.length === 0 ? (
                    <div className="rounded-3xl bg-white p-10 text-center">
                        <SearchX className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-base font-extrabold text-gray-700">No reports found</p>
                        <p className="mt-1 text-sm text-gray-400">Reports are created from the inspections of each day and month.</p>
                    </div>
                ) : (
                    <>
                    {!isReview && <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[960px] text-left text-sm">
                                <thead className="bg-ink-950 text-xs font-bold uppercase tracking-wider text-brand-400">
                                    <tr>
                                        <th className="w-14 px-5 py-3">#</th>
                                        <th className="px-5 py-3">Report no.</th>
                                        <th className="px-5 py-3">{tab === 'daily' ? 'Date' : 'Month'}</th>
                                        <th className="px-5 py-3">Project</th>
                                        <th className="px-5 py-3">Subcontractor</th>
                                        <th className="px-5 py-3 text-center">SPGPNC</th>
                                        <th className="px-5 py-3 text-center">BSPR</th>
                                        <th className="px-5 py-3 text-right">Penalty</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.map((r, index) => (
                                        <tr key={`${tab}-${r.id}`} onClick={() => router.visit(detail(r))} className="cursor-pointer align-middle transition hover:bg-brand-50/60">
                                            <td className="px-5 py-3.5 text-gray-400">{(meta?.from ?? 1) + index}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-gray-800">{r.report_no}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5 font-bold text-gray-900">{tab === 'daily' ? r.date : monthName(r.period)}</td>
                                            <td className="px-5 py-3.5 font-semibold text-gray-800">{r.project}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{r.subcon}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-center font-extrabold text-ink-900">{r.spgpnc !== null ? pct(r.spgpnc) : <span className="text-gray-300">-</span>}</td>
                                            <td className="px-5 py-3.5"><div className="flex justify-center">{r.rank ? <RankMedal rank={r.rank} size="xs" /> : <span className="font-extrabold text-gray-300">-</span>}</div></td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-right font-extrabold text-gray-900">{rm(r.penalty.total)}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5"><Status value={r.status} /></td>
                                            <td className="px-5 py-3.5 text-right"><Link href={detail(r)} onClick={(event) => event.stopPropagation()} className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-900 hover:border-brand-400">View</Link></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>}
                    <div className={`grid gap-3 ${isReview ? 'lg:grid-cols-2' : 'md:hidden'}`}>
                        {rows.map((r) => {
                            const tone = cardTone(r.status);
                            return (
                                <Link key={`${tab}-${r.id}`} href={detail(r)} className={`block rounded-2xl border p-4 shadow-sm transition active:scale-[0.99] ${tone.card}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{r.report_no}</p>
                                            <p className="truncate text-[15px] font-extrabold text-gray-900">{tab === 'daily' ? r.date : monthName(r.period)}</p>
                                            <p className="truncate text-sm text-gray-600">{r.project}</p>
                                            <p className="truncate text-xs text-gray-500">{r.subcon}</p>
                                        </div>
                                        <Status value={r.status} className="shrink-0" />
                                    </div>
                                    <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                                        <div>
                                            <p className="text-lg font-extrabold text-ink-900">{r.spgpnc !== null ? pct(r.spgpnc) : '-'}</p>
                                            <p className="text-[11px] text-gray-500">SPGPNC</p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center">
                                            {r.rank ? <RankMedal rank={r.rank} size="sm" /> : <span className="text-lg font-extrabold text-gray-300">-</span>}
                                            <p className="text-[11px] text-gray-500">BSPR</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-extrabold text-gray-900">{rm(r.penalty.total)}</p>
                                            <p className="text-[11px] text-gray-500">Penalty</p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                    </>
                )}

                <Pager meta={meta} path={path} filters={{ ...filters, tab }} />
            </div>
        </ReportShell>
    );
}
