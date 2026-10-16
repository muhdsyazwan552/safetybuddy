import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, MapPin, Building2, UserRound, Users, SearchX, Siren } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import ListControls, { Pager } from '@/Components/shared/ListControls';

export const INCIDENT_TONE = {
    open: { card: 'bg-rose-50 border-rose-200', line: 'border-rose-200', badge: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Open' },
    inprogress: { card: 'bg-amber-50 border-amber-200', line: 'border-amber-200', badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'In progress' },
    closed: { card: 'bg-emerald-50 border-emerald-200', line: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Closed' },
};
export const incidentTone = (s) => INCIDENT_TONE[s] || INCIDENT_TONE.open;

const monthLabel = (day) => (day ? new Date(`${day.slice(0, 7)}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'No date');

export default function Incidents({ incidents = [], meta, counts = {}, filters = {}, projects = [], types = [] }) {
    const tabs = [
        ['all', 'All', counts.all],
        ['open', 'Open', counts.open],
        ['inprogress', 'In progress', counts.inprogress],
        ['closed', 'Closed', counts.closed],
    ];
    let lastMonth = null;

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
                        const tone = incidentTone(i.status);

                        return (
                            <React.Fragment key={i.id}>
                                {heading && <h2 className="pt-2 text-xs font-extrabold uppercase tracking-widest text-gray-500">{m}</h2>}
                                <Link href={`/review/incidents/${i.id}`} className={`block overflow-hidden rounded-3xl border p-4 shadow-sm active:scale-[0.99] transition ${tone.card}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-rose-600"><Siren className="h-5 w-5" /></span>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Incident #{i.id}</p>
                                                <p className="truncate text-[15px] font-bold text-gray-900">{i.type || 'Incident'}</p>
                                                <p className="truncate text-xs text-gray-500">{i.project}</p>
                                            </div>
                                        </div>
                                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${tone.badge}`}>{tone.label}</span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-600">
                                        <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{i.date}</span>
                                        <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{i.location || '-'}</span>
                                        {i.subcon && <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" />{i.subcon}</span>}
                                        <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4" />{i.reported_by || '-'}</span>
                                        {i.involved_count > 0 && <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{i.involved_count} involved</span>}
                                    </div>
                                    {i.description && <p className="mt-3 line-clamp-2 text-sm text-gray-700">{i.description}</p>}
                                </Link>
                            </React.Fragment>
                        );
                    })
                )}

                <Pager meta={meta} path="/review/incidents" filters={filters} />
            </div>
        </ReviewLayout>
    );
}
