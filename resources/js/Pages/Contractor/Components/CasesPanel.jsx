// NC / CC cases raised against the company - the leader gives the reason / corrective action.
import { caseStateOf } from '@/Components/shared/caseState';
import { validFiles } from '@/Helpers/fileCheck';
import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { ChevronRight, Loader2, Send, ShieldCheck, AlertTriangle, MessageSquareWarning } from 'lucide-react';

export function ReplyBox({ item, publicToken, leaderKey }) {
    const { data, setData, post, processing, errors } = useForm({
        response: item.subcon_response || '',
        photo: null,
        leader_key: leaderKey,
    });

    if (!['open', 'returned'].includes(item.state)) return null;

    const send = (event) => {
        event.preventDefault();
        post(`/subcon/${publicToken}/cases/${item.type}/${item.id}/respond`, { preserveScroll: true });
    };

    return (
        <form onSubmit={send} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-base font-bold text-gray-900">Corrective action reply</h2>
            <div>
                <label htmlFor="case-response" className="mb-1.5 block text-sm font-semibold">Action taken *</label>
                <textarea
                    id="case-response"
                    rows={4}
                    required
                    minLength={5}
                    maxLength={2000}
                    value={data.response}
                    onChange={(e) => setData('response', e.target.value)}
                    placeholder="Describe what you did to resolve the finding."
                    aria-invalid={!!errors.response}
                    className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
                />
                {errors.response && <p role="alert" className="mt-1 text-sm text-red-700">{errors.response}</p>}
            </div>
            <div>
                <label htmlFor="case-photo" className="mb-1.5 block text-sm font-semibold">Evidence photo *</label>
                <input
                    id="case-photo"
                    type="file"
                    accept="image/jpeg,image/png"
                    required
                    aria-describedby="case-photo-help"
                    aria-invalid={!!errors.photo}
                    onChange={(e) => setData('photo', validFiles(e.target.files, { maxMB: 5, title: 'Photo not accepted' }, e.target)[0] ?? null)}
                    className="block w-full rounded-xl border border-gray-300 p-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:font-semibold"
                />
                <p id="case-photo-help" className="mt-1 text-xs text-gray-600">JPG, JPEG or PNG, up to 5 MB.</p>
                {errors.photo && <p role="alert" className="mt-1 text-sm text-red-700">{errors.photo}</p>}
            </div>
            <button
                type="submit"
                disabled={processing || data.response.trim().length < 5 || !data.photo}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-5 py-3 text-sm font-bold text-brand-400 disabled:opacity-40 sm:w-auto"
            >
                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {processing ? 'Submitting…' : item.state === 'returned' ? 'Resubmit reply' : 'Submit reply'}
            </button>
        </form>
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
            <ul className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-md shadow-gray-200/60">
                {rows.map((c, n) => {
                    const isNc = c.type === 'nc';
                    const closed = c.state === 'closed';
                    const i = c.inspection || {};
                    return (
                        <li key={c.key}>
                            <Link
                                href={`/subcon/${publicToken}/cases/${c.type}/${c.id}?leader_key=${encodeURIComponent(leaderKey)}`}
                                className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-gray-50"
                            >
                                <span className="w-6 shrink-0 text-center text-xs font-extrabold text-gray-400">{start + n + 1}</span>
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isNc ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {isNc ? <AlertTriangle className="h-5 w-5" /> : <MessageSquareWarning className="h-5 w-5" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[11px] font-bold uppercase tracking-widest text-gray-500">{c.series_code || `${isNc ? 'NC' : 'CC'} #${c.id}`} · {i.inspection_date || '-'}</span>
                                    <span className={`block text-xs font-semibold ${caseStateOf(c).text}`}>{caseStateOf(c).label}</span>
                                    <span className="block truncate text-[15px] font-bold text-gray-900">{i.topic || 'Inspection'}</span>
                                    <span className="block truncate text-xs text-gray-500">{[i.project, i.location].filter(Boolean).join(' · ')}</span>
                                </span>
                                <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
                            </Link>
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
