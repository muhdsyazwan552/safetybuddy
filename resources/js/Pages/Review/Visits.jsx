import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Loader2, SearchX } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import VisitCard from '@/Components/shared/VisitCard';
import ListControls, { Pager } from '@/Components/shared/ListControls';

export function VisitActions({ visit, can_verify, can_approve }) {
    const [busy, setBusy] = useState(false);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const canVerify = can_verify && visit.status === 'pending_verification';
    const canApprove = can_approve && visit.status === 'verified';
    const canReturn = can_verify && ['pending_verification', 'verified'].includes(visit.status);
    if (!canVerify && !canApprove && !canReturn) return null;

    // a visit with a toolbox talk is reviewed as a whole; a lone inspection uses its own endpoints
    const base = visit.talk_id ? `/review/visits/${visit.talk_id}` : `/review/inspections/${visit.inspections[0].id}`;

    const act = (action, data = {}) => {
        setBusy(true);
        setError('');
        router.post(`${base}/${action}`, data, {
            preserveScroll: true,
            onError: (e) => setError(e.comment || 'Action failed.'),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="space-y-2 rounded-2xl border border-gray-200 bg-white p-3">
            {canReturn && (
                <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason (needed to return to inspector)"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                />
            )}
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            <div className="flex flex-wrap gap-2">
                {canVerify && (
                    <button disabled={busy} onClick={() => act('verify')} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Verify visit
                    </button>
                )}
                {canApprove && (
                    <button disabled={busy} onClick={() => act('approve')} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                        <CheckCircle2 className="h-4 w-4" /> Approve visit
                    </button>
                )}
                {canReturn && (
                    <button disabled={busy || !reason.trim()} onClick={() => act('reject', { comment: reason })} className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-40">
                        Return
                    </button>
                )}
            </div>
        </div>
    );
}

const monthLabel = (date) => {
    if (!date) return 'No date';
    return new Date(`${date.slice(0, 7)}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

export default function Visits({ visits = [], meta, counts = {}, filters = {}, projects = [], can_verify, can_approve }) {
    const tabs = [
        ['all', 'All', counts.all],
        ['pending_verification', 'Pending verification', counts.pending_verification],
        ['verified', 'Verified', counts.verified],
        ['approved', 'Approved', counts.approved],
        ['rejected', 'Returned', counts.rejected],
    ];

    // only one card is open at a time; opening another closes the previous one
    const [openKey, setOpenKey] = useState(null);

    // month headings make long lists easy to scan and to jump back in time
    let lastMonth = null;

    return (
        <ReviewLayout title="Toolbox talk & Inspection">
            <Head title="Toolbox talk & Inspection" />
            <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10 pt-5">
                <ListControls
                    path="/review/visits"
                    filters={filters}
                    tabs={tabs}
                    tabKey="status"
                    projects={projects}
                    placeholder="Search project, topic, subcontractor, location…"
                    extras={[
                        { key: 'toolbox', label: 'Toolbox talk', options: [['all', 'Any'], ['yes', 'Conducted'], ['no', 'Not conducted'], ['none', 'No toolbox record']] },
                        { key: 'evaluation', label: 'Inspection result', options: [['all', 'Any'], ['good', 'Good'], ['poor', 'Poor'], ['nonconformance', 'Non-conformance'], ['clientcomplaint', 'Client complaint']] },
                    ]}
                />

                {visits.length === 0 ? (
                    <div className="rounded-3xl bg-white p-10 text-center">
                        <SearchX className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-base font-extrabold text-gray-700">No toolbox talk & inspection found</p>
                        <p className="mt-1 text-sm text-gray-400">Try another word, period or clear the filters.</p>
                    </div>
                ) : (
                    visits.map((v) => {
                        const m = monthLabel(v.date);
                        const heading = m !== lastMonth;
                        lastMonth = m;

                        return (
                            <React.Fragment key={v.key}>
                                {heading && <h2 className="pt-2 text-xs font-extrabold uppercase tracking-widest text-gray-500">{m}</h2>}
                                <VisitCard visit={v} detailHref={`/review/visits/${v.key}`} open={openKey === v.key} onToggle={() => setOpenKey((k) => (k === v.key ? null : v.key))} />
                            </React.Fragment>
                        );
                    })
                )}

                <Pager meta={meta} path="/review/visits" filters={filters} />
            </div>
        </ReviewLayout>
    );
}
