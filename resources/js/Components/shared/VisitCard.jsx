// One site visit: the toolbox talk and the inspections done with it, each with its review status.
import React, { useState } from 'react';
import SeriesCode from './SeriesCode';
import { Link } from '@inertiajs/react';
import EditDeleteIcons from '@/Components/shared/EditDeleteIcons';
import { HardHat, ClipboardCheck, ChevronDown, ChevronRight } from 'lucide-react';
import { EVAL, REVIEW_STATUS, StatusBadge, cardTone } from '@/Components/inspector/kit';

const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');

// label : value rows with the values lined up in one column
const DL = 'mt-3 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 text-xs';
const textColor = (badge) => (badge || '').split(' ').find((c) => c.startsWith('text-')) || 'text-gray-600';

function Row({ label, children }) {
    return (
        <>
            <dt className="text-gray-500">{label} :</dt>
            <dd className="min-w-0 break-words">{children}</dd>
        </>
    );
}

const CASE_STATE = {
    open: { label: 'Waiting for reply', cls: 'border-amber-200 bg-amber-50 text-amber-700' },
    responded: { label: 'Replied', cls: 'border-blue-200 bg-blue-50 text-blue-700' },
    returned: { label: 'Reply returned', cls: 'border-red-200 bg-red-50 text-red-700' },
    closed: { label: 'Closed', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
};

// the conversation on an NC / CC: contractor reply, then the Supervisor / Manager's answer
function Replies({ c }) {
    const bubble = 'rounded-xl px-3 py-2 text-xs';
    return (
        <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-gray-500">Replies</p>
            {!c.subcon_response && !c.return_reason && !c.comment && (
                <p className="text-xs text-gray-400">No reply from the contractor yet.</p>
            )}
            {c.subcon_response && (
                <div className={`${bubble} bg-gray-50 text-gray-700`}>
                    <p className="font-bold text-gray-900">Contractor{c.responded_by ? ` · ${c.responded_by}` : ''}{c.responded_at ? <span className="font-normal text-gray-400"> · {c.responded_at}</span> : null}</p>
                    <p className="mt-1 whitespace-pre-wrap">{c.subcon_response}</p>
                </div>
            )}
            {c.return_reason && (
                <div className={`${bubble} bg-red-50 text-red-700`}>
                    <p className="font-bold">Supervisor / Manager · returned the reply</p>
                    <p className="mt-1 whitespace-pre-wrap">{c.return_reason}</p>
                </div>
            )}
            {c.state === 'closed' && (
                <div className={`${bubble} bg-emerald-50 text-emerald-800`}>
                    <p className="font-bold">Supervisor / Manager · closed{c.date_close ? <span className="font-normal"> · {c.date_close}</span> : null}</p>
                    {c.comment && <p className="mt-1 whitespace-pre-wrap">{c.comment}</p>}
                </div>
            )}
        </div>
    );
}

function StatusText({ value }) {
    const s = REVIEW_STATUS[value || 'pending_verification'];
    return <span className={`font-extrabold uppercase tracking-wide ${textColor(s.badge)}`}>{s.label}</span>;
}

function EvalText({ value }) {
    const ev = EVAL[value];
    return <span className={`font-extrabold uppercase tracking-wide ${textColor(ev?.badge)}`}>{ev?.label || value || '-'}</span>;
}

// href: tapping the card opens that page instead of expanding it in place
// open / onToggle: let the parent control it (e.g. only one card of a list open at a time)
// finding: the card is one NC / CC record (no toolbox row, shows its evaluation instead)
export default function VisitCard({ visit, children, editable = false, defaultOpen = false, detailHref = null, href = null, finding = false, open: openProp, onToggle }) {
    const [openState, setOpenState] = useState(defaultOpen);
    const controlled = openProp !== undefined;
    const open = controlled ? openProp : openState;
    const setOpen = controlled ? () => onToggle?.() : setOpenState;
    const t = visit.talk;
    const tone = cardTone(visit.status);
    const rejected = [t, ...visit.inspections].filter((x) => x && x.status === 'rejected' && x.review_comment);

    return (
        <div className={`overflow-hidden rounded-3xl border shadow-sm ${tone.card}`}>
            <Header href={href} onToggle={() => setOpen((o) => !o)}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold text-gray-900">{visit.project || '-'}</p>
                        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-1.5 text-xs">
                            <dt className="text-gray-500">Date :</dt>
                            <dd className="font-semibold text-gray-700">{fmt(visit.date)}</dd>
                            <dt className="text-gray-500">Inspector :</dt>
                            <dd className="min-w-0 truncate font-semibold text-gray-700">{visit.by || '-'}</dd>
                            {finding && visit.inspections[0]?.topic && (
                                <>
                                    <dt className="text-gray-500">Topic :</dt>
                                    <dd className="min-w-0 truncate font-semibold text-gray-700">{visit.inspections[0].topic}</dd>
                                </>
                            )}
                        </dl>
                    </div>
                    <StatusBadge value={visit.status} className="shrink-0" />
                </div>

                {finding ? (
                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 uppercase tracking-wide ${EVAL[visit.inspections[0]?.evaluation]?.badge || 'border-gray-200 bg-gray-100 text-gray-600'}`}>
                            {EVAL[visit.inspections[0]?.evaluation]?.label || '-'}
                        </span>
                        {visit.inspections[0]?.case && (
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-1 ${CASE_STATE[visit.inspections[0].case.state]?.cls || ''}`}>
                                {CASE_STATE[visit.inspections[0].case.state]?.label}
                            </span>
                        )}
                    </div>
                ) : (
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold">
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
                )}

                {rejected.length > 0 && (
                    <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">Returned: {rejected[0].review_comment}</p>
                )}
                {href ? (
                    <p className="mt-3 flex items-center justify-end gap-1 text-xs font-bold text-brand-800">View details <ChevronRight className="h-4 w-4" /></p>
                ) : (
                    <ChevronDown className={`mx-auto mt-3 h-5 w-5 text-gray-300 transition ${open ? 'rotate-180' : ''}`} />
                )}            </Header>

            {open && !href && (
                <div className={`border-t p-5 ${tone.line} ${tone.foot}`}>
                    <div className="max-h-[60vh] space-y-4 overflow-y-auto overscroll-contain pr-1">
                    {t && (
                        <section className="rounded-2xl border border-gray-100 bg-white p-4">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="flex items-center gap-2 text-sm font-extrabold text-gray-900"><HardHat className="h-4 w-4" /> SP Sampling</p>
                                    <SeriesCode code={t.series_code} className="mt-0.5 block pl-6" />
                                </div>
                                <div className="flex items-center gap-2">
                                    {editable && ['pending_verification', 'rejected'].includes(t.status) && (
                                        <EditDeleteIcons editHref={`/inspector/toolbox-talks/${t.id}/edit`} deleteUrl={`/inspector/toolbox-talks/${t.id}`} what="toolbox talk" returned={t.status === 'rejected'} />
                                    )}
                                </div>
                            </div>
                            <dl className={DL}>
                                <Row label="Status"><StatusText value={t.status} /></Row>
                                {t.conducted && t.categories.length > 0 && (
                                    <Row label="Categories"><span className="font-semibold text-gray-700">{t.categories.join(', ')}</span></Row>
                                )}
                            </dl>
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
                            <p className="flex items-center gap-2 px-1 text-sm font-extrabold text-gray-900"><ClipboardCheck className="h-4 w-4" /> {finding ? 'NC / CC' : 'Inspections'}</p>
                            {visit.inspections.map((i) => (
                                <div key={i.id} className="rounded-2xl border border-gray-100 bg-white p-3.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="min-w-0 text-sm font-bold text-gray-900">{i.topic || '-'}<SeriesCode code={i.series_code} className="block" /></p>
                                        {editable && ['pending_verification', 'rejected'].includes(i.status) && (
                                            <EditDeleteIcons editHref={`/inspector/inspections/${i.id}/edit`} deleteUrl={`/inspector/inspections/${i.id}`} what="inspection" returned={i.status === 'rejected'} />
                                        )}
                                    </div>
                                    <dl className={DL}>
                                        <Row label="Location"><span className="font-semibold text-gray-700">{i.location || '-'}</span></Row>
                                        {i.subcon && <Row label="Subcontractor"><span className="font-semibold text-gray-700">{i.subcon}</span></Row>}
                                        <Row label="Status"><StatusText value={i.status} /></Row>
                                        <Row label="Evaluation"><EvalText value={i.evaluation} /></Row>
                                        {i.description && <Row label="Comment"><span className="whitespace-pre-wrap text-gray-700">{i.description}</span></Row>}
                                    </dl>
                                    {finding && i.case && <Replies c={i.case} />}
                                </div>
                            ))}
                        </section>
                    )}
                    </div>

                    {(detailHref || children) && (
                        <div className={`mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-end ${tone.line}`}>
                            {children}
                            {detailHref && (
                                <Link href={detailHref} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-brand-400">
                                    View full details <ChevronRight className="h-4 w-4" />
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function Header({ href, onToggle, children }) {
    if (href) {
        return <Link href={href} className="block w-full p-5 text-left">{children}</Link>;
    }
    return <button type="button" onClick={onToggle} className="w-full p-5 text-left">{children}</button>;
}
