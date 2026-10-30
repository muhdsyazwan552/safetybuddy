import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Check, ChevronRight, ClipboardCheck, CalendarDays, Link2, MessageSquareReply, RotateCcw } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import HeroMeta, { HeroStatus } from '@/Components/shared/HeroMeta';
import ReviewProgress from '@/Components/shared/ReviewProgress';
import { SectionCard, InfoRow, EVAL, fmtDate } from '@/Components/inspector/kit';
import { CaseActions } from './Cases';
import PdfButton from '@/Components/shared/PdfButton';

const photoUrl = (p) => (p?.startsWith('http') || p?.startsWith('/') ? p : `/storage/${p}`);

// date and time a comment was sent
const SENT_AT = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' };

// A comment like in a social feed: name, bubble with the text, date sent underneath
function Comment({ name, role, when, text, tone }) {
    const red = tone === 'red';

    return (
        <li>
            <div className="min-w-0">
                <div className={`inline-block max-w-full rounded-2xl rounded-tl-md px-4 py-2.5 ${red ? 'bg-red-50' : 'bg-gray-100'}`}>
                    <p className="text-sm font-bold text-gray-900">{name}</p>
                    <p className="whitespace-pre-wrap break-words text-sm text-gray-800">{text}</p>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                    {role}{when ? ` · ${when}` : ''}
                </p>
            </div>
        </li>
    );
}
// One step of the timeline, drawn like the review progress indicator: green tick when done, blue number when it is the current step, red when returned
function Step({ index, done, active, bad, last, label, when, note }) {
    return (
        <li className="relative flex gap-3 pb-5 last:pb-0">
            {!last && <span className={`absolute left-4 top-8 -ml-px h-[calc(100%-2rem)] w-0.5 ${done ? 'bg-emerald-500' : 'bg-gray-200'}`} aria-hidden="true" />}
            <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold ${
                bad ? 'border-red-500 bg-red-500 text-white' : done ? 'border-emerald-600 bg-emerald-600 text-white' : active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-400'
            }`}>
                {bad ? <RotateCcw className="h-4 w-4" /> : done ? <Check className="h-4 w-4" /> : index}
            </span>
            <div className="min-w-0 pt-1">
                <p className={`text-sm font-bold ${bad ? 'text-red-700' : done ? 'text-emerald-700' : active ? 'text-blue-700' : 'text-gray-400'}`}>{label}</p>
                {when && <p className="text-xs text-gray-500">{when}</p>}
                {note && <p className="mt-0.5 whitespace-pre-wrap text-xs text-gray-600">{note}</p>}
            </div>
        </li>
    );
}

export default function CaseShow({ item }) {
    const isNc = item.type === 'nc';
    const i = item.inspection || {};
    const closed = item.state === 'closed';

    const steps = [
        { done: true, label: 'Case opened', when: fmtDate(item.date_open), note: `By inspector ${i.inspector || '-'}` },
        {
            done: !!item.subcon_response,
            label: 'Subcontractor replied',
            when: item.responded_at ? fmtDate(item.responded_at) : 'Waiting for the leader',
            note: item.subcon_response,
        },
        ...(item.return_reason ? [{ done: true, bad: true, label: 'Returned to the subcontractor', when: item.reviewer ? `By ${item.reviewer}` : '', note: item.return_reason }] : []),
        {
            done: closed,
            label: 'Approved and closed',
            when: closed ? `${fmtDate(item.date_close)}${item.reviewer ? ` · ${item.reviewer}` : ''}` : 'Not closed yet',
            note: closed ? item.comment : null,
        },
    ];
    // the first step that is not finished is the current one
    const firstOpen = steps.findIndex((s) => !s.done);

    return (
        <ReviewLayout title={isNc ? 'Non-conformance' : 'Client complaint'}>
            <Head title={isNc ? 'Non-conformance' : 'Client complaint'} />
            <div className="mx-auto max-w-3xl space-y-5 px-4 pb-10 pt-5">
                <div className="flex items-center justify-between gap-3">
                    <Link href="/review/cases" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500">
                        <ArrowLeft className="h-4 w-4" /> Back to cases
                    </Link>
                    {closed && <PdfButton href={`/pdf/case/${item.type}/${item.id}`} />}
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">
                            {isNc ? 'Non-conformance' : 'Client complaint'} {item.series_code || `#${item.id}`}
                        </p>
                        <h1 className="mt-1 text-xl font-extrabold leading-tight">{i.topic || 'Inspection'}</h1>
                        <HeroMeta rows={[
                            ['Project', i.project || '-'],
                            ['Subcontractor', i.subcon || '-'],
                            ['Date', fmtDate(i.inspection_date)],
                            ['Approval status', <HeroStatus key="a" value={i.approval} />],
                            ['Case status', <span key="c" className={`font-extrabold uppercase tracking-wide ${closed ? 'text-emerald-400' : 'text-amber-300'}`}>{closed ? 'Closed' : 'Open'}</span>],
                        ]} />
                    </div>
                </div>

                <ReviewProgress kind="case" record={item} />

                <SectionCard title="Case details" icon={ClipboardCheck}>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <InfoRow label="Project">{i.project}</InfoRow>
                        <InfoRow label="Inspection topic">{i.topic}</InfoRow>
                        <InfoRow label="Subcontractor">{i.subcon}</InfoRow>
                        <InfoRow label="Raised by (inspector)">{i.inspector}</InfoRow>
                        <InfoRow label="Location">{i.location}</InfoRow>
                        <InfoRow label="Inspection date">{fmtDate(i.inspection_date)}</InfoRow>
                        <InfoRow label="Date opened">{fmtDate(item.date_open)}</InfoRow>
                        <InfoRow label="Date closed">{closed ? fmtDate(item.date_close) : '-'}</InfoRow>
                        <InfoRow label="Closed by">{closed ? (item.reviewer || '-') : '-'}</InfoRow>
                        <InfoRow label="Evaluation">
                            <span className={`text-base font-extrabold uppercase tracking-wide ${(EVAL[item.evaluation]?.badge || '').split(' ').find((c) => c.startsWith('text-')) || 'text-gray-600'}`}>
                                {EVAL[item.evaluation]?.label || item.evaluation || '-'}
                            </span>
                        </InfoRow>
                        {i.description && (
                            <div className="sm:col-span-2">
                                <InfoRow label="Inspector's finding"><span className="whitespace-pre-wrap">{i.description}</span></InfoRow>
                            </div>
                        )}
                    </div>
                    {i.photos?.length > 0 && (
                        <div className="mt-4 flex gap-2 overflow-x-auto">
                            {i.photos.map((p) => (
                                <a key={p} href={photoUrl(p)} target="_blank" rel="noreferrer" className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200">
                                    <img src={photoUrl(p)} alt="" className="h-full w-full object-cover" />
                                </a>
                            ))}
                        </div>
                    )}
                </SectionCard>

                {(item.subcon_response || item.state !== 'closed') && (
                    <SectionCard title={item.subcon_response ? 'Subcontractor reply' : 'Review'} icon={item.subcon_response ? MessageSquareReply : undefined}>
                        {item.subcon_response && (
                            <ul className="space-y-4">
                                <Comment
                                    name={item.responded_by || 'Subcontractor'}
                                    role="Subcontractor"
                                    when={item.responded_at ? fmtDate(item.responded_at, SENT_AT) : null}
                                    text={item.subcon_response}
                                />
                                {item.return_reason && (
                                    <Comment
                                        name={item.reviewer || 'Reviewer'}
                                        role="Returned by reviewer"
                                        text={item.return_reason}
                                        tone="red"
                                    />
                                )}
                            </ul>
                        )}
                        {item.state !== 'closed' && (
                            <div className={item.subcon_response ? 'mt-5 border-t border-gray-100 pt-4' : ''}>
                                <CaseActions item={item} />
                            </div>
                        )}
                    </SectionCard>
                )}
                <SectionCard title="Timeline" icon={CalendarDays}>
                    <ol>
                        {steps.map((s, n) => (
                            <Step key={s.label} index={n + 1} last={n === steps.length - 1} active={!s.done && !s.bad && n === firstOpen} {...s} />
                        ))}
                    </ol>
                </SectionCard>

                <SectionCard title="Related records" icon={Link2}>
                    <ul className="divide-y divide-gray-100">
                        <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900">Inspection</p>
                                <p className="text-xs text-gray-500">The inspection that raised this {isNc ? 'non-conformance' : 'client complaint'}</p>
                            </div>
                            <Link href={`/review/inspections/${i.id}`} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-ink-900 px-3.5 py-2 text-xs font-bold text-brand-400">
                                View <ChevronRight className="h-4 w-4" />
                            </Link>
                        </li>
                        {item.visit_key && (
                            <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900">Toolbox talk & inspection</p>
                                    <p className="text-xs text-gray-500">The whole visit this inspection belongs to</p>
                                </div>
                                <Link href={`/review/visits/${item.visit_key}`} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700">
                                    View <ChevronRight className="h-4 w-4" />
                                </Link>
                            </li>
                        )}
                    </ul>
                </SectionCard>
            </div>
        </ReviewLayout>
    );
}
