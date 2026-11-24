import ImageViewer from '@/Components/shared/ImageViewer';
import BackLink from '@/Components/shared/BackLink';
import React, { useState } from 'react';
import ReviewProgress from '@/Components/shared/ReviewProgress';
import { Head, Link, router } from '@inertiajs/react';
import HeroMeta, { HeroEval, HeroStatus } from '@/Components/shared/HeroMeta';
import { ArrowLeft, FolderKanban, CheckCircle2, Loader2 } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import { SectionCard, InfoRow, fmtDate } from '@/Components/inspector/kit';

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

// The page content, shared with the inspector's inspection page.
// backHref: where "back" goes; caseHref: link of an NC / CC (null = the user has no case page, shown as text)
export function InspectionDetail({ inspection: i, backHref = null, caseHref = (type, id) => `/review/cases/${type}/${id}`, children }) {
    const caseType = { nonconformance: 'nc', clientcomplaint: 'cc' }[i.evaluation];
    const linkedCase = caseType ? i[caseType] : null;
    const caseLabel = caseType === 'nc' ? 'Non-Conformance' : 'Client Complaint';

    return (
            <div className="mx-auto max-w-3xl space-y-5 px-4 pb-10 pt-5">
                <div className="flex items-center justify-between gap-3">
                    <BackLink href={backHref || `/review/visits/${i.visit_key || `insp-${i.id}`}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </BackLink>
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">{i.series_code || `Inspection #${i.id}`}</p>
                        <h1 className="mt-1 text-xl font-extrabold leading-tight">{i.topic || '-'}</h1>
                        <HeroMeta rows={[
                            ['Location', i.location || '-'],
                            ['Evaluation', <HeroEval key="e" value={i.evaluation} />],
                            ['Status', <HeroStatus key="s" value={i.status} />],
                        ]} />
                    </div>
                </div>

                <ReviewProgress kind={linkedCase ? 'case' : 'visit'} record={linkedCase} status={i.status} />

                {caseType && (
                    <SectionCard title="Linked case">
                        {linkedCase && caseHref && (
                            <p className="mb-3 text-sm text-gray-600">
                                This finding is verified and approved on its {caseLabel} case. Open the case to review details, verify or approve.
                            </p>
                        )}
                        {linkedCase && caseHref ? (
                            <Link href={caseHref(caseType, linkedCase.id)} className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-brand-400">
                                View {caseLabel}{linkedCase.series_code ? ` · ${linkedCase.series_code}` : ''}
                            </Link>
                        ) : linkedCase ? (
                            <p className="text-sm font-semibold text-gray-700">{caseLabel} {linkedCase.series_code}</p>
                        ) : (
                            <p className="text-sm text-gray-600">This finding has no linked {caseLabel} case.</p>
                        )}
                    </SectionCard>
                )}

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
                                <ImageViewer key={p} src={p} label="Inspection photo" className="aspect-square overflow-hidden rounded-2xl border border-gray-200">
                                    <img src={p} alt="" className="h-full w-full object-cover" />
                                </ImageViewer>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {children}
            </div>
    );
}

export default function InspectionShow({ inspection: i, can_verify, can_approve }) {
    return (
        <ReviewLayout title="Inspection">
            <Head title={`Inspection ${i.series_code || ''}`.trim()} />
            <InspectionDetail inspection={i}>
                {/* NC / CC findings are verified and approved on their linked case, not here */}
                {!['nonconformance', 'clientcomplaint'].includes(i.evaluation) && (
                    <Actions i={i} can_verify={can_verify} can_approve={can_approve} />
                )}
            </InspectionDetail>
        </ReviewLayout>
    );
}
