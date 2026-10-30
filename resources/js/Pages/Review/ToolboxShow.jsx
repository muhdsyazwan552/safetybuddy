import React from 'react';
import ReviewProgress from '@/Components/shared/ReviewProgress';
import { Head, Link } from '@inertiajs/react';
import HeroMeta, { HeroStatus } from '@/Components/shared/HeroMeta';
import { ArrowLeft, FolderKanban, Users, ListChecks, Calculator, Image as ImageIcon } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import { SectionCard, InfoRow, fmtDate } from '@/Components/inspector/kit';
import PdfButton from '@/Components/shared/PdfButton';

const pctOf = (sampled, notReg) => (sampled > 0 ? Math.round(((sampled - notReg) / sampled) * 10000) / 100 : null);

// The page content, shared with the inspector's toolbox talk page
export function ToolboxDetail({ talk: t, backHref = null, children }) {
    const sampled = Number(t.sp_sampled) || 0;
    const notReg = Number(t.sp_not_registered) || 0;
    const registered = Math.max(0, sampled - notReg);
    const pct = pctOf(sampled, notReg);
    const good = pct !== null && pct >= 80;

    return (
            <div className="mx-auto max-w-3xl space-y-5 px-4 pb-10 pt-5">
                <div className="flex items-center justify-between gap-3">
                    <Link href={backHref || `/review/visits/talk-${t.id}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500">
                        <ArrowLeft className="h-4 w-4" /> Back to toolbox talk & inspection
                    </Link>
                    {t.status === 'approved' && <PdfButton href={`/pdf/toolbox/${t.id}`} />}
                </div>

                <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">{t.series_code || `Toolbox talk #${t.id}`}</p>
                        <h1 className="mt-1 text-xl font-extrabold leading-tight">Toolbox talk</h1>
                        <HeroMeta rows={[
                            ['Project', t.project || '-'],
                            ['Date', fmtDate(t.date)],
                            ['Status', <HeroStatus key="s" value={t.status} />],
                        ]} />
                    </div>
                </div>

                <ReviewProgress kind="visit" status={t.status} />

                <SectionCard title="Details" icon={FolderKanban}>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <InfoRow label="Project">{t.project}</InfoRow>
                        <InfoRow label="Date">{fmtDate(t.date)}</InfoRow>
                        <InfoRow label="Conducted by">{t.by}</InfoRow>
                        <InfoRow label="Toolbox talk">
                            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${t.conducted ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                {t.conducted ? 'Conducted' : 'Not conducted'}
                            </span>
                        </InfoRow>
                        <InfoRow label="Attendees">{t.attended} present</InfoRow>
                        {t.conducted && <InfoRow label="Categories">{t.categories.length ? t.categories.join(', ') : '-'}</InfoRow>}
                        <InfoRow label="Verified by">{t.verifier ? `${t.verifier} · ${t.verified_at || ''}` : '-'}</InfoRow>
                        <InfoRow label="Approved by">{t.approver ? `${t.approver} · ${t.approved_at || ''}` : '-'}</InfoRow>
                    </div>
                    {t.status === 'rejected' && t.review_comment && (
                        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Returned: {t.review_comment}</p>
                    )}
                </SectionCard>

                {sampled > 0 && (
                    <SectionCard title="Safety Passport sampling" icon={ListChecks}>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="rounded-2xl bg-gray-50 p-3"><p className="text-2xl font-extrabold text-gray-900">{sampled}</p><p className="text-[11px] text-gray-500">Sampled</p></div>
                            <div className="rounded-2xl bg-gray-50 p-3"><p className="text-2xl font-extrabold text-gray-900">{notReg}</p><p className="text-[11px] text-gray-500">Not registered</p></div>
                            <div className="rounded-2xl bg-ink-900 p-3"><p className="text-2xl font-extrabold text-brand-400">{pct ?? '-'}%</p><p className="text-[11px] text-gray-300">SP compliance</p></div>
                        </div>

                        {t.sp_companies?.length > 0 && (
                            <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                        <tr><th className="px-3 py-2">Company</th><th className="px-3 py-2 text-right">Sampled</th><th className="px-3 py-2 text-right">Not registered</th><th className="px-3 py-2 text-right">Compliance</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {t.sp_companies.map((c, i) => (
                                            <tr key={i}>
                                                <td className="px-3 py-2 font-semibold text-gray-900">{c.company}</td>
                                                <td className="px-3 py-2 text-right">{c.sampled}</td>
                                                <td className="px-3 py-2 text-right">{c.not_registered}</td>
                                                <td className="px-3 py-2 text-right font-semibold">{pctOf(c.sampled, c.not_registered) ?? '-'}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </SectionCard>
                )}

                {sampled > 0 && (
                    <SectionCard title="Calculation" icon={Calculator}>
                        <div className="space-y-2 text-sm text-gray-700">
                            <p>Registered = Sampled − Not registered = {sampled} − {notReg} = <b>{registered}</b></p>
                            <p>SP compliance = Registered ÷ Sampled × 100 = {registered} ÷ {sampled} × 100 = <b className={good ? 'text-emerald-600' : 'text-red-600'}>{pct ?? '-'}%</b></p>
                            <p className="text-xs text-gray-500">Target: 80% or higher. {good ? 'Target met.' : 'Below target.'}</p>
                        </div>
                    </SectionCard>
                )}

                {t.attendees?.length > 0 && (
                    <SectionCard title={`Attendees (${t.attendees.length})`} icon={Users}>
                        <ul className="divide-y divide-gray-100">
                            {t.attendees.map((a) => (
                                <li key={a.id} className="flex items-center gap-3 py-2.5">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-sm font-extrabold text-brand-900">
                                        {(a.name || '?').charAt(0).toUpperCase()}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-gray-900">{a.name}</span>
                                        {a.role && <span className="block truncate text-xs text-gray-500">{a.role}</span>}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </SectionCard>
                )}

                {(t.img_group || t.img_attendance) && (
                    <SectionCard title="Photos" icon={ImageIcon}>
                        <div className="grid grid-cols-2 gap-3">
                            {[['Group photo', t.img_group], ['Attendance sheet', t.img_attendance]].map(([label, src]) => src && (
                                <a key={label} href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-gray-200">
                                    <img src={src} alt={label} className="aspect-video w-full object-cover" />
                                    <p className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">{label}</p>
                                </a>
                            ))}
                        </div>
                    </SectionCard>
                )}
                {children}
            </div>
    );
}

export default function ToolboxShow({ talk }) {
    return (
        <ReviewLayout title="Toolbox talk">
            <Head title={`Toolbox talk ${talk.series_code || `#${talk.id}`}`} />
            <ToolboxDetail talk={talk} />
        </ReviewLayout>
    );
}