import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, MapPin, Siren, FileText, Users, ShieldAlert, ListChecks, MessageSquare, Send, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import { SectionCard, InfoRow } from '@/Components/inspector/kit';
import { incidentTone } from './Incidents';
import ReviewProgress from '@/Components/shared/ReviewProgress';
import PdfButton from '@/Components/shared/PdfButton';

function ResponsePanel({ i, can_review, can_reopen }) {
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const closed = i.status === 'closed';

    const act = (action) => {
        setBusy(true);
        setError('');
        router.post(`/review/incidents/${i.id}/${action}`, { message: text }, {
            preserveScroll: true,
            onSuccess: () => setText(''),
            onError: (e) => setError(e.message || Object.values(e)[0] || 'Action failed.'),
            onFinish: () => setBusy(false),
        });
    };

    return (
        <SectionCard title={`Supervisor review and approval (${i.responses.length})`} icon={MessageSquare}>
            {i.responses.length === 0 ? (
                <p className="text-sm text-gray-500">Awaiting supervisor review.</p>
            ) : (
                <ol className="space-y-3">
                    {i.responses.map((r) => (
                        <li key={r.id} className={`rounded-2xl px-4 py-3 ${['closed', 'approved'].includes(r.type) ? 'bg-emerald-50' : r.type === 'reopened' ? 'bg-amber-50' : 'bg-sky-50'}`}>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                {['closed', 'approved'].includes(r.type) ? 'Approved' : r.type === 'reopened' ? 'Reopened' : 'Reviewed'} · {r.by}{r.role ? ` (${r.role})` : ''} · {r.at}
                            </p>
                            {r.message && <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{r.message}</p>}
                        </li>
                    ))}
                </ol>
            )}

            {can_review && !closed && (
                <div className="mt-4 space-y-3">
                    <textarea
                        rows={3}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={i.status === 'open' ? 'Write your review…' : 'Write your approval remark…'}
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20"
                    />
                    {error && <p className="text-xs font-medium text-red-500">{error}</p>}
                    <div className="flex flex-wrap gap-2">
                        {i.status === 'open' && <button type="button" disabled={busy || text.trim().length < 3} onClick={() => act('respond')} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit review
                        </button>}
                        {i.status === 'inprogress' && <button type="button" disabled={busy || text.trim().length < 3} onClick={() => act('close')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40">
                            <CheckCircle2 className="h-4 w-4" /> Approve incident
                        </button>}
                    </div>
                    <p className="text-xs text-gray-400">The inspector who reported it can read the review and approval remarks.</p>
                </div>
            )}

            {closed && can_reopen && (
                <div className="mt-4">
                    <button type="button" disabled={busy} onClick={() => act('reopen')} className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm font-bold text-amber-700 disabled:opacity-40">
                        <RotateCcw className="h-4 w-4" /> Reopen incident
                    </button>
                </div>
            )}
        </SectionCard>
    );
}

export default function IncidentShow({ incident: i, can_review_incident, can_reopen_incident }) {
    const tone = incidentTone(i.status);
    const isImage = i.attachment && /\.(png|jpe?g|webp|gif)$/i.test(i.attachment);

    return (
        <ReviewLayout title="Incident">
            <Head title={`Incident #${i.id}`} />
            <div className="mx-auto max-w-3xl space-y-5 px-4 pb-10 pt-5">
                <div className="flex items-center justify-between gap-3">
                    <Link href="/review/incidents" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500">
                        <ArrowLeft className="h-4 w-4" /> Back to incidents
                    </Link>
                    <PdfButton href={`/pdf/incident/${i.id}`} />
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Incident #{i.id}</p>
                            <h1 className="mt-1 text-xl font-extrabold leading-tight">{i.type || 'Incident'}</h1>
                            <p className="mt-1 text-sm text-gray-300">{i.project}</p>
                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-300">
                                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-400" />{i.date}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4 text-brand-400" />{i.location || '-'}</span>
                            </div>
                        </div>
                        <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-bold uppercase ${tone.badge}`}>{tone.label}</span>
                    </div>
                </div>

                <ReviewProgress kind="incident" status={i.status} />

                <SectionCard title="Basic information" icon={Siren}>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <InfoRow label="Project">{i.project}</InfoRow>
                        <InfoRow label="Contractor / subcontractor">{i.subcon}</InfoRow>
                        <InfoRow label="Reported by">{i.reported_by}</InfoRow>
                        <InfoRow label="Responsible person">{i.responsible}</InfoRow>
                        <InfoRow label="Injury type">{i.injury}</InfoRow>
                        <InfoRow label="Body part affected">{i.body_part}</InfoRow>
                        {i.reviewed_by && <InfoRow label="Reviewed by">{i.reviewed_by}</InfoRow>}
                    </div>
                </SectionCard>

                <SectionCard title="Case details" icon={FileText}>
                    <div className="space-y-4">
                        <InfoRow label="Incident description">{i.description}</InfoRow>
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                            <InfoRow label="Immediate cause">{i.immediate_cause}</InfoRow>
                            <InfoRow label="Underlying cause">{i.underlying_cause}</InfoRow>
                        </div>
                    </div>
                </SectionCard>

                <SectionCard title="Follow-up and actions" icon={ListChecks}>
                    <div className="space-y-4">
                        <InfoRow label="Immediate action taken">{i.immediate_action}</InfoRow>
                        <InfoRow label="Corrective / preventive action">{i.corrective}</InfoRow>
                    </div>
                </SectionCard>

                {i.involved.length > 0 && (
                    <SectionCard title={`Subcontractor staff involved (${i.involved.length})`} icon={Users}>
                        <ul className="divide-y divide-gray-100">
                            {i.involved.map((p) => (
                                <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                                    <span className="font-semibold text-gray-800">{p.name}</span>
                                    {p.role && <span className="text-xs text-gray-400">{p.role}</span>}
                                </li>
                            ))}
                        </ul>
                    </SectionCard>
                )}

                <ResponsePanel i={i} can_review={can_review_incident} can_reopen={can_reopen_incident} />

                {i.attachment && (
                    <SectionCard title="Evidence" icon={ShieldAlert}>
                        {isImage ? (
                            <a href={i.attachment} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-gray-200">
                                <img src={i.attachment} alt="Evidence" className="w-full object-cover" />
                            </a>
                        ) : (
                            <a href={i.attachment} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-brand-400">
                                <FileText className="h-4 w-4" /> Open attachment
                            </a>
                        )}
                    </SectionCard>
                )}
            </div>
        </ReviewLayout>
    );
}
