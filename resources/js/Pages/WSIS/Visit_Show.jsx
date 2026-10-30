// Site visit detail for the company admin: toolbox talk first, then the inspections.
import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import VisitDetail from '@/Components/shared/VisitDetail';

export default function Visit_Show({ visit }) {
    return (
        <AppLayout title="Toolbox talk & Inspection">
            <Head title="Toolbox talk & Inspection" />
            <VisitDetail
                visit={visit}
                backHref="/inspection"
                backLabel="Back to toolbox talk & inspection"
                inspectionHref={(i) => `/inspections/${i.id}`}
            />
        </AppLayout>
    );
}
