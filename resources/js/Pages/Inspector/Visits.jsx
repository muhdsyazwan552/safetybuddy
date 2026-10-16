import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import VisitCard from '@/Components/shared/VisitCard';
import { EmptyState, REVIEW_STATUS } from '@/Components/inspector/kit';

export default function Visits({ visits = [], me = null, user }) {
    const [status, setStatus] = useState('all');
    const [owner, setOwner] = useState('all'); // all | mine
    const tabs = [['all', 'All'], ...Object.entries(REVIEW_STATUS).map(([k, v]) => [k, v.label])];
    const mine = (v) => me !== null && Number(v.by_id) === Number(me);
    const list = visits
        .filter((v) => owner === 'all' || mine(v))
        .filter((v) => status === 'all' || v.status === status);

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

                <div className="grid grid-cols-2 gap-1 rounded-2xl bg-gray-200/70 p-1 text-sm font-bold">
                    {[['all', `All visits (${visits.length})`], ['mine', `My visits (${visits.filter(mine).length})`]].map(([k, label]) => (
                        <button key={k} onClick={() => setOwner(k)} className={`rounded-xl py-2 transition ${owner === k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{label}</button>
                    ))}
                </div>

                {list.length === 0 ? (
                    <EmptyState title="No site visits" hint={owner === 'mine' ? 'Start a site visit to record a toolbox talk and inspections together.' : 'No site visit on your projects yet.'} />
                ) : (
                    list.map((v) => <VisitCard key={v.key} visit={v} href={`/inspector/visits/${v.key}`} />)
                )}
            </div>
        </InspectorLayout>
    );
}
