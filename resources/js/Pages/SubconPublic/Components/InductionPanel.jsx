// resources/js/Pages/SubconPublic/Components/InductionPanel.jsx
// Safety Passport rules the company leader must tick. Incomplete => company stays INACTIVE.
import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import { Check, ChevronDown, Lock, ShieldCheck, ShieldAlert, Loader2, FileDown } from 'lucide-react';
import { showAlert } from '@/Helpers/alert';

function Blocks({ items }) {
    const out = [];
    let bullets = [];
    const flush = (k) => {
        if (!bullets.length) return;
        out.push(
            <ul key={`u${k}`} className="mb-2 space-y-1.5">
                {bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                        {b}
                    </li>
                ))}
            </ul>
        );
        bullets = [];
    };
    items.forEach((it, i) => {
        if (it.type === 'bullet') { bullets.push(it.content); return; }
        flush(i);
        if (it.type === 'subheading') out.push(<p key={i} className="mb-1.5 mt-3 text-sm font-extrabold text-gray-900 first:mt-0">{it.content}</p>);
        else if (it.type === 'highlight') out.push(<p key={i} className="mb-2 rounded-xl border border-brand-300 bg-brand-100 px-3.5 py-2.5 text-sm font-extrabold text-ink-900">{it.content}</p>);
        else out.push(<p key={i} className="mb-2 text-sm leading-relaxed text-gray-700">{it.content}</p>);
    });
    flush('end');
    return <div>{out}</div>;
}

export default function InductionPanel({ induction, isLeader, publicToken, leaderKey, companyName }) {
    const { topics = [], total = 0, done = 0, complete = false } = induction;
    const [open, setOpen] = useState(null);
    const [busy, setBusy] = useState(null);
    const [read, setRead] = useState([]);
    const pct = total ? Math.round((done / total) * 100) : 100;

    const base = `/subcon/${publicToken}/safety-passport`;

    const toggle = (t) => {
        if (!isLeader) return;
        setBusy(t.id);
        router.post(`${base}/${t.id}`, { acknowledged: !t.acked, leader_key: leaderKey }, {
            preserveScroll: true,
            onError: () => showAlert.error('Could not save this tick. Please try again.', 'Not saved'),
            onFinish: () => setBusy(null),
        });
    };

    // a rule can only be ticked after its title and content were opened and read
    const toggleOpen = (id) => {
        setOpen(open === id ? null : id);
        setRead((r) => (r.includes(id) ? r : [...r, id]));
    };

    return (
        <div className="space-y-4">
            {/* status banner */}
            <div className={`flex flex-col gap-4 rounded-3xl border p-5 sm:flex-row sm:items-center sm:justify-between ${complete ? 'border-emerald-200 bg-emerald-50' : 'border-amber-300 bg-amber-50'}`}>
                <div className="flex items-start gap-3">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${complete ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-ink-900'}`}>
                        {complete ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
                    </span>
                    <div>
                        <p className={`text-base font-extrabold ${complete ? 'text-emerald-800' : 'text-amber-900'}`}>
                            {complete ? 'Safety Passport complete — company is ACTIVE' : 'Safety Passport incomplete — company is INACTIVE'}
                        </p>
                        <p className={`mt-0.5 text-sm ${complete ? 'text-emerald-700' : 'text-amber-800'}`}>
                            {complete
                                ? 'Every rule has been acknowledged by the company leader.'
                                : 'The company stays inactive until the leader ticks every rule below.'}
                        </p>
                    </div>
                </div>
                <div className="w-full shrink-0 sm:w-56">
                    <div className="flex items-baseline justify-between text-sm font-extrabold text-gray-800">
                        <span>{done} / {total} ticked</span><span>{pct}%</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white">
                        <div className={`h-full rounded-full transition-all duration-500 ${complete ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                    </div>
                </div>
            </div>

            {total > 0 && (
                <div className="flex justify-end">
                    <a
                        href={`${base}/pdf`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-2xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-brand-400 active:scale-95 transition"
                    >
                        <FileDown className="h-4 w-4" /> Download Safety Passport (PDF)
                    </a>
                </div>
            )}

            {!isLeader && (
                <p className="flex items-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
                    <Lock className="h-4 w-4 shrink-0 text-sky-500" />
                    Only the company leader can acknowledge the Safety Passport rules. You can read every rule here.
                </p>
            )}

            {isLeader && !complete && total > 0 && (
                <p className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" />
                    Open each rule and read its title and content, then tick it. The tick unlocks after you open the rule.
                </p>
            )}

            {/* topics */}
            <div className="space-y-2.5">
                {topics.map((t, idx) => {
                    const isOpen = open === t.id;
                    const canTick = isLeader && (t.acked || read.includes(t.id));
                    return (
                        <div key={t.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition ${t.acked ? 'border-emerald-200' : 'border-gray-200'}`}>
                            <div className="flex items-center gap-3 px-4 py-3">
                                <button
                                    type="button"
                                    onClick={() => toggle(t)}
                                    disabled={!canTick || busy === t.id}
                                    title={isLeader && !canTick ? 'Open and read this rule first' : undefined}
                                    aria-label={t.acked ? 'Untick topic' : 'Tick topic'}
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 transition ${
                                        t.acked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 bg-white text-transparent'
                                    } ${canTick ? 'cursor-pointer hover:border-emerald-500' : 'cursor-not-allowed opacity-60'}`}
                                >
                                    {busy === t.id ? <Loader2 className="h-4 w-4 animate-spin text-gray-500" /> : <Check className="h-5 w-5" strokeWidth={3} />}
                                </button>

                                <button type="button" onClick={() => toggleOpen(t.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-xs font-extrabold text-brand-400">{idx + 1}</span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[15px] font-extrabold text-gray-900">{t.title}</span>
                                    </span>
                                    <ChevronDown className={`h-5 w-5 shrink-0 text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                            {isOpen && (
                                <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
                                    <Blocks items={t.items} />
                                </div>
                            )}
                        </div>
                    );
                })}
                {topics.length === 0 && <p className="rounded-2xl bg-white p-6 text-center text-sm text-gray-400">No Safety Passport rules are configured yet.</p>}
            </div>
        </div>
    );
}
