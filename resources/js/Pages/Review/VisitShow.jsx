import React from 'react';
import { Head } from '@inertiajs/react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import VisitDetail from '@/Components/shared/VisitDetail';
import { VisitActions } from './Visits';

export default function VisitShow({ visit, can_verify, can_approve }) {
    return (
        <ReviewLayout title="Site visit">
            <Head title="Site visit" />
            <VisitDetail
                visit={visit}
                backHref="/review/visits"
                backLabel="Back to site visits"
                inspectionHref={(i) => `/review/inspections/${i.id}`}
            >
                <VisitActions visit={visit} can_verify={can_verify} can_approve={can_approve} />
            </VisitDetail>
        </ReviewLayout>
    );
}
