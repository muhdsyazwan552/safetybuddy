// One site visit: the toolbox talk and the inspections done with it, each with its review status.
import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { CalendarDays, UserRound, HardHat, ClipboardCheck, ChevronDown, Check, X, MapPin, Pencil } from 'lucide-react';
import { EvalBadge, StatusBadge, cardTone } from '@/Components/inspector/kit';

const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

export default function VisitCard({ visit, children, editable = false, defaultOpen = false, detailHref = null }) {
    const [open, setOpen] = useState(defaultOpen);
    const t = visit.talk;
    const tone = cardTone(visit.status);
    const rejected = [t, ...visit.inspections].filter((x) => x && x.status === 'rejected' && x.review_comment);

    return (
        <div className={`overflow-hidden rounded-3xl border shadow-sm ${tone.card}`}>
            <button type="button" onClick={() => setOpen((o) => !o)} className="w-full p-4 text-left">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold text-gray-900">{visit.project || '-'}</p>
                        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{fmt(visit.date)}</span>
                            <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4" />{visit.by || '-'}</span>
                        </p>
                    </div>
                    <StatusBadge value={visit.status} className="shrink-0" />
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
                    {t ? (
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${t.conducted ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                            <HardHat className="h-3.5 w-3.5" /> Toolbox {t.conducted ? 'conducted' : 'not conducted'}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-500">
                            <HardHat className="h-3.5 w-3.5" /> No toolbox record
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                        <ClipboardCheck className="h-3.5 w-3.5" /> {visit.inspections.length} inspection{visit.inspections.length === 1 ? '' : 's'}
                    </span>
                </div>

                {rejected.length > 0 && (
                    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">Returned: {rejected[0].review_comment}</p>
                )}
                <ChevronDown className={`mx-auto mt-2 h-5 w-5 text-gray-300 transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className={`space-y-4 border-t p-4 ${tone.line} ${tone.foot}`}>
                    {t && (
                        <section className="rounded-2xl border border-gray-100 bg-white p-4">
                            <div className="flex items-center justify-between gap-2">
                                <p className="flex items-center gap-2 text-sm font-extrabold text-gray-900"><HardHat className="h-4 w-4" /> Toolbox talk</p>
                                <div className="flex items-center gap-2">
                                    <StatusBadge value={t.status} />
                                    {editable && ['pending_verification', 'rejected'].includes(t.status) && (
                                        <Link href={`/inspector/toolbox-talks/${t.id}/edit`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600" aria-label="Edit toolbox talk">
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">{t.attended} present</p>
                            {t.conducted && t.categories.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {t.categories.map((c) => <span key={c} className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-bold text-brand-900">{c}</span>)}
                                </div>
                            )}
                            {!t.conducted && t.sp_sampled !== null && (
                                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                                    <div><p className="text-lg font-extrabold text-gray-900">{t.sp_sampled}</p><p className="text-[11px] text-gray-500">Sampled</p></div>
                                    <div><p className="text-lg font-extrabold text-gray-900">{t.sp_not_registered}</p><p className="text-[11px] text-gray-500">Not registered</p></div>
                                    <div><p className={`text-lg font-extrabold ${t.sp_compliance >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>{t.sp_compliance ?? '-'}%</p><p className="text-[11px] text-gray-500">SP compliance</p></div>
                                </div>
                            )}
                        </section>
                    )}

                    {visit.inspections.length > 0 && (
                        <section className="space-y-2">
                            <p className="flex items-center gap-2 px-1 text-sm font-extrabold text-gray-900"><ClipboardCheck className="h-4 w-4" /> Inspections</p>
                            {visit.inspections.map((i) => (
                                <div key={i.id} className="rounded-2xl border border-gray-100 bg-white p-3.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="min-w-0 text-sm font-bold text-gray-900">{i.topic || '-'}</p>
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <EvalBadge value={i.evaluation} />
                                            {editable && ['pending_verification', 'rejected'].includes(i.status) && (
                                                <Link href={`/inspector/inspections/${i.id}/edit`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600" aria-label="Edit inspection">
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                                        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{i.location || '-'}</span>
                                        {i.subcon && <span>{i.subcon}</span>}
                                    </p>
                                    {i.description && <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{i.description}</p>}
                                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <StatusBadge value={i.status} />
                                        {i.verifier && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600"><Check className="h-3 w-3" />Verified by {i.verifier}</span>}
                                        {i.approver && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><Check className="h-3 w-3" />Approved by {i.approver}</span>}
                                    </div>
                                </div>
                            ))}
                        </section>
                    )}

                    {detailHref && (
                        <Link href={detailHref} className="inline-flex items-center justify-center rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-brand-400">
                            View full details
                        </Link>
                    )}

                    {children}
                </div>
            )}
        </div>
    );
}
