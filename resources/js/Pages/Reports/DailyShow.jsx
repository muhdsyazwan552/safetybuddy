import BackLink from '@/Components/shared/BackLink';
import React from 'react';
import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import ReportShell from '@/Components/reports/ReportShell';
import DailyReportView from '@/Components/reports/DailyReportView';
import PdfButton from '@/Components/shared/PdfButton';
import LockNotice from '@/Components/reports/LockNotice';

// The report completes by itself and so does its penalty: there is nothing to approve or review by hand.
export default function DailyShow({ portal, report }) {
    const back = portal === 'review' ? '/review/reports?tab=daily' : '/daily-reports';

    return (
        <ReportShell portal={portal} title="Daily report">
            <Head title={`Daily report ${report.report_no}`} />
            <div className="mb-4 flex items-center justify-between">
                <BackLink href={back} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500"><ArrowLeft className="h-4 w-4" /> Back</BackLink>
                <PdfButton href={`/pdf/daily/${report.id}`} className="ml-auto mr-2" />
            </div>
            <LockNotice status={report.status} kind="daily report" />
            <DailyReportView
                report={report}
                talkHref={(t) => (portal === 'review' ? `/review/toolbox/${t.id}` : `/toolbox-talks/${t.id}`)}
                inspectionHref={(i) => (portal === 'review' ? `/review/inspections/${i.id}` : `/inspections/${i.id}`)}
            />
        </ReportShell>
    );
}
