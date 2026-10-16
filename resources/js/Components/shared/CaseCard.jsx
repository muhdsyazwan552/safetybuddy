// Shared card for a Non-conformance / Client complaint case.
// Used by the subcontractor leader page and the Supervisor / Manager review portal.
import React from 'react';
import { cardTone } from '@/Components/inspector/kit';
import { AlertTriangle, MessageSquareWarning, MapPin, CalendarDays, Building2, CheckCircle2, Clock, RotateCcw } from 'lucide-react';

export const CASE_STATE = {
    open: { label: 'Awaiting reply', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
    responded: { label: 'Replied - for review', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock },
    returned: { label: 'Returned - reply again', cls: 'bg-red-50 text-red-700 border-red-200', icon: RotateCcw },
    closed: { label: 'Closed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
};

const fmt = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-');
const photoUrl = (p) => (p?.startsWith('http') || p?.startsWith('/') ? p : `/storage/${p}`);

export default function CaseCard({ item, children }) {
    const isNc = item.type === 'nc';
    const state = CASE_STATE[item.state] || CASE_STATE.open;
    const tone = cardTone(item.state);
    const Icon = isNc ? AlertTriangle : MessageSquareWarning;
    const i = item.inspection || {};

    return (
        <div className={`overflow-hidden rounded-3xl border shadow-sm ${tone.card}`}>
            <div className="flex items-start justify-between gap-3 p-4">
                <div className="flex min-w-0 items-start gap-3">
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isNc ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                        <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
                            {isNc ? 'Non-conformance' : 'Client complaint'} #{item.id}
                        </p>
                        <p className="truncate text-[15px] font-bold text-gray-900">{i.topic || 'Inspection'}</p>
                        <p className="truncate text-xs text-gray-500">{i.project}</p>
                    </div>
                </div>
                <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${state.cls}`}>
                    {state.label}
                </span>
            </div>

            <div className={`space-y-3 border-t p-4 text-sm ${tone.line}`}>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{fmt(i.inspection_date)}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{i.location || '-'}</span>
                    {i.subcon && <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" />{i.subcon}</span>}
                </div>

                {i.description && (
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Inspector's finding</p>
                        <p className="mt-1 whitespace-pre-wrap text-gray-700">{i.description}</p>
                    </div>
                )}

                {i.photos?.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                        {i.photos.map((p) => (
                            <a key={p} href={photoUrl(p)} target="_blank" rel="noreferrer" className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200">
                                <img src={photoUrl(p)} alt="" className="h-full w-full object-cover" />
                            </a>
                        ))}
                    </div>
                )}

                {item.subcon_response && (
                    <div className="rounded-2xl bg-blue-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                            Subcontractor reply{item.responded_by ? ` - ${item.responded_by}` : ''} {item.responded_at ? `· ${fmt(item.responded_at)}` : ''}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-gray-800">{item.subcon_response}</p>
                    </div>
                )}

                {item.return_reason && (
                    <div className="rounded-2xl bg-red-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-red-600">Returned by reviewer</p>
                        <p className="mt-1 whitespace-pre-wrap text-gray-800">{item.return_reason}</p>
                    </div>
                )}

                {item.state === 'closed' && (
                    <p className="text-xs font-semibold text-emerald-600">Closed on {fmt(item.date_close)}{item.comment ? ` - ${item.comment}` : ''}</p>
                )}
            </div>

            {children && <div className={`border-t p-4 ${tone.line} ${tone.foot}`}>{children}</div>}
        </div>
    );
}
