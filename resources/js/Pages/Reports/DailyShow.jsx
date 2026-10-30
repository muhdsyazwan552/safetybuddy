import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import ReportShell from '@/Components/reports/ReportShell';
import DailyReportView from '@/Components/reports/DailyReportView';
import { Panel } from '@/Components/reports/parts';
import PdfButton from '@/Components/shared/PdfButton';

function PenaltyReview({ report, can_approve }) {
    const [busy, setBusy] = useState(false);
    if (!can_approve || report.status !== 'approved' || !report.settings.penalties_on || report.penalty.total <= 0) return null;

    const act = (decision) => {
        setBusy(true);
        router.post(`/review/reports/daily/${report.id}/penalty`, { decision }, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    return (
        <Panel title="Penalty review (Manager)" tone="gold">
            <p className="mb-3 text-sm text-slate-600">
                The calculated penalty is not enforced until you confirm it. Current decision: <b>{report.penalty_status.replace('_', ' ')}</b>.
            </p>
            <div className="flex flex-wrap gap-2">
                <button disabled={busy || report.penalty_status === 'confirmed'} onClick={() => act('confirmed')} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Confirm penalty</button>
                <button disabled={busy || report.penalty_status === 'waived'} onClick={() => act('waived')} className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-40">Waive penalty</button>
            </div>
        </Panel>
    );
}

export default function DailyShow({ portal, report, links, can_approve }) {
    const back = portal === 'review' ? '/review/reports?tab=daily' : '/daily-reports';

    return (
        <ReportShell portal={portal} title="Daily report">
            <Head title={`Daily report ${report.report_no}`} />
            <div className="mb-4 flex items-center justify-between">
                <Link href={back} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500"><ArrowLeft className="h-4 w-4" /> Back to reports</Link>
                <PdfButton href={`/pdf/daily/${report.id}`} className="ml-auto mr-2" />
            </div>
            <DailyReportView report={report}>
                <PenaltyReview report={report} can_approve={can_approve} />
            </DailyReportView>
        </ReportShell>
    );
}
