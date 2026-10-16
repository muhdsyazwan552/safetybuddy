// NC / CC cases raised against the company - the leader gives the reason / corrective action.
import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Loader2, Send, ShieldCheck } from 'lucide-react';
import CaseCard from '@/Components/shared/CaseCard';

function ReplyBox({ item, publicToken, leaderKey }) {
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

export default function CasesPanel({ cases = [], isLeader, publicToken, leaderKey }) {
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

    return (
        <div className="space-y-4">
            {cases.map((c) => (
                <CaseCard key={c.key} item={c}>
                    <ReplyBox item={c} publicToken={publicToken} leaderKey={leaderKey} />
                </CaseCard>
            ))}
        </div>
    );
}
