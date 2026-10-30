import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft, CalendarDays, Users, UserRound, CheckCircle2, XCircle, ListChecks, FolderKanban,
    ClipboardList, ChevronRight, Image as ImageIcon, X,
} from 'lucide-react';
import AppLayout from '@/Pages/WSIS/Layout';
import ReviewProgress from '@/Components/shared/ReviewProgress';
import PdfButton from '@/Components/shared/PdfButton';
import { spPercent } from '@/Components/shared/SpSampling';
import { EvalBadge, StatusBadge, SectionCard, InfoRow, fmtDate, storageUrl } from '@/Components/inspector/kit';

export default function ToolboxShow({ talk }) {
    const [lightbox, setLightbox] = useState(null);

    // sampled workers per subcontractor (the not-registered count is only stored as a total)
    const groups = Object.values(
        talk.attendees.reduce((acc, a) => {
            acc[a.company] = acc[a.company] || { name: a.company, sampled: 0 };
            acc[a.company].sampled += 1;
            return acc;
        }, {})
    );
    const photos = [
        talk.img_group && { src: storageUrl(talk.img_group), label: 'Group photo' },
        talk.img_attendance && { src: storageUrl(talk.img_attendance), label: 'Attendance sheet' },
    ].filter(Boolean);
    const sampled = Number(talk.sp_sampled) || 0;
    const notRegistered = Number(talk.sp_not_registered) || 0;

    return (
        <AppLayout title="Toolbox Talk Details">
            <Head title={talk.code || `Toolbox talk #${talk.id}`} />

            {lightbox && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
                    <button className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close">
                        <X className="h-6 w-6" />
                    </button>
                    <img src={lightbox} alt="Preview" className="max-h-full max-w-full rounded-2xl object-contain" />
                </div>
            )}

            <div className="mx-auto max-w-6xl space-y-5 pb-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href="/inspection#toolbox" className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white"><ArrowLeft className="h-4 w-4" /></span>
                        Back to toolbox talks
                    </Link>
                    {talk.status === 'approved' && <PdfButton href={`/pdf/toolbox/${talk.id}`} className="ml-auto mr-2" />}
                </div>

                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg sm:p-7">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">{talk.code || `Toolbox talk #${talk.id}`}</p>
                            <h1 className="mt-1 text-2xl font-extrabold leading-tight">{talk.project || '-'}</h1>
                            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-300">
                                <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-400" />{fmtDate(talk.date, { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                                <span className="flex items-center gap-1.5"><Users className="h-4 w-4 text-brand-400" />{talk.attended} participants</span>
                                <span className="flex items-center gap-1.5"><UserRound className="h-4 w-4 text-brand-400" />{talk.by || '-'}</span>
                            </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2 self-start">
                            <span className={`inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-bold uppercase ${talk.conducted ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                {talk.conducted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                                {talk.conducted ? 'Conducted' : 'Not conducted'}
                            </span>
                            <StatusBadge value={talk.status} className="bg-white" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <div className="space-y-5 lg:col-span-2">
                        <SectionCard title="Toolbox talk details" icon={FolderKanban}>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                <InfoRow label="Project">{talk.project}</InfoRow>
                                <InfoRow label="Conducted by">{talk.by}</InfoRow>
                                <InfoRow label="Date">{fmtDate(talk.date, { day: 'numeric', month: 'long', year: 'numeric' })}</InfoRow>
                                <InfoRow label="Total attended">{talk.attended}</InfoRow>
                            </div>
                        </SectionCard>

                        {talk.conducted && talk.categories.length > 0 && (
                            <SectionCard title="Toolbox category" icon={ListChecks}>
                                <div className="flex flex-wrap gap-2">
                                    {talk.categories.map((c) => (
                                        <span key={c} className="rounded-xl border border-brand-300 bg-brand-100 px-3 py-2 text-xs font-bold text-brand-900">{c}</span>
                                    ))}
                                </div>
                            </SectionCard>
                        )}

                        {sampled > 0 && (
                            <SectionCard title="Safety Passport sampling" icon={ListChecks}>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="rounded-2xl bg-gray-50 p-3"><p className="text-2xl font-extrabold text-gray-900">{sampled}</p><p className="text-[11px] text-gray-500">Sampled</p></div>
                                    <div className="rounded-2xl bg-gray-50 p-3"><p className="text-2xl font-extrabold text-gray-900">{notRegistered}</p><p className="text-[11px] text-gray-500">Not registered</p></div>
                                    <div className="rounded-2xl bg-ink-900 p-3"><p className="text-2xl font-extrabold text-brand-400">{spPercent(sampled, notRegistered)}%</p><p className="text-[11px] text-gray-300">SP compliance</p></div>
                                </div>
                                <p className="mt-3 text-center text-xs text-gray-500">({sampled} − {notRegistered}) ÷ {sampled} × 100</p>
                                {groups.length > 0 && (
                                    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100">
                                        <table className="min-w-full text-sm">
                                            <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                                <tr><th className="px-4 py-2.5">Subcontractor</th><th className="px-4 py-2.5 text-right">Workers sampled</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {groups.map((g) => (
                                                    <tr key={g.name}><td className="px-4 py-2.5 font-semibold text-gray-900">{g.name}</td><td className="px-4 py-2.5 text-right text-gray-700">{g.sampled}</td></tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </SectionCard>
                        )}

                        {talk.attendees.length > 0 && (
                            <SectionCard title={`Attendees (${talk.attendees.length})`} icon={Users}>
                                <ul className="divide-y divide-gray-100">
                                    {talk.attendees.map((a) => (
                                        <li key={a.id} className="flex items-center gap-3 py-2.5">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-extrabold text-brand-900">{(a.name || '?').charAt(0).toUpperCase()}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-gray-900">{a.name}</span>
                                                <span className="block truncate text-xs text-gray-500">{[a.role, a.company].filter(Boolean).join(' · ')}</span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </SectionCard>
                        )}

                        {photos.length > 0 && (
                            <SectionCard title="Site photos" icon={ImageIcon}>
                                <div className="grid grid-cols-2 gap-3">
                                    {photos.map((p) => (
                                        <div key={p.src}>
                                            <button onClick={() => setLightbox(p.src)} className="aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 transition active:scale-[0.98]">
                                                <img src={p.src} alt={p.label} className="h-full w-full object-cover" />
                                            </button>
                                            <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">{p.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </SectionCard>
                        )}
                    </div>

                    <div className="space-y-5">
                        <SectionCard title="Review progress" icon={ClipboardList}>
                            <ReviewProgress kind="visit" status={talk.status} />
                            <div className="mt-4 grid grid-cols-1 gap-4">
                                <InfoRow label="Verified by">{talk.verifier}</InfoRow>
                                <InfoRow label="Approved by">{talk.approver}</InfoRow>
                                {talk.review_comment && <InfoRow label="Comment">{talk.review_comment}</InfoRow>}
                            </div>
                        </SectionCard>

                        {talk.inspections.length > 0 && (
                            <SectionCard title={`Inspections in this visit (${talk.inspections.length})`} icon={ClipboardList}>
                                <ul className="divide-y divide-gray-100">
                                    {talk.inspections.map((i) => (
                                        <li key={i.id}>
                                            <Link href={`/inspections/${i.id}`} className="flex items-center justify-between gap-2 py-2.5">
                                                <span className="min-w-0">
                                                    <span className="block font-mono text-[11px] font-bold text-brand-800">{i.code}</span>
                                                    <span className="block truncate text-sm font-semibold text-gray-900">{i.topic || '-'}</span>
                                                </span>
                                                <span className="flex items-center gap-1"><EvalBadge value={i.evaluation} /><ChevronRight className="h-4 w-4 text-gray-400" /></span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </SectionCard>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
