// Site visit detail for the company admin: toolbox talk first, then the inspections.
import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import VisitDetail from '@/Components/shared/VisitDetail';

export default function Visit_Show({ visit }) {
    return (
        <AppLayout title="Site visit">
            <Head title="Site visit" />
            <VisitDetail
                visit={visit}
                backHref="/inspection"
                backLabel="Back to site visits"
                inspectionHref={(i) => `/inspections/${i.id}`}
            />
        </AppLayout>
    );
}
