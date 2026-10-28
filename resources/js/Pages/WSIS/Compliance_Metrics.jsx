import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import PerformanceSettingsCard from '@/Components/reports/PerformanceSettingsCard';

export default function ComplianceMetrics({ title, performance = null }) {
    return (
        <AppLayout title={title}>
            <Head title={title} />

            <div className="mx-auto max-w-6xl space-y-5 pb-10">
                {performance && <PerformanceSettingsCard settings={performance} />}
            </div>
        </AppLayout>
    );
}
