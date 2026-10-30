import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { CheckCircle2, ChevronRight, Loader2, SearchX } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import CaseCard from '@/Components/shared/CaseCard';
import ListControls, { Pager } from '@/Components/shared/ListControls';

export function CaseActions({ item }) {
    const [busy, setBusy] = useState(false);
    const [text, setText] = useState('');
    const [error, setError] = useState('');

    if (item.state === 'closed') return null;
    if (item.state === 'open' || item.state === 'returned') {
        return <p className="text-xs font-semibold text-amber-600">Waiting for the subcontractor leader to reply.</p>;
    }

    const post = (action, data) => {
        setBusy(true);
        setError('');
        router.post(`/review/cases/${item.type}/${item.id}/${action}`, data, {
            preserveScroll: true,
            onError: (e) => setError(e.reason || e.comment || 'Action failed.'),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="space-y-2">
            <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Comment (required to return, optional to close)"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            <div className="flex flex-wrap gap-2">
                <button disabled={busy} onClick={() => post('close', { comment: text })} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve &amp; close
                </button>
                <button disabled={busy || !text.trim()} onClick={() => post('return', { reason: text })} className="rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold text-red-600 disabled:opacity-40">
                    Return to subcon
                </button>
            </div>
        </div>
    );
}

const monthLabel = (date) => {
    if (!date) return 'No date';
    return new Date(`${date.slice(0, 7)}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

export default function Cases({ cases = [], meta, counts = {}, filters = {}, projects = [] }) {
    const tabs = [
        ['all', 'All', counts.all],
        ['responded', 'For review', counts.responded],
        ['open', 'Awaiting reply', counts.open],
        ['returned', 'Returned', counts.returned],
        ['closed', 'Closed', counts.closed],
    ];
    let lastMonth = null;
    // only one card is open at a time
    const [openKey, setOpenKey] = useState(null);

    return (
        <ReviewLayout title="NC / CC cases">
            <Head title="NC / CC cases" />
            <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10 pt-5">
                <ListControls
                    path="/review/cases"
                    filters={filters}
                    tabs={tabs}
                    tabKey="state"
                    projects={projects}
                    placeholder="Search project, topic, subcontractor, reply, #id…"
                    extras={[{ key: 'type', label: 'Type', options: [['all', 'NC and CC'], ['nc', 'Non-conformance'], ['cc', 'Client complaint']] }]}
                />

                {cases.length === 0 ? (
                    <div className="rounded-3xl bg-white p-10 text-center">
                        <SearchX className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-base font-extrabold text-gray-700">No cases found</p>
                        <p className="mt-1 text-sm text-gray-400">Try another word, period or clear the filters.</p>
                    </div>
                ) : (
                    cases.map((c) => {
                        const m = monthLabel(c.date_open);
                        const heading = m !== lastMonth;
                        lastMonth = m;

                        return (
                            <React.Fragment key={c.key}>
                                {heading && <h2 className="pt-2 text-xs font-extrabold uppercase tracking-widest text-gray-500">{m}</h2>}
                                <CaseCard item={c} showReply={false} collapsible open={openKey === c.key} onToggle={() => setOpenKey((k) => (k === c.key ? null : c.key))}>
                                    <div className="space-y-3">
                                        <Link href={`/review/cases/${c.type}/${c.id}`} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 py-3 text-sm font-bold text-brand-400 shadow-sm transition hover:bg-ink-800 sm:ml-auto sm:w-auto sm:min-w-[260px]">
                                            View full details <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </CaseCard>
                            </React.Fragment>
                        );
                    })
                )}

                <Pager meta={meta} path="/review/cases" filters={filters} />
            </div>
        </ReviewLayout>
    );
}
