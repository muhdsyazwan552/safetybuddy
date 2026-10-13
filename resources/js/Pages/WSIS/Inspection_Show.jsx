import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import axios from 'axios';
import {
    ArrowLeft, Printer, MapPin, CalendarDays, Building2, UserRound, Tag, FolderKanban, Image as ImageIcon,
    AlertTriangle, MessageSquareWarning, CheckCircle2, RotateCcw, Loader2, X, ChevronRight, ClipboardList,
} from 'lucide-react';
import AppLayout from '@/Pages/WSIS/Layout';
import { EVAL, EvalBadge, SectionCard, InfoRow, fmtDate, storageUrl } from '@/Components/inspector/kit';

function StatusPanel({ record, type, reviewer }) {
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const isNc = type === 'nc';
    const open = record.status === 'open';
    const url = `${isNc ? '/non-conformances' : '/client-complaints'}/${record.id}/status`;

    const change = (status) => {
        setBusy(true);
        setError('');
        axios
            .patch(url, { status, comment: comment || null })
            .then(() => {
                setComment('');
                router.reload({ onFinish: () => setBusy(false) });
            })
            .catch((e) => {
                setError(e.response?.data?.message || 'Could not update the status. Please try again.');
                setBusy(false);
            });
    };

    return (
        <SectionCard
            title={isNc ? 'Non-conformance' : 'Client complaint'}
            icon={isNc ? AlertTriangle : MessageSquareWarning}
            tone={open && isNc ? 'danger' : 'default'}
        >
            <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold uppercase ${open ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    {open ? <AlertTriangle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                    {open ? 'Open' : 'Closed'}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
                <InfoRow label="Date opened">{fmtDate(record.date_open)}</InfoRow>
                <InfoRow label="Date closed">{record.date_close ? fmtDate(record.date_close) : '-'}</InfoRow>
                <InfoRow label="Reviewed by">{reviewer}</InfoRow>
            </div>

            {record.comment && (
                <div className="mt-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Latest comment</p>
                    <p className="mt-1 rounded-2xl bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">{record.comment}</p>
                </div>
            )}

            <div className="mt-5 border-t border-gray-100 pt-4">
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    {open ? 'Closing comment (optional)' : 'Reason for reopening (optional)'}
                </label>
                <textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={1000}
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/20"
                    placeholder="Add a note for the record…"
                />
                {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
                <button
                    onClick={() => change(open ? 'closed' : 'open')}
                    disabled={busy}
                    className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-extrabold shadow-md transition active:scale-95 disabled:opacity-50 ${open ? 'bg-emerald-600 text-white' : 'bg-ink-900 text-brand-400'}`}
                >
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : open ? <CheckCircle2 className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                    {open ? 'Close this record' : 'Reopen this record'}
                </button>
            </div>
        </SectionCard>
    );
}

export default function Inspection_Show({ inspection, photos = [], ncReviewer, ccReviewer, related = [] }) {
    const [lightbox, setLightbox] = useState(null);
    const [expanded, setExpanded] = useState(false);

    const ev = EVAL[inspection.evaluation];
    const urls = photos.map(storageUrl);
    const desc = inspection.description || '';
    const long = desc.length > 300;

    return (
        <AppLayout title="Inspection Details">
            <Head title={`Inspection #${inspection.id}`} />

            {lightbox && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
                    <button className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close">
                        <X className="h-6 w-6" />
                    </button>
                    <img src={lightbox} alt="Inspection" className="max-h-full max-w-full rounded-2xl object-contain" />
                </div>
            )}

            <div className="mx-auto max-w-6xl space-y-5 pb-8">
                {/* top bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href="/inspection" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white"><ArrowLeft className="h-4 w-4" /></span>
                        Back to inspections
                    </Link>
                    <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 active:scale-95 transition">
                        <Printer className="h-4 w-4" /> Print
                    </button>
                </div>

                {/* hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg sm:p-7">
                    <span className="absolute inset-y-0 left-0 w-2" style={{ background: ev?.color || '#9ca3af' }} />
                    <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-500/20 blur-2xl" />
                    <div className="relative flex flex-col gap-4 pl-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Inspection #{inspection.id}</p>
                            <h1 className="mt-1 text-2xl font-extrabold leading-tight">{inspection.project?.name || '-'}</h1>
                            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
                                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-400" />{fmtDate(inspection.inspection_date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand-400" />{inspection.location || '-'}</span>
                                <span className="flex items-center gap-1.5"><Tag className="h-4 w-4 text-brand-400" />{inspection.topic?.name || '-'}</span>
                            </div>
                        </div>
                        <EvalBadge value={inspection.evaluation} className="shrink-0 self-start !border-transparent bg-white !px-4 !py-2 !text-xs" />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* main column */}
                    <div className="space-y-5 lg:col-span-2">
                        <SectionCard title="Inspection details" icon={FolderKanban}>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <InfoRow label="Project">{inspection.project?.name}</InfoRow>
                                <InfoRow label="Topic">{inspection.topic?.name}</InfoRow>
                                <InfoRow label="Inspectee company">
                                    <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4 text-gray-400" />{inspection.subcon_company?.name}</span>
                                </InfoRow>
                                <InfoRow label="Inspected by">
                                    <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4 text-gray-400" />{inspection.inspector?.name}</span>
                                </InfoRow>
                                <InfoRow label="Location">{inspection.location}</InfoRow>
                                <InfoRow label="Date">{fmtDate(inspection.inspection_date, { day: 'numeric', month: 'long', year: 'numeric' })}</InfoRow>
                            </div>
                        </SectionCard>

                        {desc && (
                            <SectionCard title="Notes / observations" icon={ClipboardList}>
                                <p className="whitespace-pre-wrap text-[15px] leading-7 text-gray-700">
                                    {expanded || !long ? desc : `${desc.slice(0, 300)}…`}
                                </p>
                                {long && (
                                    <button onClick={() => setExpanded(!expanded)} className="mt-2 text-sm font-bold text-brand-800">
                                        {expanded ? 'Show less' : 'Read more'}
                                    </button>
                                )}
                            </SectionCard>
                        )}

                        {urls.length > 0 && (
                            <SectionCard title={`Photos (${urls.length})`} icon={ImageIcon}>
                                <div className={`grid gap-3 ${urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'}`}>
                                    {urls.map((src, i) => (
                                        <button
                                            key={src + i}
                                            onClick={() => setLightbox(src)}
                                            className={`overflow-hidden rounded-2xl bg-gray-100 transition hover:opacity-90 ${urls.length === 1 ? 'aspect-video' : 'aspect-square'}`}
                                        >
                                            <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </SectionCard>
                        )}
                    </div>

                    {/* side column */}
                    <div className="space-y-5">
                        {inspection.non_conformance && <StatusPanel record={inspection.non_conformance} type="nc" reviewer={ncReviewer} />}
                        {inspection.client_complaint && <StatusPanel record={inspection.client_complaint} type="cc" reviewer={ccReviewer} />}

                        {!inspection.non_conformance && !inspection.client_complaint && (
                            <SectionCard title="Follow-up" icon={CheckCircle2}>
                                <p className="text-sm text-gray-500">No non-conformance or client complaint is linked to this inspection.</p>
                            </SectionCard>
                        )}

                        <SectionCard title="Related inspections" icon={ClipboardList}>
                            {related.length === 0 ? (
                                <p className="text-sm text-gray-400">No other inspections for this project and company.</p>
                            ) : (
                                <ul className="-mx-5 -mb-5 divide-y divide-gray-100">
                                    {related.map((r) => (
                                        <li key={r.id}>
                                            <Link href={`/inspections/${r.id}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-gray-50">
                                                <span className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: EVAL[r.evaluation]?.color || '#9ca3af' }} />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-semibold text-gray-900">{r.topic}</span>
                                                    <span className="block text-xs text-gray-500">{fmtDate(r.inspection_date)}</span>
                                                </span>
                                                <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </SectionCard>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
