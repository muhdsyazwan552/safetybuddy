import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Clock, Loader2, ShieldCheck, ChevronDown, Mail, Phone, Building2, BriefcaseBusiness, FileText, Check } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';

const STATUS = {
    active: 'bg-emerald-100 text-emerald-800',
    pending: 'bg-amber-100 text-amber-800',
};

function Section({ title, children }) {
    return (
        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-md shadow-gray-200/60">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">{title}</h2>
            {children}
        </section>
    );
}

function Approval({ label, at, name }) {
    return (
        <li className="flex items-center gap-3 py-2.5">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${at ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {at ? <Check className="h-4 w-4" strokeWidth={3} /> : <Clock className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{label}</p>
                <p className={`text-sm font-semibold ${at ? 'text-gray-900' : 'text-amber-700'}`}>
                    {at ? `Approved ${at}${name ? ` · ${name}` : ''}` : 'Waiting'}
                </p>
            </div>
        </li>
    );
}

function Blocks({ items = [] }) {
    const out = [];
    let bullets = [];
    const flush = (k) => {
        if (bullets.length) out.push(<ul key={`b${k}`} className="mb-2 list-disc space-y-1 pl-5 text-sm text-gray-700">{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>);
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

export default function StaffApprovalShow({ staff: s, topics = [], myRole = 'supervisor' }) {
    const [busy, setBusy] = useState(false);
    const [open, setOpen] = useState(null);

    const approve = () => {
        setBusy(true);
        router.post(`/review/staff-approval/${s.id}/approve`, {}, { preserveScroll: true, onFinish: () => setBusy(false) });
    };

    const acked = topics.filter((t) => t.acknowledged_at).length;

    return (
        <ReviewLayout title="Staff detail">
            <Head title={s.name} />
            <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10 pt-5">
                <div className="rounded-3xl bg-ink-900 p-5 text-white">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h1 className="text-lg font-extrabold">{s.name}</h1>
                            {s.code && <p className="text-xs font-bold text-brand-400">{s.code}</p>}
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-extrabold capitalize ${STATUS[s.status] || 'bg-gray-200 text-gray-700'}`}>{s.status || 'inactive'}</span>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-gray-300">
                        <p className="flex items-center gap-2"><Building2 className="h-4 w-4" />{s.company}{s.company_code ? ` · ${s.company_code}` : ''}</p>
                        <p className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4" />{s.role || 'No role'}</p>
                        {s.contact && <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{s.contact}</p>}
                        {s.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" />{s.email}</p>}
                        <p className="text-xs text-gray-400">Registered {s.registered_at}</p>
                    </div>
                </div>

                <Section title="Approval">
                    <ul className="divide-y divide-gray-100">
                        <Approval label="Supervisor" at={s.supervisor_approved_at} name={s.supervisor_approved_name} />
                        <Approval label="Manager" at={s.manager_approved_at} name={s.manager_approved_name} />
                    </ul>
                    {s.can_approve && (
                        <button disabled={busy} onClick={approve} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve as {myRole}
                        </button>
                    )}
                </Section>

                <Section title="Safety Passport">
                    <p className={`mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${s.is_safetypassport ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                        <ShieldCheck className="h-4 w-4" /> {s.is_safetypassport ? 'Worker read and agreed to every topic at registration' : 'Safety Passport not confirmed'}
                    </p>
                    <p className="mb-2 text-xs font-semibold text-gray-500">Company rules acknowledged by the leader: {acked}/{topics.length}</p>
                    <ul className="space-y-2">
                        {topics.map((t, n) => (
                            <li key={t.id} className="overflow-hidden rounded-2xl border border-gray-200">
                                <button type="button" onClick={() => setOpen(open === t.id ? null : t.id)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
                                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${t.acknowledged_at ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                        {t.acknowledged_at ? <Check className="h-4 w-4" strokeWidth={3} /> : n + 1}
                                    </span>
                                    <span className="flex-1 text-sm font-bold text-gray-900">{t.title}</span>
                                    <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition ${open === t.id ? 'rotate-180' : ''}`} />
                                </button>
                                {open === t.id && (
                                    <div className="border-t border-gray-100 bg-gray-50/60 px-3.5 py-3">
                                        <Blocks items={t.items} />
                                        <p className="mt-2 text-[11px] text-gray-400">{t.acknowledged_at ? `Acknowledged by leader ${t.acknowledged_at}` : 'Not acknowledged by the leader yet'}</p>
                                    </div>
                                )}
                            </li>
                        ))}
                        {topics.length === 0 && <li className="text-sm text-gray-400">No Safety Passport topics set up.</li>}
                    </ul>
                </Section>

                <Section title={`Certifications (${s.certifications.length})`}>
                    {s.certifications.length === 0 ? (
                        <p className="text-sm text-gray-400">No certification uploaded.</p>
                    ) : (
                        <ul className="space-y-2">
                            {s.certifications.map((c) => (
                                <li key={c.id}>
                                    <a href={c.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 hover:bg-gray-50">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-900"><FileText className="h-5 w-5" /></span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-bold text-gray-900">{c.title}</span>
                                            <span className="text-[11px] text-gray-500">{c.expiry_date ? `Expires ${c.expiry_date}` : 'No expiry date'}</span>
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </Section>
            </div>
        </ReviewLayout>
    );
}
