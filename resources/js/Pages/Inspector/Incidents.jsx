// Incidents on the inspector's projects. Same card as the review portal; its button opens the detail page.
import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { EmptyState } from '@/Components/inspector/kit';
import { IncidentCard } from '@/Pages/Review/Incidents';

const PER_PAGE = 8;

// the status of an incident is stored as open / in progress / closed
const normStatus = (s) => {
    const v = (s || 'open').toLowerCase().replace(/\s+/g, '');
    return v === 'inprogress' ? 'inprogress' : v === 'closed' ? 'closed' : 'open';
};

export default function Incidents({ incidents = [], projects = [], user }) {
    const [projectId, setProjectId] = useState('all');
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    // only one card is open at a time
    const [openId, setOpenId] = useState(null);

    const needle = q.trim().toLowerCase();
    const list = useMemo(() => incidents
        .filter((i) => projectId === 'all' || String(i.project_id) === String(projectId))
        .filter((i) => !needle || [i.series_code, i.type, i.project, i.subcon, i.location, i.reported_by, i.description, i.date]
            .filter(Boolean).join(' ').toLowerCase().includes(needle)),
    [incidents, projectId, needle]);

    const lastPage = Math.max(1, Math.ceil(list.length / PER_PAGE));
    const current = Math.min(page, lastPage);
    const shown = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);
    const change = (setter) => (value) => { setter(value); setPage(1); };

    return (
        <InspectorLayout user={user}>
            <Head title="Incidents" />
            <div className="mx-auto max-w-2xl space-y-4 px-4 pb-24 pt-5 sm:px-6">
                <div className="flex items-center gap-3">
                    <select
                        value={projectId}
                        onChange={(e) => change(setProjectId)(e.target.value)}
                        className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold"
                    >
                        <option value="all">All my projects ({incidents.length})</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <Link href="/inspector/incidents/create" className="sb-create shrink-0">
                        <Plus className="h-4 w-4" strokeWidth={3} /> Report
                    </Link>
                </div>

                <label className="relative block">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => change(setQ)(e.target.value)}
                        placeholder="Search code, type, project, location, person…"
                        className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm"
                    />
                    {q && (
                        <button type="button" onClick={() => change(setQ)('')} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </label>

                {list.length === 0 ? (
                    <EmptyState title="No incidents" hint={needle ? 'No incident matches your search.' : 'No incident has been reported for your projects.'} />
                ) : (
                    shown.map((i) => (
                        <IncidentCard
                            key={i.id}
                            incident={{ ...i, status: normStatus(i.status), involved_count: i.involved?.length || 0 }}
                            detailHref={`/inspector/incidents/${i.id}`}
                            open={openId === i.id}
                            onToggle={() => setOpenId((k) => (k === i.id ? null : i.id))}
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
