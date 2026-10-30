// One incident of the inspector: same page as the manager's, read only.
import React from 'react';
import { Head } from '@inertiajs/react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { IncidentDetail } from '@/Pages/Review/IncidentShow';

export default function IncidentShow({ incident, user }) {
    return (
        <InspectorLayout user={user}>
            <Head title={`Incident ${incident.series_code || ''}`.trim()} />
            <IncidentDetail incident={incident} backHref="/inspector/incidents" />
        </InspectorLayout>
    );
}