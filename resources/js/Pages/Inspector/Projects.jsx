// resources/js/Pages/Inspector/Projects.jsx
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, MapPin, CalendarDays, ClipboardCheck, HardHat, AlertTriangle, ChevronRight, UserRound } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { ListHeader, EmptyState, Pager, fmtDate } from '@/Components/inspector/kit';
import { statusMeta, timelineProgress } from '@/Components/inspector/projectUtils';

export default function Projects({ projects, statusCounts = {}, filters = {}, user }) {
    const [search, setSearch] = useState(filters.search || '');
    const rows = projects?.data || [];

    const go = (params) => router.get('/inspector/projects', params, { preserveState: true, preserveScroll: true });
    const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v));
    const submitSearch = (e) => { e.preventDefault(); go(clean({ ...filters, search })); };
    const setStatus = (status) => go(clean({ ...filters, status: filters.status === status ? '' : status, search }));

    const totalAll = Object.values(statusCounts).reduce((a, b) => a + Number(b), 0);

    return (
        <InspectorLayout user={user}>
            <Head title="Projects" />

            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <ListHeader title="My projects" subtitle="Sites assigned to you" count={projects?.total} />

                <form onSubmit={submitSearch} className="relative mb-3">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search project name…"
                        className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-base shadow-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20"
                    />
                </form>

                {Object.keys(statusCounts).length > 0 && (
                    <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sb-scroll sm:mx-0 sm:px-0">
                        <button
                            onClick={() => go(clean({ search }))}
                            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold ${!filters.status ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-600'}`}
                        >
                            All · {totalAll}
                        </button>
                        {Object.entries(statusCounts).map(([status, n]) => (
                            <button
                                key={status}
                                onClick={() => setStatus(status)}
                                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold ${filters.status === status ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-600'}`}
                            >
                                {statusMeta(status).label} · {n}
                            </button>
                        ))}
                    </div>
                )}

                {rows.length === 0 ? (
                    <EmptyState title="No projects found" hint="Projects assigned to you will appear here." />
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {rows.map((p) => {
                                const st = statusMeta(p.status);
                                const prog = timelineProgress(p.start_date, p.end_date);
                                return (
                                    <Link
                                        key={p.id}
                                        href={`/inspector/projects/${p.id}`}
                                        className="block rounded-3xl border border-gray-200 bg-white p-4 shadow-md shadow-gray-200/60 transition hover:shadow-md active:scale-[0.985]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-base font-extrabold text-gray-900">{p.name}</p>
                                                <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-500">
                                                    <MapPin className="h-3.5 w-3.5 shrink-0" /> {p.location || '-'}
                                                </p>
                                            </div>
                                            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${st.cls}`}>{st.label}</span>
                                        </div>

                                        {p.my_role && (
                                            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-100 px-2.5 py-1 text-[11px] font-bold text-brand-900">
                                                <UserRound className="h-3.5 w-3.5" /> {p.my_role}
                                            </p>
                                        )}

                                        {prog !== null && (
                                            <div className="mt-3">
                                                <div className="mb-1 flex justify-between text-[11px] text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDays className="h-3 w-3" />
                                                        {fmtDate(p.start_date, { day: '2-digit', month: 'short' })} – {fmtDate(p.end_date, { day: '2-digit', month: 'short', year: '2-digit' })}
                                                    </span>
                                                    <span className="font-bold text-gray-700">{prog}%</span>
                                                </div>
                                                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${prog}%` }} />
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center">
                                            <div>
                                                <p className="flex items-center justify-center gap-1 text-lg font-extrabold text-gray-900">
                                                    <ClipboardCheck className="h-4 w-4 text-gray-400" />{p.inspections_count}
                                                </p>
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Inspections</p>
                                            </div>
                                            <div>
                                                <p className="flex items-center justify-center gap-1 text-lg font-extrabold text-gray-900">
                                                    <HardHat className="h-4 w-4 text-gray-400" />{p.toolbox_talks_count}
                                                </p>
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Talks</p>
                                            </div>
                                            <div>
                                                <p className={`flex items-center justify-center gap-1 text-lg font-extrabold ${p.open_issue_count ? 'text-red-600' : 'text-gray-900'}`}>
                                                    <AlertTriangle className={`h-4 w-4 ${p.open_issue_count ? 'text-red-500' : 'text-gray-400'}`} />{p.open_issue_count}
                                                </p>
                                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Issues</p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-end text-xs font-bold text-brand-800">
                                            View details <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                        <Pager data={projects} />
                    </>
                )}
            </div>
        </InspectorLayout>
    );
}
