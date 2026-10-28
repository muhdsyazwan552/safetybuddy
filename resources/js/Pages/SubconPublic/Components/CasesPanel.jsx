// NC / CC cases raised against the company - the leader gives the reason / corrective action.
import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Loader2, Send, ShieldCheck, AlertTriangle, MessageSquareWarning, ExternalLink } from 'lucide-react';
import { CASE_STATE } from '@/Components/shared/CaseCard';

export function ReplyBox({ item, publicToken, leaderKey }) {
    const [text, setText] = useState(item.subcon_response || '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    if (item.state === 'closed') return null;
    if (item.state === 'responded') {
        return <p className="text-xs font-semibold text-blue-600">Your reply is with the Supervisor / Manager for review.</p>;
    }

    const send = () => {
        setBusy(true);
        setError('');
        router.post(
            `/subcon/${publicToken}/cases/${item.type}/${item.id}/respond`,
            { response: text, leader_key: leaderKey },
            {
                preserveScroll: true,
                onError: (e) => setError(e.response || 'Could not send your reply.'),
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <div className="space-y-2">
            <textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Explain the reason and the corrective action taken..."
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20"
            />
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
            <button
                type="button"
                disabled={busy || text.trim().length < 5}
                onClick={send}
                className="inline-flex items-center gap-2 rounded-2xl bg-ink-900 px-5 py-3 text-sm font-bold text-brand-400 disabled:opacity-40"
            >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {item.state === 'returned' ? 'Send new reply' : 'Send reply'}
            </button>
        </div>
    );
}

const PAGE_SIZE = 10;

export default function CasesPanel({ cases = [], isLeader, publicToken, leaderKey }) {
    const [page, setPage] = useState(1);

    if (!isLeader) {
        return (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
                <ShieldCheck className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                Only the company leader can see and reply to non-conformance and client complaint cases.
            </div>
        );
    }

    if (cases.length === 0) {
        return (
            <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
                No non-conformance or client complaint cases for your company.
            </div>
        );
    }

    const pages = Math.max(1, Math.ceil(cases.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const start = (current - 1) * PAGE_SIZE;
    const rows = cases.slice(start, start + PAGE_SIZE);

    return (
        <div className="space-y-3">
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                {rows.map((c, n) => {
                    const isNc = c.type === 'nc';
                    const st = CASE_STATE[c.state] || CASE_STATE.open;
                    const i = c.inspection || {};
                    return (
                        <li key={c.key}>
                            <a
                                href={`/subcon/${publicToken}/cases/${c.type}/${c.id}?leader_key=${encodeURIComponent(leaderKey)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-gray-50"
                            >
                                <span className="w-6 shrink-0 text-center text-xs font-extrabold text-gray-400">{start + n + 1}</span>
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isNc ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {isNc ? <AlertTriangle className="h-5 w-5" /> : <MessageSquareWarning className="h-5 w-5" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[11px] font-bold uppercase tracking-widest text-gray-400">{isNc ? 'NC' : 'CC'} #{c.id} · {i.inspection_date || '-'}</span>
                                    <span className="block truncate text-[15px] font-bold text-gray-900">{i.topic || 'Inspection'}</span>
                                    <span className="block truncate text-xs text-gray-500">{[i.project, i.location].filter(Boolean).join(' · ')}</span>
                                </span>
                                <span className={`hidden shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide sm:inline-flex ${st.cls}`}>{st.label}</span>
                                <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" />
                            </a>
                            <span className={`mx-4 mb-3 -mt-1 inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide sm:hidden ${st.cls}`}>{st.label}</span>
                        </li>
                    );
                })}
            </ul>

            {pages > 1 && (
                <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-xs font-semibold text-gray-500">
                        {start + 1}–{Math.min(start + PAGE_SIZE, cases.length)} of {cases.length}
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-40">Prev</button>
                        {Array.from({ length: pages }, (_, k) => k + 1).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPage(p)}
                                className={`h-9 min-w-9 rounded-xl border px-2 text-xs font-bold ${p === current ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-700'}`}
                            >
                                {p}
                            </button>
                        ))}
                        <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-40">Next</button>
                    </div>
                </div>
            )}
        </div>
    );
}