import ImageViewer from '@/Components/shared/ImageViewer';
// Shared card for a Non-conformance / Client complaint case.
// Used by the subcontractor leader page and the Supervisor / Manager review portal.
import React from 'react';
import { REVIEW_STATUS, cardTone } from '@/Components/inspector/kit';
import { AlertTriangle, MessageSquareWarning, CheckCircle2, ChevronDown, Clock, RotateCcw } from 'lucide-react';

export const CASE_STATE = {
    open: { label: 'Awaiting reply', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    responded: { label: 'Replied - for review', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
    returned: { label: 'Returned - reply again', cls: 'bg-red-50 text-red-700 border-red-200', icon: RotateCcw },
    closed: { label: 'Closed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
const photoUrl = (p) => (p?.startsWith('http') || p?.startsWith('/') ? p : `/storage/${p}`);

// label : value rows with the values lined up in one column
function Row({ label, children, stacked = false }) {
    if (stacked) {
        return (
            <div className="min-w-0">
                <dt className="mb-1 text-xs font-semibold text-gray-500">{label}</dt>
                <dd className="whitespace-pre-wrap break-words text-sm leading-relaxed text-gray-800">{children}</dd>
            </div>
        );
    }

    return (
        <>
            <dt className="text-gray-500">{label} :</dt>
            <dd className="min-w-0 break-words font-semibold text-gray-700">{children}</dd>
        </>
    );
}

// showReply: false hides the subcontractor's reply (the review list only shows it on the detail page)
// collapsible: the card shows a short summary that opens on tap; open / onToggle let the list keep one open at a time
export default function CaseCard({ item, children, showReply = true, collapsible = false, open = true, onToggle }) {
    const isNc = item.type === 'nc';
    const tone = cardTone(item.state);
    const Icon = isNc ? AlertTriangle : MessageSquareWarning;
    const i = item.inspection || {};
    const approval = REVIEW_STATUS[i.approval] || REVIEW_STATUS.pending_verification;
    const closed = item.state === 'closed';
    const full = !collapsible || open;

    const statusClass = 'font-extrabold uppercase tracking-wide';
    const approvalColor = approval.badge.split(' ').find((c) => c.startsWith('text-')) || 'text-gray-600';

    const summary = (
        <>
            <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isNc ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                    <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 text-left">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">{isNc ? 'Non-conformance' : 'Client complaint'}</p>
                    <p className="font-mono text-[11px] font-bold tracking-wide text-brand-800">{item.series_code || `#${item.id}`}</p>
                    <p className="mt-0.5 break-words text-[15px] font-bold text-gray-900">{i.topic || 'Inspection'}</p>
                </div>
            </div>

            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 text-left text-xs">
                <Row label="Date">{fmt(i.inspection_date)}</Row>
                <Row label="Project">{i.project || '-'}</Row>
                {i.subcon && <Row label="Subcontractor">{i.subcon}</Row>}
                {!collapsible && i.inspector && <Row label="Inspector">{i.inspector}</Row>}
                <Row label="Approval status"><span className={`${statusClass} ${approvalColor}`}>{approval.label}</span></Row>
                <Row label="Case status"><span className={`${statusClass} ${closed ? 'text-emerald-700' : 'text-amber-700'}`}>{closed ? 'Closed' : 'Open'}</span></Row>
            </dl>
        </>
    );
    return (
        <div className={`overflow-hidden rounded-3xl border shadow-sm ${tone.card}`}>
            {collapsible ? (
                <button type="button" onClick={onToggle} aria-expanded={open} className="block w-full p-5 text-left">
                    {summary}
                    <ChevronDown className={`mx-auto mt-3 h-5 w-5 text-gray-300 transition ${open ? 'rotate-180' : ''}`} />
                </button>
            ) : (
                <div className="p-5">{summary}</div>
            )}

            {full && (
                <div className={`space-y-3 border-t p-5 text-xs ${tone.line}`}>
                    <dl className="space-y-4">

                        <Row label="Location" stacked>{i.location || '-'}</Row>
                        {i.description && <Row label="Inspector's finding" stacked>{i.description}</Row>}
                        {showReply && item.subcon_response && (
                            <Row label={`Subcontractor reply${item.responded_by ? ` · ${item.responded_by}` : ''}${item.responded_at ? ` · ${fmt(item.responded_at)}` : ''}`} stacked>
                                {item.subcon_response}
                                {item.response_photo && (
                                    <ImageViewer src={item.response_photo} label="Corrective action photo" className="mt-2 block w-fit">
                                        <img src={item.response_photo} alt="Corrective action photo" className="max-h-48 rounded-xl border border-gray-200 object-contain" />
                                    </ImageViewer>
                                )}
                            </Row>
                        )}
                        {item.return_reason && (
                            <Row label="Returned by reviewer" stacked><span className="text-red-700">{item.return_reason}</span></Row>
                        )}
                        {closed && (
                            <Row label="Closed on" stacked><span className="text-emerald-700">{fmt(item.date_close)}{item.comment ? ` - ${item.comment}` : ''}</span></Row>
                        )}
                    </dl>

                    {i.photos?.length > 0 && (
                        <div>
                            <p className="mb-2 text-xs font-semibold text-gray-500">Inspection photos</p>
                            <div className="flex flex-wrap gap-2">
                                {i.photos.filter(Boolean).map((p, index) => (
                                    <ImageViewer key={p} src={photoUrl(p)} label={`Inspection photo ${index + 1}`} className="h-20 w-20 overflow-hidden rounded-xl border border-gray-200">
                                        <img src={photoUrl(p)} alt={`Inspection photo ${index + 1}`} className="h-full w-full object-cover" />
                                    </ImageViewer>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {full && children && <div className={`border-t p-4 ${tone.line} ${tone.foot}`}>{children}</div>}
        </div>
    );
}
