// Site visit detail: toolbox talk first, then the inspections. Shared by the admin and the review portal.
import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, UserRound, MapPin, HardHat, ClipboardCheck, Building2, Users } from 'lucide-react';
import { EvalBadge, StatusBadge, SectionCard, InfoRow, fmtDate } from '@/Components/inspector/kit';

export default function VisitDetail({ visit, backHref, backLabel = 'Back', inspectionHref, children }) {
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
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Site visit</p>
                        <h1 className="mt-1 text-2xl font-extrabold leading-tight">{visit.project || '-'}</h1>
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
                            <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-400" />{fmtDate(visit.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                            <span className="flex items-center gap-1.5"><UserRound className="h-4 w-4 text-brand-400" />{visit.by || '-'}</span>
                        </div>
                    </div>
                    <StatusBadge value={visit.status} className="shrink-0 self-start bg-white !px-4 !py-2 !text-xs" />
                </div>
            </div>

            {children}

            {/* 1 · Toolbox talk */}
            <SectionCard title="1 · Toolbox talk" icon={HardHat}>
                {!t ? (
                    <p className="text-sm text-gray-500">No toolbox talk was recorded for this visit.</p>
                ) : (
                    <div className="space-y-5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${t.conducted ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {t.conducted ? 'Conducted' : 'Not conducted'}
                            </span>
                            <StatusBadge value={t.status} />
                        </div>

                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <InfoRow label="Present">
                                <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-gray-400" />{t.attended}</span>
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
                                <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Attendance</p>
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
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="text-[15px] font-bold text-gray-900">{i.topic || '-'}</p>
                                        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{i.location || '-'}</span>
                                            {i.subcon && <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" />{i.subcon}</span>}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <EvalBadge value={i.evaluation} />
                                        <StatusBadge value={i.status} />
                                    </div>
                                </div>
                                {i.description && <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{i.description}</p>}
                                {i.photos?.length > 0 && (
                                    <div className="mt-3 flex gap-2 overflow-x-auto">
                                        {i.photos.map((p) => (
                                            <a key={p} href={p} target="_blank" rel="noreferrer" className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200">
                                                <img src={p} alt="" className="h-full w-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                )}
                                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-semibold">
                                    {i.verifier && <span className="text-blue-600">Verified by {i.verifier}</span>}
                                    {i.approver && <span className="text-emerald-600">Approved by {i.approver}</span>}
                                    {i.review_comment && i.status === 'rejected' && <span className="text-red-600">Returned: {i.review_comment}</span>}
                                    {inspectionHref && <Link href={inspectionHref(i)} className="ml-auto text-brand-700 hover:underline">Open inspection →</Link>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SectionCard>
        </div>
    );
}
