import React from 'react';
import { Head } from '@inertiajs/react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import VisitDetail from '@/Components/shared/VisitDetail';
import { VisitActions } from './Visits';

export default function VisitShow({ visit, can_verify, can_approve }) {
    return (
        <ReviewLayout title="Toolbox talk & Inspection">
            <Head title="Toolbox talk & Inspection" />
            <VisitDetail
                visit={visit}
                backHref="/review/visits"
                backLabel="Back to toolbox talk & inspection"
                inspectionHref={(i) => `/review/inspections/${i.id}`}
                toolboxHref={(t) => `/review/toolbox/${t.id}`}
            >
                <VisitActions visit={visit} can_verify={can_verify} can_approve={can_approve} />
            </VisitDetail>
        </ReviewLayout>
    );
}
