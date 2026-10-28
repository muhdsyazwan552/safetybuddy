// One site visit of the inspector, laid out to be read top to bottom:
// where it stands in review -> what needs fixing -> toolbox talk -> inspections.
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    CalendarDays, UserRound, HardHat, ClipboardCheck, MapPin, Building2, Pencil, Check, X, Users,
    AlertTriangle, CheckCircle2, Clock, ShieldCheck, Image as ImageIcon,
} from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import ReviewProgress from '@/Components/shared/ReviewProgress';
import { EVAL, EvalBadge, StatusBadge, fmtDate } from '@/Components/inspector/kit';

const EDITABLE = ['pending_verification', 'rejected'];

// what each overall status means for the inspector, in plain words
const MEANING = {
    pending_verification: { title: 'Waiting for verification', text: 'Submitted. A supervisor will check it next.', icon: Clock, cls: 'bg-amber-50 text-amber-800 border-amber-200' },
    verified: { title: 'Verified, waiting for approval', text: 'The supervisor checked it. A manager will approve it next.', icon: ShieldCheck, cls: 'bg-blue-50 text-blue-800 border-blue-200' },
    approved: { title: 'Approved', text: 'This visit is complete. Nothing else to do.', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    rejected: { title: 'Returned to you', text: 'Fix the items below and save them again.', icon: AlertTriangle, cls: 'bg-red-50 text-red-800 border-red-200' },
};

export default function VisitShow({ visit, me = null, user }) {
    const t = visit.talk;
    // only the inspector who recorded an item may change it, and only before it is verified / approved
    const isMine = (x) => !!x && me !== null && Number(x.by_id) === Number(me);
    const canEdit = (x) => isMine(x) && EDITABLE.includes(x.status);
    const ownVisit = isMine(visit);
    const inspections = visit.inspections || [];
    const editableItems = [
        ...(t && canEdit(t) ? [{ key: 'talk', label: 'Edit toolbox talk', href: `/inspector/toolbox-talks/${t.id}/edit` }] : []),
        ...inspections.flatMap((i, index) => canEdit(i) ? [{
            key: `inspection-${i.id}`, label: `Edit inspection ${index + 1}`, href: `/inspector/inspections/${i.id}/edit`,
        }] : []),
    ];
    const meaning = { ...(MEANING[visit.status] || MEANING.pending_verification) };
    if (visit.status === 'rejected' && !ownVisit) {
        meaning.title = `Returned to ${visit.by || 'the inspector'}`;
        meaning.text = 'The inspector who recorded it will fix and resubmit.';
    }
    const issues = inspections.filter((i) => ['nonconformance', 'clientcomplaint'].includes(i.evaluation)).length;

    const returned = [
        ...(t && t.status === 'rejected' && isMine(t) ? [{ key: 'talk', label: 'Toolbox talk', reason: t.review_comment, edit: `/inspector/toolbox-talks/${t.id}/edit` }] : []),
        ...inspections.filter((i) => i.status === 'rejected' && isMine(i)).map((i) => ({
            key: `i${i.id}`, label: i.topic || 'Inspection', reason: i.review_comment, edit: `/inspector/inspections/${i.id}/edit`,
        })),
    ];

    return (
        <InspectorLayout user={user}>
            <Head title="Site visit" />

            <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10 pt-5 sm:px-6">
                {/* What / where / when */}
                <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Site visit</p>
                    <h1 className="mt-1 break-words text-xl font-extrabold leading-tight sm:text-2xl">{visit.project || '-'}</h1>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-300">
                        <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-400" />{fmtDate(visit.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="flex items-center gap-1.5"><UserRound className="h-4 w-4 text-brand-400" />{visit.by || '-'}</span>
                    </div>
                </div>

                {!ownVisit && (
                    <p className="flex items-start gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <span>Recorded by <b className="text-gray-900">{visit.by || 'another inspector'}</b>. You can view it; only the items you recorded yourself can be edited.</span>
                    </p>
                )}

                {/* Where it stands */}
                <section className={`rounded-3xl border p-4 ${meaning.cls}`}>
                    <div className="flex items-start gap-3">
                        <meaning.icon className="mt-0.5 h-6 w-6 shrink-0" />
                        <div className="min-w-0">
                            <p className="text-base font-extrabold">{meaning.title}</p>
                            <p className="text-sm opacity-90">{meaning.text}</p>
                        </div>
                    </div>
                </section>

                <ReviewProgress kind="visit" status={visit.status} />

                {editableItems.length > 0 && (
                    <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                        <h2 className="text-sm font-extrabold text-gray-900">Edit site visit</h2>
                        <p className="mt-1 text-xs text-gray-500">Choose the part you want to update.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {editableItems.map((item) => (
                                <Link key={item.key} href={item.href} className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-3 py-2 text-xs font-bold text-white hover:bg-ink-700">
                                    <Pencil className="h-3.5 w-3.5" /> {item.label}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* What needs fixing */}
                {returned.length > 0 && (
                    <section className="rounded-3xl border border-red-200 bg-white p-4 shadow-sm">
                        <p className="flex items-center gap-2 text-sm font-extrabold text-red-700"><AlertTriangle className="h-4 w-4" /> Needs fixing ({returned.length})</p>
                        <ul className="mt-3 space-y-2">
                            {returned.map((r) => (
                                <li key={r.key} className="flex items-start gap-3 rounded-2xl bg-red-50 p-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900">{r.label}</p>
                                        <p className="mt-0.5 text-sm text-red-700">{r.reason || 'No reason given.'}</p>
                                    </div>
                                    <Link href={r.edit} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white active:scale-95">
                                        <Pencil className="h-3.5 w-3.5" /> Fix
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {/* At a glance */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Glance icon={HardHat} label="Toolbox talk" value={!t ? 'None' : t.conducted ? 'Done' : 'Not done'} tone={!t ? 'muted' : t.conducted ? 'ok' : 'bad'} />
                    <Glance icon={Users} label="Workers present" value={t ? t.attended : '-'} />
                    <Glance icon={ClipboardCheck} label="Inspections" value={inspections.length} />
                    <Glance icon={AlertTriangle} label="NC / CC found" value={issues} tone={issues ? 'bad' : 'ok'} />
                </div>

                {/* Step 1 - toolbox talk */}
                <Section step="1" title="Toolbox talk" icon={HardHat} right={t && <StatusBadge value={t.status} />}>
                    {!t ? (
                        <p className="text-sm text-gray-500">No toolbox talk was recorded for this visit.</p>
                    ) : (
                        <div className="space-y-4">
                            <Row label="Conducted">
                                {t.conducted
                                    ? <span className="inline-flex items-center gap-1 font-bold text-emerald-700"><Check className="h-4 w-4" /> Yes</span>
                                    : <span className="inline-flex items-center gap-1 font-bold text-red-700"><X className="h-4 w-4" /> No</span>}
                            </Row>
                            <Row label="Workers present">{t.attended}</Row>

                            {t.conducted && (
                                <Row label="Topics covered">
                                    {t.categories.length ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {t.categories.map((c) => <span key={c} className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-900">{c}</span>)}
                                        </div>
                                    ) : '-'}
                                </Row>
                            )}

                            {!t.conducted && t.sp_sampled !== null && (
                                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-50 p-3 text-center">
                                    <Num label="Workers checked" value={t.sp_sampled} />
                                    <Num label="No SP card" value={t.sp_not_registered} bad={t.sp_not_registered > 0} />
                                    <Num label="SP compliance" value={`${t.sp_compliance ?? '-'}%`} bad={t.sp_compliance < 80} good={t.sp_compliance >= 80} />
                                </div>
                            )}

                            {t.attendees?.length > 0 && (
                                <Row label={`Attendance (${t.attendees.length})`}>
                                    <div className="flex flex-wrap gap-1.5">
                                        {t.attendees.map((n) => <span key={n} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">{n}</span>)}
                                    </div>
                                </Row>
                            )}

                            {(t.img_group || t.img_attendance) && (
                                <div className="grid grid-cols-2 gap-3">
                                    {[['Group photo', t.img_group], ['Attendance sheet', t.img_attendance]].map(([label, src]) => src && (
                                        <a key={label} href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-2xl border border-gray-200">
                                            <img src={src} alt={label} className="aspect-video w-full object-cover" />
                                            <p className="bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">{label}</p>
                                        </a>
                                    ))}
                                </div>
                            )}

                            {canEdit(t) && (
                                <Link href={`/inspector/toolbox-talks/${t.id}/edit`} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                                    <Pencil className="h-3.5 w-3.5" /> Edit toolbox talk
                                </Link>
                            )}
                        </div>
                    )}
                </Section>

                {/* Step 2 - inspections */}
                <Section step="2" title={`Inspections (${inspections.length})`} icon={ClipboardCheck}>
                    {inspections.length === 0 ? (
                        <p className="text-sm text-gray-500">No inspection was recorded for this visit.</p>
                    ) : (
                        <div className="space-y-3">
                            {inspections.map((i, n) => (
                                <article key={i.id} className="overflow-hidden rounded-2xl border border-gray-100">
                                    <div className="flex">
                                        <span className="w-1.5 shrink-0" style={{ background: EVAL[i.evaluation]?.color || '#9ca3af' }} />
                                        <div className="min-w-0 flex-1 p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <p className="min-w-0 text-[15px] font-bold text-gray-900">
                                                    <span className="mr-1.5 text-gray-400">#{n + 1}</span>{i.topic || '-'}
                                                    {!ownVisit && isMine(i) && <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 align-middle text-[10px] font-bold text-brand-900">Yours</span>}
                                                </p>
                                                <EvalBadge value={i.evaluation} />
                                            </div>

                                            <div className="mt-2 grid gap-1 text-sm text-gray-600 sm:grid-cols-2">
                                                <span className="flex min-w-0 items-center gap-1.5"><MapPin className="h-4 w-4 shrink-0 text-gray-400" /><span className="truncate">{i.location || 'No location'}</span></span>
                                                <span className="flex min-w-0 items-center gap-1.5"><Building2 className="h-4 w-4 shrink-0 text-gray-400" /><span className="truncate">{i.subcon || 'Main company'}</span></span>
                                            </div>

                                            {i.description && (
                                                <p className="mt-3 whitespace-pre-wrap rounded-xl bg-gray-50 p-3 text-sm text-gray-700">{i.description}</p>
                                            )}

                                            {i.photos?.length > 0 ? (
                                                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                                                    {i.photos.map((p) => (
                                                        <a key={p} href={p} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-xl border border-gray-200">
                                                            <img src={p} alt="" className="h-full w-full object-cover" />
                                                        </a>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400"><ImageIcon className="h-3.5 w-3.5" /> No photo</p>
                                            )}

                                            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
                                                <StatusBadge value={i.status} />
                                                {i.verifier && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600"><Check className="h-3 w-3" />Verified by {i.verifier}</span>}
                                                {i.approver && <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600"><Check className="h-3 w-3" />Approved by {i.approver}</span>}
                                                <div className="ml-auto flex gap-2">
                                                    {canEdit(i) && (
                                                        <Link href={`/inspector/inspections/${i.id}/edit`} className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50">
                                                            <Pencil className="h-3.5 w-3.5" /> Edit
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                            {i.status === 'rejected' && i.review_comment && (
                                                <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">Returned: {i.review_comment}</p>
                                            )}
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </Section>

                <Link href="/inspector/visits" className="block rounded-2xl border border-gray-200 bg-white py-3 text-center text-sm font-bold text-gray-700 hover:bg-gray-50">
                    Back to my site visits
                </Link>
            </div>
        </InspectorLayout>
    );
}

function Section({ step, title, icon: Icon, right = null, children }) {
    return (
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-extrabold text-brand-400">{step}</span>
                <p className="flex min-w-0 flex-1 items-center gap-2 text-sm font-extrabold text-gray-900"><Icon className="h-4 w-4 shrink-0 text-gray-400" /> {title}</p>
                {right}
            </div>
            <div className="p-4">{children}</div>
        </section>
    );
}

function Row({ label, children }) {
    return (
        <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 sm:pt-0.5">{label}</p>
            <div className="min-w-0 text-[15px] text-gray-900">{children}</div>
        </div>
    );
}

function Glance({ icon: Icon, label, value, tone = 'default' }) {
    const tones = {
        default: 'border-gray-100 bg-white text-gray-900',
        ok: 'border-emerald-100 bg-emerald-50 text-emerald-700',
        bad: 'border-red-100 bg-red-50 text-red-700',
        muted: 'border-gray-100 bg-gray-50 text-gray-500',
    };
    return (
        <div className={`min-w-0 rounded-2xl border p-3 shadow-sm ${tones[tone]}`}>
            <Icon className="h-4 w-4 opacity-60" />
            <p className="mt-1.5 truncate text-xl font-extrabold leading-none">{value}</p>
            <p className="mt-1 truncate text-[11px] font-semibold text-gray-500">{label}</p>
        </div>
    );
}

function Num({ label, value, good = false, bad = false }) {
    return (
        <div className="min-w-0">
            <p className={`text-lg font-extrabold ${bad ? 'text-red-600' : good ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</p>
            <p className="text-[11px] leading-tight text-gray-500">{label}</p>
        </div>
    );
}
