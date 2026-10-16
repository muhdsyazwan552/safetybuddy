import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardCheck, CalendarDays } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import CaseCard from '@/Components/shared/CaseCard';
import { SectionCard, InfoRow, EvalBadge, fmtDate } from '@/Components/inspector/kit';
import { CaseActions } from './Cases';

function Step({ done, label, when, note }) {
    return (
        <li className="relative pl-7">
            <span className={`absolute left-0 top-1 h-4 w-4 rounded-full border-2 ${done ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300 bg-white'}`} />
            <p className={`text-sm font-bold ${done ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
            {when && <p className="text-xs text-gray-500">{when}</p>}
            {note && <p className="mt-0.5 text-xs text-gray-600">{note}</p>}
        </li>
    );
}

export default function CaseShow({ item }) {
    const isNc = item.type === 'nc';
    const i = item.inspection || {};
    const closed = item.state === 'closed';

    return (
        <ReviewLayout title={isNc ? 'Non-conformance' : 'Client complaint'}>
            <Head title={isNc ? 'Non-conformance' : 'Client complaint'} />
            <div className="mx-auto max-w-3xl space-y-5 px-4 pb-10 pt-5">
                <Link href="/review/cases" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500">
                    <ArrowLeft className="h-4 w-4" /> Back to cases
                </Link>

                <CaseCard item={item}>
                    <CaseActions item={item} />
                </CaseCard>

                <SectionCard title="Case details" icon={ClipboardCheck}>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <InfoRow label="Project">{i.project}</InfoRow>
                        <InfoRow label="Inspection topic">{i.topic}</InfoRow>
                        <InfoRow label="Subcontractor">{i.subcon}</InfoRow>
                        <InfoRow label="Raised by (inspector)">{i.inspector}</InfoRow>
                        <InfoRow label="Location">{i.location}</InfoRow>
                        <InfoRow label="Inspection date">{fmtDate(i.inspection_date)}</InfoRow>
                        <InfoRow label="Evaluation"><EvalBadge value={item.evaluation} /></InfoRow>
                        <InfoRow label="Closed by">{closed ? (item.reviewer || '-') : '-'}</InfoRow>
                    </div>
                </SectionCard>

                <SectionCard title="Timeline" icon={CalendarDays}>
                    <ol className="space-y-4 border-l-2 border-gray-100 pl-0">
                        <Step done label="Case opened" when={fmtDate(item.date_open)} note={`By inspector ${i.inspector || '-'}`} />
                        <Step
                            done={!!item.subcon_response}
                            label="Subcontractor replied"
                            when={item.responded_at ? fmtDate(item.responded_at) : 'Waiting for the leader'}
                            note={item.subcon_response}
                        />
                        {item.return_reason && (
                            <Step done label="Returned to the subcontractor" when={item.reviewer ? `By ${item.reviewer}` : ''} note={item.return_reason} />
                        )}
                        <Step
                            done={closed}
                            label="Approved and closed"
                            when={closed ? `${fmtDate(item.date_close)}${item.reviewer ? ` · ${item.reviewer}` : ''}` : 'Not closed yet'}
                            note={closed ? item.comment : null}
                        />
                    </ol>
                </SectionCard>

                <div className="flex flex-wrap gap-3 text-sm font-bold">
                    <Link href={`/review/inspections/${i.id}`} className="rounded-xl bg-ink-900 px-4 py-2.5 text-brand-400">Open the inspection</Link>
                    {item.visit_key && (
                        <Link href={`/review/visits/${item.visit_key}`} className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-700">Open the site visit</Link>
                    )}
                </div>
            </div>
        </ReviewLayout>
    );
}
