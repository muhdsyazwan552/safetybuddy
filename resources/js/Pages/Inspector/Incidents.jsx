import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Plus, MapPin, CalendarDays, Building2, UserRound, ChevronDown, Users } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { EmptyState } from '@/Components/inspector/kit';

const STATUS = {
    open: 'bg-amber-50 text-amber-700 border-amber-200',
    'in progress': 'bg-blue-50 text-blue-700 border-blue-200',
    inprogress: 'bg-blue-50 text-blue-700 border-blue-200',
    closed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function Row({ label, children }) {
    if (!children) return null;
    return (
        <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-gray-800">{children}</p>
        </div>
    );
}

function IncidentCard({ item }) {
    const [open, setOpen] = useState(false);
    const status = (item.status || 'open').toLowerCase();

    return (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <button type="button" onClick={() => setOpen((o) => !o)} className="w-full p-4 text-left">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Incident #{item.id}</p>
                        <p className="truncate text-[15px] font-bold text-gray-900">{item.type || 'Incident'}</p>
                        <p className="truncate text-xs text-gray-500">{item.project}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {item.status || 'open'}
                        </span>
                        {item.mine && <span className="text-[10px] font-bold text-brand-700">Reported by you</span>}
                    </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{item.date}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{item.location || '-'}</span>
                    {item.subcon && <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" />{item.subcon}</span>}
                    <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4" />{item.reported_by || '-'}</span>
                </div>
                <ChevronDown className={`mx-auto mt-2 h-5 w-5 text-gray-300 transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="space-y-3 border-t border-gray-100 bg-gray-50 p-4">
                    <Row label="Description">{item.description}</Row>
                    <Row label="Responsible person">{item.responsible}</Row>
                    <Row label="Injury / body part">{[item.injury, item.body_part].filter(Boolean).join(' · ')}</Row>
                    <Row label="Immediate cause">{item.immediate_cause}</Row>
                    <Row label="Immediate action">{item.immediate_action}</Row>
                    <Row label="Corrective action">{item.corrective}</Row>
                {item.responses?.length > 0 && (
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Supervisor / Manager responses</p>
                        <ul className="mt-1 space-y-2">
                            {item.responses.map((r) => (
                                <li key={r.id} className={`rounded-xl px-3 py-2 text-sm ${r.type === 'closed' ? 'bg-emerald-50 text-emerald-900' : r.type === 'reopened' ? 'bg-amber-50 text-amber-900' : 'bg-sky-50 text-sky-900'}`}>
                                    <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{r.type === 'closed' ? 'Closed' : r.type === 'reopened' ? 'Reopened' : 'Response'} · {r.by}{r.role ? ` (${r.role})` : ''} · {r.at}</p>
                                    {r.message && <p className="mt-0.5 whitespace-pre-wrap">{r.message}</p>}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                    {item.involved.length > 0 && (
                        <div>
                            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                <Users className="h-3.5 w-3.5" /> Subcontractor staff involved
                            </p>
                            <ul className="mt-1 space-y-0.5 text-sm text-gray-800">
                                {item.involved.map((p) => <li key={p.id}>{p.name}{p.role ? <span className="text-gray-400"> · {p.role}</span> : null}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function Incidents({ incidents = [], projects = [], user }) {
    const [projectId, setProjectId] = useState('all');
    const list = useMemo(
        () => (projectId === 'all' ? incidents : incidents.filter((i) => String(i.project_id) === String(projectId))),
        [incidents, projectId],
    );

    return (
        <InspectorLayout user={user}>
            <Head title="Incidents" />
            <div className="mx-auto max-w-2xl space-y-4 px-4 pb-24 pt-5 sm:px-6">
                <div className="flex items-center gap-3">
                    <select
                        value={projectId}
                        onChange={(e) => setProjectId(e.target.value)}
                        className="min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold"
                    >
                        <option value="all">All my projects ({incidents.length})</option>
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <Link href="/inspector/incidents/create" className="sb-create shrink-0">
                        <Plus className="h-4 w-4" strokeWidth={3} /> Report
                    </Link>
                </div>

                {list.length === 0 ? (
                    <EmptyState title="No incidents" hint="No incident has been reported for your projects." />
                ) : (
                    list.map((i) => <IncidentCard key={i.id} item={i} />)
                )}
            </div>
        </InspectorLayout>
    );
}
