import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import VisitCard from '@/Components/shared/VisitCard';
import { EmptyState, REVIEW_STATUS } from '@/Components/inspector/kit';

export default function Visits({ visits = [], user }) {
    const [status, setStatus] = useState('all');
    const tabs = [['all', 'All'], ...Object.entries(REVIEW_STATUS).map(([k, v]) => [k, v.label])];
    const list = status === 'all' ? visits : visits.filter((v) => v.status === status);

    return (
        <InspectorLayout user={user}>
            <Head title="Site visits" />
            <div className="mx-auto max-w-2xl space-y-4 px-4 pb-24 pt-5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                    <div className="-mx-4 flex min-w-0 flex-1 gap-2 overflow-x-auto px-4">
                        {tabs.map(([k, label]) => (
                            <button key={k} onClick={() => setStatus(k)} className={`shrink-0 rounded-full border-2 px-4 py-1.5 text-xs font-bold ${status === k ? 'border-ink-900 bg-ink-900 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <Link href="/inspector/visits/create" className="sb-create shrink-0">
                        <Plus className="h-4 w-4" strokeWidth={3} /> New
                    </Link>
                </div>

                {list.length === 0 ? (
                    <EmptyState title="No site visits" hint="Start a site visit to record a toolbox talk and inspections together." />
                ) : (
                    list.map((v) => <VisitCard key={v.key} visit={v} editable />)
                )}
            </div>
        </InspectorLayout>
    );
}
