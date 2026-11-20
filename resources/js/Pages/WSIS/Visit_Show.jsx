// Site visit detail for the company admin: toolbox talk first, then the inspections.
import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import VisitDetail from '@/Components/shared/VisitDetail';
import EditDeleteIcons from '@/Components/shared/EditDeleteIcons';

export default function Visit_Show({ visit }) {
    return (
        <AppLayout title="Toolbox talk & Inspection">
            <Head title="Toolbox talk & Inspection" />
            <VisitDetail
                visit={visit}
                backHref="/inspection"
                backLabel="Back to toolbox talk & inspection"
                inspectionHref={(i) => `/inspections/${i.id}`}
                talkActions={(t) => (
                    <EditDeleteIcons editHref={t.status !== 'approved' ? `/site-visits/toolbox-talks/${t.id}/edit` : null} deleteUrl={`/site-visits/toolbox-talks/${t.id}`}
                        what="toolbox talk" note="The toolbox talk record will be permanently removed. Its inspections stay." />
                )}
                inspectionActions={(i) => (
                    <EditDeleteIcons editHref={i.status !== 'approved' ? `/site-visits/inspections/${i.id}/edit` : null} deleteUrl={`/site-visits/inspections/${i.id}`}
                        what="inspection" note="The inspection together with its non-conformance / client complaint record will be permanently removed." />
                )}
            />
        </AppLayout>
    );
}
