import ImageViewer from '@/Components/shared/ImageViewer';
import BackLink from '@/Components/shared/BackLink';
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ChevronRight, ClipboardCheck, Link2, MessageSquareReply } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import InspectorLayout from '@/Layouts/InspectorLayout';
import HeroMeta, { HeroStatus } from '@/Components/shared/HeroMeta';
import { caseStateOf } from '@/Components/shared/caseState';

const HERO_CASE_TONE = { open: 'text-amber-300', responded: 'text-sky-300', returned: 'text-rose-300', closed: 'text-emerald-400' };
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
export default function CaseShow({ item, inspector_view = false, user }) {
    const isNc = item.type === 'nc';
    const i = item.inspection || {};
    const closed = item.state === 'closed';
    const response = item.return_reason || (closed ? item.comment : null);
    const Layout = inspector_view ? InspectorLayout : ReviewLayout;
    const prefix = inspector_view ? '/inspector' : '/review';
    const inspectionHref = `${prefix}/inspections/${i.id}${inspector_view ? '?view=inspection' : ''}`;

    return (
        <Layout user={user} title={isNc ? 'Non-conformance' : 'Client complaint'}>
            <Head title={isNc ? 'Non-conformance' : 'Client complaint'} />
            <div className="mx-auto max-w-3xl space-y-5 px-4 pb-10 pt-5">
                <div className="flex items-center justify-between gap-3">
                    <BackLink href={inspector_view ? inspectionHref : '/review/cases'} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </BackLink>
                    <PdfButton href={`/pdf/case/${item.type}/${item.id}`} />
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
                            ['Case status', <span key="c" className={`font-extrabold uppercase tracking-wide ${HERO_CASE_TONE[item.state] || 'text-amber-300'}`}>{caseStateOf(item).label}</span>],
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
                                <ImageViewer key={p} src={photoUrl(p)} label="Inspection photo" className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200">
                                    <img src={photoUrl(p)} alt="" className="h-full w-full object-cover" />
                                </ImageViewer>
                            ))}
                        </div>
                    )}
                </SectionCard>

                <SectionCard title="Action from subcontractor" icon={MessageSquareReply}>
                        {item.subcon_response && (
                            <ul className="space-y-4">
                                <Comment
                                    name={item.responded_by || 'Subcontractor'}
                                    role="Subcontractor"
                                    when={item.responded_at ? fmtDate(item.responded_at, SENT_AT) : null}
                                    text={item.subcon_response}
                                />
                            </ul>
                        )}
                        {item.response_photo && (
                            <ImageViewer src={item.response_photo} label="Corrective action photo" className="mt-4 block w-fit">
                                <img src={item.response_photo} alt="Corrective action photo" className="max-h-48 rounded-xl border border-gray-200 object-contain" />
                            </ImageViewer>
                        )}
                        {!item.subcon_response && <p className="text-sm text-gray-500">No action submitted yet.</p>}
                </SectionCard>

                <SectionCard title="Response from Supervisor and Manager" icon={MessageSquareReply}>
                    <ul className="space-y-4">
                        {(item.verifier || item.verified_at) && (
                            <Comment name={item.verifier || 'Supervisor'} role="Supervisor verification" when={fmtDate(item.verified_at, SENT_AT)} text="Verified the linked inspection." />
                        )}
                        {(item.approver || item.approved_at) && (
                            <Comment name={item.approver || 'Manager'} role="Manager approval" when={fmtDate(item.approved_at, SENT_AT)} text="Approved the linked inspection." />
                        )}
                        {response && (
                            <Comment
                                name={item.reviewer || item.reviewer_role}
                                role={item.return_reason ? `${item.reviewer_role} · Returned for action` : item.reviewer_role}
                                when={closed && item.date_close ? fmtDate(item.date_close) : null}
                                text={response}
                                tone={item.return_reason ? 'red' : undefined}
                            />
                        )}
                    </ul>
                    {!closed && !inspector_view && <div className="mt-4"><CaseActions item={item} /></div>}
                </SectionCard>
                <SectionCard title="Related records" icon={Link2}>
                    <ul className="divide-y divide-gray-100">
                        <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-gray-900">Inspection</p>
                                <p className="text-xs text-gray-500">The inspection that raised this {isNc ? 'non-conformance' : 'client complaint'}</p>
                            </div>
                            <Link href={inspectionHref} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-ink-900 px-3.5 py-2 text-xs font-bold text-brand-400">
                                View <ChevronRight className="h-4 w-4" />
                            </Link>
                        </li>
                        {item.visit_key && (
                            <li className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900">Toolbox talk & inspection</p>
                                    <p className="text-xs text-gray-500">The whole visit this inspection belongs to</p>
                                </div>
                                <Link href={`${prefix}/visits/${item.visit_key}`} className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700">
                                    View <ChevronRight className="h-4 w-4" />
                                </Link>
                            </li>
                        )}
                    </ul>
                </SectionCard>
            </div>
        </Layout>
    );
}
