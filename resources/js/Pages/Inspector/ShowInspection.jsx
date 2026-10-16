import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Printer, Trash2, MapPin, CalendarDays, Building2, UserRound, Tag, FolderKanban, Image as ImageIcon, AlertTriangle, MessageSquareWarning, X } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import {
    EVAL, EvalBadge, StatusBadge, SectionCard, InfoRow, Sheet, ActionBar, fmtDate, parsePhotos, storageUrl, darkBtn, ghostBtn,
} from '@/Components/inspector/kit';

export default function ShowInspection({ inspection, user, can_edit = false }) {
    const [expanded, setExpanded] = useState(false);
    const [lightbox, setLightbox] = useState(null);
    const [confirm, setConfirm] = useState(false);

    const ev = EVAL[inspection.evaluation];
    const photos = parsePhotos(inspection.photo).map(storageUrl);
    const desc = inspection.description || '';
    const long = desc.length > 220;
    const topicName = inspection.topic?.name || inspection.topic?.title;

    const statusPill = (status) =>
        status === 'open' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700';

    const report = (data, type) => {
        if (!data) return null;
        const danger = type === 'nc';
        return (
            <SectionCard
                key={type}
                title={danger ? 'Non-Conformance report' : 'Client complaint'}
                icon={danger ? AlertTriangle : MessageSquareWarning}
                tone={danger ? 'danger' : 'default'}
            >
                <div className="grid grid-cols-2 gap-4">
                    <InfoRow label="Status">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${statusPill(data.status)}`}>{data.status}</span>
                    </InfoRow>
                    <InfoRow label="Date opened">{fmtDate(data.date_open)}</InfoRow>
                    {data.date_close && <InfoRow label="Date closed">{fmtDate(data.date_close)}</InfoRow>}
                    {data.comment && (
                        <div className="col-span-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Comment</p>
                            <p className="mt-1 rounded-2xl bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">{data.comment}</p>
                        </div>
                    )}
                </div>
            </SectionCard>
        );
    };

    return (
        <InspectorLayout user={user}>
            <Head title={`Inspection: ${inspection.project?.name || 'Details'}`} />

            {lightbox && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
                    <button className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close">
                        <X className="h-6 w-6" />
                    </button>
                    <img src={lightbox} alt="Inspection" className="max-h-full max-w-full rounded-2xl object-contain" />
                </div>
            )}

            <div className="mx-auto max-w-3xl space-y-4 px-4 pb-32 pt-5 sm:px-6 lg:pb-24">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <span className="absolute inset-y-0 left-0 w-2" style={{ background: ev?.color || '#9ca3af' }} />
                    <div className="pl-2">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Inspection #{inspection.id}</p>
                                <h1 className="mt-1 text-xl font-extrabold leading-tight">{inspection.project?.name || '-'}</h1>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                                <EvalBadge value={inspection.evaluation} className="!border-transparent bg-white" />
                                <StatusBadge value={inspection.status} className="bg-white" />
                            </div>
                        </div>
                        {inspection.status === 'rejected' && inspection.review_comment && (
                            <p className="mt-3 rounded-xl bg-red-500/20 px-3 py-2 text-sm text-red-100">Returned: {inspection.review_comment}</p>
                        )}
                        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-300">
                            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-400" />{fmtDate(inspection.inspection_date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand-400" />{inspection.location || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Details */}
                <SectionCard title="Details" icon={FolderKanban}>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <InfoRow label="Topic">{topicName}</InfoRow>
                        <InfoRow label="Inspectee company">{inspection.subcon_company?.name}</InfoRow>
                        <InfoRow label="Inspected by">{inspection.inspector?.name}</InfoRow>
                        <InfoRow label="Location">{inspection.location}</InfoRow>
                    </div>
                </SectionCard>

                {desc && (
                    <SectionCard title="Notes" icon={Tag}>
                        <p className="whitespace-pre-wrap text-[15px] leading-7 text-gray-700">
                            {expanded || !long ? desc : `${desc.slice(0, 220)}…`}
                        </p>
                        {long && (
                            <button onClick={() => setExpanded(!expanded)} className="mt-2 text-sm font-bold text-brand-800">
                                {expanded ? 'Show less' : 'Read more'}
                            </button>
                        )}
                    </SectionCard>
                )}

                {photos.length > 0 && (
                    <SectionCard title={`Photos (${photos.length})`} icon={ImageIcon}>
                        <div className={`grid gap-3 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                            {photos.map((src, i) => (
                                <button
                                    key={src + i}
                                    onClick={() => setLightbox(src)}
                                    className={`overflow-hidden rounded-2xl bg-gray-100 active:scale-[0.98] transition ${photos.length === 1 ? 'aspect-video' : 'aspect-square'}`}
                                >
                                    <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {inspection.evaluation === 'nonconformance' && report(inspection.non_conformance, 'nc')}
                {inspection.evaluation === 'clientcomplaint' && report(inspection.client_complaint, 'cc')}
            </div>

            <ActionBar>
                {can_edit && (
                    <Link href={`/inspector/inspections/${inspection.id}/edit`} className={darkBtn}>
                        <Pencil className="h-4 w-4" /> Edit
                    </Link>
                )}
                <button onClick={() => window.print()} className={ghostBtn}>
                    <Printer className="h-4 w-4" /> Print
                </button>
                {can_edit && (
                    <button
                        onClick={() => setConfirm(true)}
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 active:scale-95 transition"
                        aria-label="Delete"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                )}
            </ActionBar>

            <Sheet
                open={confirm}
                onClose={() => setConfirm(false)}
                title="Delete this inspection?"
                footer={
                    <div className="flex gap-3">
                        <button onClick={() => setConfirm(false)} className={ghostBtn}>Cancel</button>
                        <button
                            onClick={() => router.delete(`/inspector/inspections/${inspection.id}`)}
                            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white active:scale-95 transition"
                        >
                            Delete
                        </button>
                    </div>
                }
            >
                <p className="py-2 text-sm text-gray-600">This cannot be undone.</p>
            </Sheet>
        </InspectorLayout>
    );
}
