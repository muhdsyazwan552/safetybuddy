import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import VisitCard from '@/Components/shared/VisitCard';
import { EmptyState, REVIEW_STATUS } from '@/Components/inspector/kit';

export default function Visits({ visits = [], me = null, user }) {
    const [status, setStatus] = useState('all');
    const [owner, setOwner] = useState('all'); // all | mine
    // only one card is open at a time, like in the review portal
    const [openKey, setOpenKey] = useState(null);
    const tabs = [['all', 'All'], ...Object.entries(REVIEW_STATUS).map(([k, v]) => [k, v.label])];
    const mine = (v) => me !== null && Number(v.by_id) === Number(me);

    // search + project filter + paging, all on the page (the list is already loaded)
    const [q, setQ] = useState('');
    const [project, setProject] = useState('all');
    const [page, setPage] = useState(1);
    const projects = [...new Set(visits.map((v) => v.project).filter(Boolean))].sort();
    const haystack = (v) => [
        v.project, v.by, v.date, v.talk?.series_code,
        ...(v.inspections || []).flatMap((i) => [i.series_code, i.topic, i.subcon, i.location, i.description]),
    ].filter(Boolean).join(' ').toLowerCase();
    const needle = q.trim().toLowerCase();

    const list = visits
        .filter((v) => owner === 'all' || mine(v))
        .filter((v) => status === 'all' || v.status === status)
        .filter((v) => project === 'all' || v.project === project)
        .filter((v) => !needle || haystack(v).includes(needle));

    const PER_PAGE = 8;
    const lastPage = Math.max(1, Math.ceil(list.length / PER_PAGE));
    const current = Math.min(page, lastPage);
    const shown = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);
    const filtered = needle !== '' || project !== 'all';
    // any change of the filters goes back to page 1
    const change = (setter) => (value) => { setter(value); setPage(1); };
    return (
        <InspectorLayout user={user}>
            <Head title="Toolbox talk & Inspection" />
            <div className="mx-auto max-w-2xl space-y-4 px-4 pb-24 pt-5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="-mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4">
                        {tabs.map(([k, label]) => (
                            <button key={k} onClick={() => change(setStatus)(k)} className={`shrink-0 rounded-full border-2 px-4 py-1.5 text-xs font-bold ${status === k ? 'border-ink-900 bg-ink-900 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <Link href="/inspector/visits/create" className="sb-create shrink-0">
                        <Plus className="h-4 w-4" strokeWidth={3} /> New
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-200/70 p-1 text-sm font-bold">
                    {[['all', `All visits (${visits.length})`], ['mine', `My visits (${visits.filter(mine).length})`]].map(([k, label]) => (
                        <button key={k} onClick={() => change(setOwner)(k)} className={`rounded-xl py-2 transition ${owner === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{label}</button>
                    ))}
                </div>

                <div className="space-y-2">
                    <label className="relative block">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            value={q}
                            onChange={(e) => change(setQ)(e.target.value)}
                            placeholder="Search project, code, topic, subcontractor, location…"
                            className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm"
                        />
                        {q && (
                            <button type="button" onClick={() => change(setQ)('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </label>
                    <select value={project} onChange={(e) => change(setProject)(e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700">
                        <option value="all">All projects</option>
                        {projects.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {filtered && (
                        <p className="flex items-center justify-between px-1 text-xs text-gray-500">
                            <span>{list.length} result{list.length === 1 ? '' : 's'}</span>
                            <button type="button" onClick={() => { setQ(''); setProject('all'); setPage(1); }} className="font-bold text-brand-800">Clear filters</button>
                        </p>
                    )}
                </div>

                {list.length === 0 ? (
                    <EmptyState title="No toolbox talk & inspection" hint={owner === 'mine' ? 'Start a new one to record the toolbox talk and its inspections together.' : 'Nothing recorded on your projects yet.'} />
                ) : (
                    shown.map((v) => (
                        <VisitCard
                            key={v.key}
                            visit={v}
                            editable={mine(v)}
                            detailHref={`/inspector/visits/${v.key}`}
                            open={openKey === v.key}
                            onToggle={() => setOpenKey((k) => (k === v.key ? null : v.key))}
                        />
                    ))
                )}

                {lastPage > 1 && (
                    <div className="flex items-center justify-between gap-3 pt-1">
                        <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 disabled:opacity-40">
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </button>
                        <span className="text-xs font-semibold text-gray-500">Page {current} of {lastPage} · {list.length} total</span>
                        <button type="button" disabled={current >= lastPage} onClick={() => setPage(current + 1)} className="inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 disabled:opacity-40">
                            Next <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </InspectorLayout>
    );
}
