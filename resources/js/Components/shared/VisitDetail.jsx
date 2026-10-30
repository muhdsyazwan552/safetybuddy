// Site visit detail: toolbox talk first, then the inspections. Shared by the admin and the review portal.
import React from 'react';
import SeriesCode from './SeriesCode';
import { Link } from '@inertiajs/react';
import { ArrowLeft, HardHat, ClipboardCheck, Users, ChevronRight } from 'lucide-react';
import { EVAL, REVIEW_STATUS, SectionCard, InfoRow, fmtDate } from '@/Components/inspector/kit';
import ReviewProgress from '@/Components/shared/ReviewProgress';
import HeroMeta, { HeroStatus } from '@/Components/shared/HeroMeta';
import PdfButton from '@/Components/shared/PdfButton';

// Plain coloured text (no badge) so the value stands out; the colour comes from the badge palette in kit.
const textColor = (badge, fallback = 'text-gray-600') => (badge || '').split(' ').find((c) => c.startsWith('text-')) || fallback;

function StatusText({ value }) {
    const s = REVIEW_STATUS[value || 'pending_verification'];
    return <span className={`text-base font-extrabold uppercase tracking-wide ${textColor(s.badge)}`}>{s.label}</span>;
}

function EvalText({ value }) {
    const ev = EVAL[value];
    return <span className={`text-base font-extrabold uppercase tracking-wide ${textColor(ev?.badge)}`}>{ev?.label || value || '-'}</span>;
}

export default function VisitDetail({ visit, backHref, backLabel = 'Back', inspectionHref, toolboxHref, children }) {
    const t = visit.talk;

    return (
        <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
            <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800">
                <ArrowLeft className="h-4 w-4" /> {backLabel}
            </Link>

            {/* hero */}
            <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg sm:p-7">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Toolbox talk &amp; Inspection</p>
                        <h1 className="mt-1 text-2xl font-extrabold leading-tight">{visit.project || '-'}</h1>
                        <HeroMeta rows={[
                            ['Date', fmtDate(visit.date, { day: 'numeric', month: 'long', year: 'numeric' })],
                            ['Inspector', visit.by || '-'],
                            ['Status', <HeroStatus key="s" value={visit.status} />],
                        ]} />
                    </div>
                </div>
            </div>

            <ReviewProgress kind="visit" status={visit.status} />

            {visit.status === 'approved' && /^(talk|insp)-[0-9]+$/.test(visit.key) && (
                <div className="flex justify-end"><PdfButton href={`/pdf/visit/${visit.key}`} label="Full toolbox talk & inspection PDF" /></div>
            )}

            {children}

            {/* 1 · Toolbox talk */}
            <SectionCard title="1 · Toolbox talk" icon={HardHat}>
                {!t ? (
                    <p className="text-sm text-gray-500">No toolbox talk was recorded for this visit.</p>
                ) : (
                    <div className="space-y-5">
                        <div className="flex items-start justify-between gap-3">
                            <SeriesCode code={t.series_code} className="text-xs" />
                            {t.status === 'approved' && t.id && <PdfButton href={`/pdf/toolbox/${t.id}`} />}
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <InfoRow label="Status"><StatusText value={t.status} /></InfoRow>
                            <InfoRow label="Toolbox talk">
                                <span className={`text-base font-extrabold uppercase tracking-wide ${t.conducted ? 'text-emerald-700' : 'text-red-700'}`}>
                                    {t.conducted ? 'Conducted' : 'Not conducted'}
                                </span>
                            </InfoRow>
                            <InfoRow label="Attendees">
                                <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-gray-400" />{t.attended} present</span>
                            </InfoRow>
                            {t.conducted && <InfoRow label="Categories">{t.categories.length ? t.categories.join(', ') : '-'}</InfoRow>}
                        </div>

                        {!t.conducted && t.sp_sampled !== null && (
                            <div className="grid grid-cols-3 gap-3 rounded-2xl bg-gray-50 p-4 text-center">
                                <div><p className="text-xl font-extrabold text-gray-900">{t.sp_sampled}</p><p className="text-xs text-gray-500">Sampled</p></div>
                                <div><p className="text-xl font-extrabold text-gray-900">{t.sp_not_registered}</p><p className="text-xs text-gray-500">Not registered</p></div>
                                <div><p className={`text-xl font-extrabold ${t.sp_compliance >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>{t.sp_compliance ?? '-'}%</p><p className="text-xs text-gray-500">SP compliance</p></div>
                            </div>
                        )}

                        {t.attendees?.length > 0 && (
                            <div>
                                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Attendee names</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {t.attendees.map((n) => <span key={n} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{n}</span>)}
                                </div>
                            </div>
                        )}

                        {(t.img_group || t.img_attendance) && (
                            <div className="grid grid-cols-2 gap-3">
                                {[['Group photo', t.img_group], ['Attendance sheet', t.img_attendance]].map(([label, src]) => src && (
                                    <a key={label} href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-gray-200">
                                        <img src={src} alt={label} className="aspect-video w-full object-cover" />
                                        <p className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">{label}</p>
                                    </a>
                                ))}
                            </div>
                        )}

                        {t.review_comment && t.status === 'rejected' && (
                            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Returned: {t.review_comment}</p>
                        )}

                        {toolboxHref && t.id && (
                            <div className="border-t border-gray-100 pt-4">
                                <Link href={toolboxHref(t)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 py-3 text-sm font-bold text-brand-400 shadow-sm transition hover:bg-ink-800 sm:ml-auto sm:w-auto sm:min-w-[260px]">
                                    View toolbox talk detail <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </SectionCard>

            {/* 2 · Inspections */}
            <SectionCard title={`2 · Inspections (${visit.inspections.length})`} icon={ClipboardCheck}>
                {visit.inspections.length === 0 ? (
                    <p className="text-sm text-gray-500">No inspection was recorded for this visit.</p>
                ) : (
                    <div className="space-y-3">
                        {visit.inspections.map((i) => (
                            <div key={i.id} className="rounded-2xl border border-gray-100 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <SeriesCode code={i.series_code} className="block" />
                                        <p className="text-[15px] font-bold text-gray-900">{i.topic || '-'}</p>
                                    </div>
                                    {i.status === 'approved' && <PdfButton href={`/pdf/inspection/${i.id}`} className="shrink-0" />}
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <InfoRow label="Location">{i.location || '-'}</InfoRow>
                                    <InfoRow label="Subcontractor">{i.subcon || '-'}</InfoRow>
                                    <InfoRow label="Status"><StatusText value={i.status} /></InfoRow>
                                    <InfoRow label="Evaluation"><EvalText value={i.evaluation} /></InfoRow>
                                    {i.description && (
                                        <div className="col-span-2">
                                            <InfoRow label="Comment"><span className="whitespace-pre-wrap">{i.description}</span></InfoRow>
                                        </div>
                                    )}
                                </div>

                                {i.photos?.length > 0 && (
                                    <div className="mt-3 flex gap-2 overflow-x-auto">
                                        {i.photos.map((p) => (
                                            <a key={p} href={p} target="_blank" rel="noreferrer" className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200">
                                                <img src={p} alt="" className="h-full w-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                                {i.review_comment && i.status === 'rejected' && (
                                    <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Returned: {i.review_comment}</p>
                                )}

                                {inspectionHref && (
                                    <div className="mt-4 border-t border-gray-100 pt-4">
                                        <Link href={inspectionHref(i)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 py-3 text-sm font-bold text-brand-400 shadow-sm transition hover:bg-ink-800 sm:ml-auto sm:w-auto sm:min-w-[260px]">
                                            View inspection detail <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>
        </div>
    );
}
