import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, MapPin, CalendarDays, ClipboardCheck, HardHat, AlertTriangle, Building2, ChevronRight } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import { fmtDate } from '@/Components/inspector/kit';
import { statusMeta, timelineProgress } from '@/Components/inspector/projectUtils';

export default function Projects({ projects = [], statusCounts = {}, filters = {} }) {
    const [q, setQ] = useState(filters.q || '');

    const go = (params) => router.get('/review/projects', Object.fromEntries(Object.entries(params).filter(([, v]) => v)), { preserveState: true, preserveScroll: true });
    const totalAll = Object.values(statusCounts).reduce((a, b) => a + Number(b), 0);

    return (
        <ReviewLayout title="Projects">
            <Head title="Projects" />

            <div className="mx-auto max-w-6xl space-y-4 px-4 pb-10 pt-5 sm:px-6">
                <div>
                    <h1 className="text-xl font-extrabold text-gray-900">Projects</h1>
                    <p className="text-sm text-gray-500">{totalAll} project{totalAll === 1 ? '' : 's'} in your company</p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); go({ q, status: filters.status }); }} className="relative">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search project or location..."
                        className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-base shadow-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20"
                    />
                </form>

                {totalAll > 0 && (
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sb-scroll sm:mx-0 sm:px-0">
                        <Chip active={!filters.status} onClick={() => go({ q })}>All · {totalAll}</Chip>
                        {Object.entries(statusCounts).map(([status, n]) => (
                            <Chip key={status} active={filters.status === status} onClick={() => go({ q, status: filters.status === status ? '' : status })}>
                                {statusMeta(status).label} · {n}
                            </Chip>
                        ))}
                    </div>
                )}

                {projects.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">No project found.</div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {projects.map((p) => {
                            const st = statusMeta(p.status);
                            const prog = timelineProgress(p.start_date, p.end_date);
                            return (
                                <Link
                                    key={p.id}
                                    href={`/review/projects/${p.id}`}
                                    className="block min-w-0 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.985]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-base font-extrabold text-gray-900">{p.name}</p>
                                            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-500">
                                                <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{p.location || '-'}</span>
                                            </p>
                                        </div>
                                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${st.cls}`}>{st.label}</span>
                                    </div>

                                    {prog !== null && (
                                        <div className="mt-3">
                                            <div className="mb-1 flex justify-between gap-2 text-[11px] text-gray-500">
                                                <span className="flex min-w-0 items-center gap-1 truncate">
                                                    <CalendarDays className="h-3 w-3 shrink-0" />
                                                    {fmtDate(p.start_date, { day: '2-digit', month: 'short' })} – {fmtDate(p.end_date, { day: '2-digit', month: 'short', year: '2-digit' })}
                                                </span>
                                                <span className="font-bold text-gray-700">{prog}%</span>
                                            </div>
                                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                                                <div className="h-full rounded-full bg-brand-500" style={{ width: `${prog}%` }} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 grid grid-cols-4 gap-1 border-t border-gray-100 pt-3 text-center">
                                        <Mini icon={ClipboardCheck} label="Inspect." value={p.inspections} />
                                        <Mini icon={HardHat} label="Talks" value={p.talks} />
                                        <Mini icon={Building2} label="Subcons" value={p.subcons} />
                                        <Mini icon={AlertTriangle} label="Open NC/CC" value={p.open_cases} danger={p.open_cases > 0} />
                                    </div>

                                    <div className="mt-3 flex items-center justify-end text-xs font-bold text-brand-800">
                                        View details <ChevronRight className="h-4 w-4" />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </ReviewLayout>
    );
}

function Chip({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold ${active ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-600'}`}
        >
            {children}
        </button>
    );
}

function Mini({ icon: Icon, label, value, danger = false }) {
    return (
        <div className="min-w-0">
            <p className={`flex items-center justify-center gap-1 text-lg font-extrabold ${danger ? 'text-red-600' : 'text-gray-900'}`}>
                <Icon className={`h-4 w-4 shrink-0 ${danger ? 'text-red-500' : 'text-gray-400'}`} />{value}
            </p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        </div>
    );
}
