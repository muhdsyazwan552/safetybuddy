import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import ReportShell from '@/Components/reports/ReportShell';
import MonthlyReportView from '@/Components/reports/MonthlyReportView';
import PdfButton from '@/Components/shared/PdfButton';
import LockNotice from '@/Components/reports/LockNotice';

// The monthly report is not approved by hand: it is complete once every daily report of the month is complete.
export default function MonthlyShow({ portal, report }) {
    const isReview = portal === 'review';
    const back = isReview ? '/review/reports?tab=monthly' : '/monthly-reports';
    const dailyHref = (d) => (isReview ? `/review/reports/daily/${d.id}` : `/daily-reports/${d.id}`);

    return (
        <ReportShell portal={portal} title="Monthly report">
            <Head title={`Monthly report ${report.report_no}`} />
            <div className="mb-4 flex items-center justify-between">
                <Link href={back} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500"><ArrowLeft className="h-4 w-4" /> Back to reports</Link>
                <PdfButton href={`/pdf/monthly/${report.id}`} className="ml-auto mr-2" />
            </div>
            <LockNotice status={report.status} kind="monthly report" />
            <MonthlyReportView report={report} dailyHref={dailyHref} />
        </ReportShell>
    );
}
