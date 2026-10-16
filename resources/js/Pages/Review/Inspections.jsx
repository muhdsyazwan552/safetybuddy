import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { MapPin, CalendarDays, Building2, CheckCircle2, Loader2 } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import { EvalBadge, StatusBadge, REVIEW_STATUS, fmtDate, cardTone } from '@/Components/inspector/kit';

export function InspectionReviewCard({ item, can_verify, can_approve }) {
    const [busy, setBusy] = useState(false);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const act = (action, data = {}) => {
        setBusy(true);
        setError('');
        router.post(`/review/inspections/${item.id}/${action}`, data, {
            preserveScroll: true,
            onError: (e) => setError(e.comment || 'Action failed.'),
            onFinish: () => setBusy(false),
        });
    };

    const tone = cardTone(item.status || 'pending_verification');
    const canVerify = can_verify && item.status === 'pending_verification';
    const canApprove = can_approve && item.status === 'verified';
    const canReturn = can_verify && ['pending_verification', 'verified'].includes(item.status);

    return (
        <div className={`overflow-hidden rounded-3xl border shadow-sm ${tone.card}`}>
            <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Inspection #{item.id}</p>
                    <p className="truncate text-[15px] font-bold text-gray-900">{item.topic?.name || '-'}</p>
                    <p className="truncate text-xs text-gray-500">{item.project?.name}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <EvalBadge value={item.evaluation} />
                    <StatusBadge value={item.status} />
                </div>
            </div>
            <div className={`space-y-2 border-t p-4 text-sm ${tone.line}`}>
                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{fmtDate(item.inspection_date)}</span>
                    <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{item.location || '-'}</span>
                    <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" />{item.subcon_company?.name || '-'}</span>
                </div>
                {item.description && <p className="whitespace-pre-wrap text-gray-700">{item.description}</p>}
                <p className="text-xs text-gray-400">By {item.inspector?.name || '-'}</p>
                <Link href={`/review/inspections/${item.id}`} className="inline-block text-sm font-bold text-brand-700 hover:underline">View full details →</Link>
                {item.verifier && <p className="text-xs font-semibold text-blue-600">Verified by {item.verifier.name}</p>}
                {item.approver && <p className="text-xs font-semibold text-emerald-600">Approved by {item.approver.name}</p>}
                {item.status === 'rejected' && item.review_comment && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">Returned: {item.review_comment}</p>}
            </div>
            {(canVerify || canApprove || canReturn) && (
                <div className={`space-y-2 border-t p-4 ${tone.line} ${tone.foot}`}>
                    {canReturn && (
                        <input
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Reason (needed to return to inspector)"
                            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
                        />
                    )}
                    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
                    <div className="flex flex-wrap gap-2">
                        {canVerify && <button disabled={busy} onClick={() => act('verify')} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Verify</button>}
                        {canApprove && <button disabled={busy} onClick={() => act('approve')} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />Approve</button>}
                        {canReturn && <button disabled={busy || !reason.trim()} onClick={() => act('reject', { comment: reason })} className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-40">Return</button>}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Inspections({ inspections = [], filter = 'all', can_verify, can_approve }) {
    const [status, setStatus] = useState(filter);
    const tabs = [['all', 'All'], ...Object.entries(REVIEW_STATUS).map(([k, v]) => [k, v.label])];
    const list = status === 'all' ? inspections : inspections.filter((i) => (i.status || 'pending_verification') === status);

    return (
        <ReviewLayout title="Inspections">
            <Head title="Inspections" />
            <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10 pt-5">
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
                    {tabs.map(([k, label]) => (
                        <button key={k} onClick={() => setStatus(k)} className={`shrink-0 rounded-full border-2 px-4 py-1.5 text-xs font-bold ${status === k ? 'border-ink-900 bg-ink-900 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>
                            {label}
                        </button>
                    ))}
                </div>
                {list.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-sm text-gray-500">No inspections here.</p>}
                {list.map((i) => <InspectionReviewCard key={i.id} item={i} can_verify={can_verify} can_approve={can_approve} />)}
            </div>
        </ReviewLayout>
    );
}
