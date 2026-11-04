// Picks the page shell for the portal the report is opened from.
import React from 'react';
import AppLayout from '@/Pages/WSIS/Layout';
import ReviewLayout from '@/Layouts/ReviewLayout';

export default function ReportShell({ portal, title, wide = false, children }) {
    if (portal === 'review') {
        return <ReviewLayout title={title}><div className="mx-auto max-w-5xl px-4 pb-10 pt-5">{children}</div></ReviewLayout>;
    }

    return <AppLayout title={title}><div className={wide ? "w-full" : "mx-auto max-w-6xl"}>{children}</div></AppLayout>;
}
