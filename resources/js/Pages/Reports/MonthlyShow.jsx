import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Printer, CheckCircle2 } from 'lucide-react';
import ReportShell from '@/Components/reports/ReportShell';
import MonthlyReportView from '@/Components/reports/MonthlyReportView';
import { Panel } from '@/Components/reports/parts';

function Approval({ m, can_verify, can_approve }) {
    const [busy, setBusy] = useState(false);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const canVerify = can_verify && ['pending_verification', 'rejected'].includes(m.status) && m.inspections_approved > 0;
    const canApprove = can_approve && m.status === 'verified';
    const canReturn = can_verify && ['pending_verification', 'verified'].includes(m.status);

    const act = (action, data = {}) => {
        setBusy(true);
        setError('');
        router.post(`/review/reports/monthly/${m.id}/${action}`, data, {
            preserveScroll: true,
            onError: (e) => setError(e.comment || Object.values(e)[0] || 'Action failed.'),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <Panel title="Verification and approval">
            <div className="grid gap-4 text-sm sm:grid-cols-2">
                <p><b>Verified by (Supervisor):</b> {m.verified_by ? `${m.verified_by} · ${m.verified_at}` : 'Awaiting verification'}</p>
                <p><b>Approved by (Manager):</b> {m.approved_by ? `${m.approved_by} · ${m.approved_at}` : 'Awaiting approval'}</p>
            </div>
            {m.status === 'rejected' && m.review_comment && (
                <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">Returned: {m.review_comment}</p>
            )}
            {(canVerify || canApprove || canReturn) && (
                <div className="mt-4 space-y-3">
                    {canReturn && (
                        <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (needed to return the report)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    )}
                    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
                    <div className="flex flex-wrap gap-2">
                        {canVerify && <button disabled={busy} onClick={() => act('verify')} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Verify report</button>}
                        {canApprove && <button disabled={busy} onClick={() => act('approve')} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> Approve report</button>}
                        {canReturn && <button disabled={busy || !reason.trim()} onClick={() => act('reject', { comment: reason })} className="rounded-xl border border-rose-300 bg-white px-4 py-2 text-sm font-bold text-rose-600 disabled:opacity-40">Return</button>}
                    </div>
                </div>
            )}
        </Panel>
    );
}

export default function MonthlyShow({ portal, report, can_verify, can_approve }) {
    const isReview = portal === 'review';
    const back = isReview ? '/review/reports?tab=monthly' : '/monthly-reports';
    const dailyHref = (d) => (isReview ? `/review/reports/daily/${d.id}` : `/daily-reports/${d.id}`);

    return (
        <ReportShell portal={portal} title="Monthly report">
            <Head title={`Monthly report ${report.report_no}`} />
            <div className="mb-4 flex items-center justify-between">
                <Link href={back} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500"><ArrowLeft className="h-4 w-4" /> Back to reports</Link>
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 print:hidden">
                    <Printer className="h-4 w-4" /> Print
                </button>
            </div>
            <MonthlyReportView report={report} dailyHref={dailyHref}>
                <Approval m={report} can_verify={isReview && can_verify} can_approve={isReview && can_approve} />
            </MonthlyReportView>
        </ReportShell>
    );
}
