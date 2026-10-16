import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, MapPin, FolderKanban, CheckCircle2, Loader2 } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import { SectionCard, InfoRow, EvalBadge, StatusBadge, fmtDate } from '@/Components/inspector/kit';

function Actions({ i, can_verify, can_approve }) {
    const [busy, setBusy] = useState(false);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const canVerify = can_verify && i.status === 'pending_verification';
    const canApprove = can_approve && i.status === 'verified';
    const canReturn = can_verify && ['pending_verification', 'verified'].includes(i.status);
    if (!canVerify && !canApprove && !canReturn) return null;

    const act = (action, data = {}) => {
        setBusy(true);
        setError('');
        router.post(`/review/inspections/${i.id}/${action}`, data, {
            preserveScroll: true,
            onError: (e) => setError(e.comment || 'Action failed.'),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <SectionCard title="Review">
            <div className="space-y-3">
                {canReturn && (
                    <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (needed to return to inspector)" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                )}
                {error && <p className="text-xs font-medium text-red-500">{error}</p>}
                <div className="flex flex-wrap gap-2">
                    {canVerify && (
                        <button disabled={busy} onClick={() => act('verify')} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Verify
                        </button>
                    )}
                    {canApprove && (
                        <button disabled={busy} onClick={() => act('approve')} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                            <CheckCircle2 className="h-4 w-4" /> Approve
                        </button>
                    )}
                    {canReturn && (
                        <button disabled={busy || !reason.trim()} onClick={() => act('reject', { comment: reason })} className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-40">
                            Return to inspector
                        </button>
                    )}
                </div>
            </div>
        </SectionCard>
    );
}

export default function InspectionShow({ inspection: i, can_verify, can_approve }) {
    return (
        <ReviewLayout title="Inspection">
            <Head title={`Inspection #${i.id}`} />
            <div className="mx-auto max-w-3xl space-y-5 px-4 pb-10 pt-5">
                <Link href="/review/visits" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500">
                    <ArrowLeft className="h-4 w-4" /> Back to site visits
                </Link>

                <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Inspection #{i.id}</p>
                            <h1 className="mt-1 text-xl font-extrabold leading-tight">{i.topic || '-'}</h1>
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-300"><MapPin className="h-4 w-4 text-brand-400" />{i.location || '-'}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                            <EvalBadge value={i.evaluation} className="!border-transparent bg-white" />
                            <StatusBadge value={i.status} className="bg-white" />
                        </div>
                    </div>
                </div>

                <SectionCard title="Details" icon={FolderKanban}>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <InfoRow label="Project">{i.project}</InfoRow>
                        <InfoRow label="Category">{i.category}</InfoRow>
                        <InfoRow label="Item">{i.code ? `${i.code} · ${i.topic}` : i.topic}</InfoRow>
                        <InfoRow label="Subcontractor">{i.subcon}</InfoRow>
                        <InfoRow label="Inspector">{i.inspector}</InfoRow>
                        <InfoRow label="Date">{fmtDate(i.date)}</InfoRow>
                        <InfoRow label="Verified by">{i.verifier ? `${i.verifier} · ${i.verified_at || ''}` : '-'}</InfoRow>
                        <InfoRow label="Approved by">{i.approver ? `${i.approver} · ${i.approved_at || ''}` : '-'}</InfoRow>
                    </div>
                    {i.status === 'rejected' && i.review_comment && (
                        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Returned: {i.review_comment}</p>
                    )}
                </SectionCard>

                {i.description && (
                    <SectionCard title="Notes / observations">
                        <p className="whitespace-pre-wrap text-[15px] leading-7 text-gray-700">{i.description}</p>
                    </SectionCard>
                )}

                {i.photos?.length > 0 && (
                    <SectionCard title={`Evidence photos (${i.photos.length})`}>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {i.photos.map((p) => (
                                <a key={p} href={p} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-2xl border border-gray-200">
                                    <img src={p} alt="" className="h-full w-full object-cover" />
                                </a>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {(i.nc || i.cc) && (
                    <SectionCard title="Linked case">
                        <div className="flex flex-wrap gap-3">
                            {i.nc && <Link href={`/review/cases/nc/${i.nc.id}`} className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700">Non-conformance #{i.nc.id} · {i.nc.status}</Link>}
                            {i.cc && <Link href={`/review/cases/cc/${i.cc.id}`} className="rounded-xl bg-purple-50 px-4 py-2.5 text-sm font-bold text-purple-700">Client complaint #{i.cc.id} · {i.cc.status}</Link>}
                        </div>
                    </SectionCard>
                )}

                {i.visit_key && (
                    <Link href={`/review/visits/${i.visit_key}`} className="inline-block rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
                        Open the whole site visit (toolbox talk + inspections)
                    </Link>
                )}

                <Actions i={i} can_verify={can_verify} can_approve={can_approve} />
            </div>
        </ReviewLayout>
    );
}
