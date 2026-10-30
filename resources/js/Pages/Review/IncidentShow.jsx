import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, FileText, Users, ShieldAlert, MessageSquare, Send, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import { SectionCard, InfoRow } from '@/Components/inspector/kit';
import { incidentTone } from './Incidents';
import ReviewProgress from '@/Components/shared/ReviewProgress';
import HeroMeta from '@/Components/shared/HeroMeta';
import PdfButton from '@/Components/shared/PdfButton';

// status text colours that stay readable on the dark header
const HERO_TONE = { open: 'text-rose-300', inprogress: 'text-amber-300', closed: 'text-emerald-400' };

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
                <ul className="space-y-4">
                    {i.responses.map((r) => {
                        const approved = ['closed', 'approved'].includes(r.type);
                        const label = approved ? 'Approved' : r.type === 'reopened' ? 'Reopened' : 'Reviewed';

                        return (
                            <li key={r.id}>
                                <div className={`inline-block max-w-full rounded-2xl rounded-tl-md px-4 py-2.5 ${approved ? 'bg-emerald-50' : r.type === 'reopened' ? 'bg-amber-50' : 'bg-gray-100'}`}>
                                    <p className="text-sm font-bold text-gray-900">{r.by}</p>
                                    {r.message && <p className="whitespace-pre-wrap break-words text-sm text-gray-800">{r.message}</p>}
                                </div>
                                <p className="mt-1 text-xs text-gray-500">{label}{r.role ? ` · ${r.role}` : ''}{r.at ? ` · ${r.at}` : ''}</p>
                            </li>
                        );
                    })}
                </ul>
            )}
            {can_review && !closed && (
                <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
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

// The page content, shared with the inspector's read-only incident page
export function IncidentDetail({ incident: i, canReview = false, canReopen = false, backHref = '/review/incidents' }) {
    const tone = incidentTone(i.status);
    const isImage = i.attachment && /\.(png|jpe?g|webp|gif)$/i.test(i.attachment);

    return (
            <div className="mx-auto max-w-3xl space-y-5 px-4 pb-10 pt-5">
                <div className="flex items-center justify-between gap-3">
                    <Link href={backHref} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500">
                        <ArrowLeft className="h-4 w-4" /> Back to incidents
                    </Link>
                    <PdfButton href={`/pdf/incident/${i.id}`} />
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Incident {i.series_code}</p>
                        <h1 className="mt-1 text-xl font-extrabold leading-tight">{i.type || 'Incident'}</h1>
                        <HeroMeta rows={[
                            ['Project', i.project || '-'],
                            ['Subcontractor', i.subcon || '-'],
                            ['Date', i.date || '-'],
                            ['Status', <span key="s" className={`font-extrabold uppercase tracking-wide ${HERO_TONE[i.status] || HERO_TONE.open}`}>{tone.label}</span>],
                        ]} />
                    </div>
                </div>
                <ReviewProgress kind="incident" status={i.status} />

                <SectionCard title="Incident details" icon={FileText}>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <InfoRow label="Project">{i.project}</InfoRow>
                        <InfoRow label="Contractor / subcontractor">{i.subcon}</InfoRow>
                        <InfoRow label="Reported by">{i.reported_by}</InfoRow>
                        <InfoRow label="Responsible person">{i.responsible}</InfoRow>
                        <InfoRow label="Date">{i.date}</InfoRow>
                        <InfoRow label="Location">{i.location}</InfoRow>
                        <InfoRow label="Injury type">{i.injury}</InfoRow>
                        <InfoRow label="Body part affected">{i.body_part}</InfoRow>
                        {i.reviewed_by && <InfoRow label="Reviewed by">{i.reviewed_by}</InfoRow>}
                        <div className="sm:col-span-2"><InfoRow label="Incident description"><span className="whitespace-pre-wrap">{i.description}</span></InfoRow></div>
                        <InfoRow label="Immediate cause">{i.immediate_cause}</InfoRow>
                        <InfoRow label="Underlying cause">{i.underlying_cause}</InfoRow>
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

                <ResponsePanel i={i} can_review={canReview} can_reopen={canReopen} />

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
    );
}

export default function IncidentShow({ incident, can_review_incident, can_reopen_incident }) {
    return (
        <ReviewLayout title="Incident">
            <Head title={`Incident ${incident.series_code || ''}`.trim()} />
            <IncidentDetail incident={incident} canReview={can_review_incident} canReopen={can_reopen_incident} />
        </ReviewLayout>
    );
}
