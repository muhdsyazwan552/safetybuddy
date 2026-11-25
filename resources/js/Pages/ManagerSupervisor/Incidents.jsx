import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChevronDown, ChevronRight, SearchX, Siren } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import ListControls, { Pager } from '@/Components/shared/ListControls';

export const INCIDENT_TONE = {
    open: { card: 'relative bg-white transition hover:-translate-y-0.5 hover:shadow-xl border-rose-200 shadow-lg shadow-rose-100/80 bg-gradient-to-bl from-rose-50 via-white to-white before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-gradient-to-r before:from-rose-500 before:to-rose-200', line: 'border-gray-100', badge: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Submitted' },
    inprogress: { card: 'relative bg-white transition hover:-translate-y-0.5 hover:shadow-xl border-amber-200 shadow-lg shadow-amber-100/80 bg-gradient-to-bl from-amber-50 via-white to-white before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-gradient-to-r before:from-amber-400 before:to-amber-200', line: 'border-gray-100', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Reviewed' },
    closed: { card: 'relative bg-white transition hover:-translate-y-0.5 hover:shadow-xl border-emerald-200 shadow-lg shadow-emerald-100/80 bg-gradient-to-bl from-emerald-50 via-white to-white before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-gradient-to-r before:from-emerald-500 before:to-emerald-200', line: 'border-gray-100', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Approved' },
};export const incidentTone = (s) => INCIDENT_TONE[s] || INCIDENT_TONE.open;

const monthLabel = (day) => (day ? new Date(`${day.slice(0, 7)}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'No date');

// label : value rows with the values lined up in one column
export function Row({ label, children }) {
    return (
        <>
            <dt className="text-gray-500">{label} :</dt>
            <dd className="min-w-0 break-words font-semibold text-gray-700">{children}</dd>
        </>
    );
}

const statusColor = (badge) => (badge || '').split(' ').find((c) => c.startsWith('text-')) || 'text-gray-600';

// Same look as the NC / CC card: short summary that opens on tap, then the details and a button to the full page.
// detailHref: link of the full page (none for the inspector); children: extra content shown in the opened card
export function IncidentCard({ incident: i, open, onToggle, detailHref = null, children }) {
    const tone = incidentTone(i.status);

    return (
        <div className={`overflow-hidden rounded-3xl border shadow-sm ${tone.card}`}>
            <button type="button" onClick={onToggle} aria-expanded={open} className="block w-full p-5 text-left">
                <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600"><Siren className="h-5 w-5" /></span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Incident</p>
                        <p className="font-mono text-[11px] font-bold tracking-wide text-brand-800">{i.series_code}</p>
                        <p className="mt-0.5 truncate text-[15px] font-bold text-gray-900">{i.type || 'Incident'}</p>
                    </div>
                </div>

                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 text-xs">
                    <Row label="Date">{i.date}</Row>
                    <Row label="Project">{i.project || '-'}</Row>
                    {i.subcon && <Row label="Subcontractor">{i.subcon}</Row>}
                    <Row label="Status"><span className={`font-extrabold uppercase tracking-wide ${statusColor(tone.badge)}`}>{tone.label}</span></Row>
                </dl>

                <ChevronDown className={`mx-auto mt-3 h-5 w-5 text-gray-300 transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    <div className={`space-y-3 border-t p-5 text-xs ${tone.line}`}>
                        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5">
                            <Row label="Location">{i.location || '-'}</Row>
                            {i.injury && <Row label="Injury">{i.injury}</Row>}
                            {i.body_part && <Row label="Body part">{i.body_part}</Row>}
                            <Row label="Reported by">{i.reported_by || '-'}</Row>
                            {i.responsible && <Row label="Responsible">{i.responsible}</Row>}
                            {i.involved_count > 0 && <Row label="People involved">{i.involved_count}</Row>}
                            {i.description && <Row label="Description"><span className="whitespace-pre-wrap font-normal text-gray-700">{i.description}</span></Row>}
                        </dl>
                        {children}
                    </div>

                    {detailHref && <div className={`border-t p-4 ${tone.line} bg-gray-50/70`}>
                        <Link href={detailHref} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 py-3 text-sm font-bold text-brand-400 shadow-sm transition hover:bg-ink-800 sm:ml-auto sm:w-auto sm:min-w-[260px]">
                            View full details <ChevronRight className="h-4 w-4" />
                        </Link>
                    </div>}
                </>
            )}
        </div>
    );
}
export default function Incidents({ incidents = [], meta, counts = {}, filters = {}, projects = [], types = [] }) {
    const tabs = [
        ['all', 'All', counts.all],
        ['open', 'Submitted', counts.open],
        ['inprogress', 'Reviewed', counts.inprogress],
        ['closed', 'Approved', counts.closed],
    ];
    let lastMonth = null;
    // only one card is open at a time
    const [openId, setOpenId] = useState(null);

    return (
        <ReviewLayout title="Incidents">
            <Head title="Incidents" />
            <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10 pt-5">
                <div>
                    <h1 className="text-lg font-extrabold text-gray-900">Reported accidents &amp; incidents</h1>
                    <p className="text-sm text-gray-500">Every incident reported on the company's projects.</p>
                </div>

                <ListControls
                    path="/review/incidents"
                    filters={filters}
                    tabs={tabs}
                    tabKey="status"
                    projects={projects}
                    placeholder="Search project, type, location, person, #id…"
                    extras={[{ key: 'type', label: 'Incident type', options: [['all', 'All types'], ...types.map((t) => [String(t.id), t.name])] }]}
                />

                {incidents.length === 0 ? (
                    <div className="rounded-3xl bg-white p-10 text-center">
                        <SearchX className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-base font-extrabold text-gray-700">No incidents found</p>
                        <p className="mt-1 text-sm text-gray-400">Try another word, period or clear the filters.</p>
                    </div>
                ) : (
                    incidents.map((i) => {
                        const m = monthLabel(i.day);
                        const heading = m !== lastMonth;
                        lastMonth = m;
                        return (
                            <React.Fragment key={i.id}>
                                {heading && <h2 className="pt-2 text-xs font-extrabold uppercase tracking-widest text-gray-500">{m}</h2>}
                                <IncidentCard incident={i} detailHref={`/review/incidents/${i.id}`} open={openId === i.id} onToggle={() => setOpenId((k) => (k === i.id ? null : i.id))} />
                            </React.Fragment>
                        );
                    })
                )}

                <Pager meta={meta} path="/review/incidents" filters={filters} />
            </div>
        </ReviewLayout>
    );
}
