// resources/js/Pages/Inspector/ProjectDetails.jsx
import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    MapPin, CalendarDays, ClipboardCheck, HardHat, AlertTriangle, Users, Building2, Phone, Mail,
    ChevronRight, UserRound, Plus, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { EVAL, EVAL_ORDER, EvalBadge, EmptyState, SectionCard, InfoRow, fmtDate } from '@/Components/inspector/kit';
import { statusMeta, timelineProgress, daysLeft } from '@/Components/inspector/projectUtils';

const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'team', label: 'Team' },
    { key: 'subcons', label: 'Subcons' },
    { key: 'inspections', label: 'Inspections' },
    { key: 'talks', label: 'Talks' },
];

function Stat({ icon: Icon, label, value, tone = 'default' }) {
    const tones = {
        default: 'bg-white',
        danger: 'bg-red-50 border-red-100',
    };
    return (
        <div className={`rounded-2xl border border-gray-100 p-3.5 shadow-sm ${tones[tone]}`}>
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
                <Icon className={`h-4 w-4 ${tone === 'danger' ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            <p className={`mt-1.5 text-2xl font-extrabold leading-none ${tone === 'danger' ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        </div>
    );
}

function ContactLine({ icon: Icon, value, href }) {
    if (!value) return null;
    return (
        <a href={href} className="flex items-center gap-2 truncate text-xs text-gray-600 hover:text-gray-900">
            <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" /> <span className="truncate">{value}</span>
        </a>
    );
}

export default function ProjectDetails({
    project, myRole, stats = {}, evaluation = {}, team = [], subcons = [], recentInspections = [], recentTalks = [], user,
}) {
    const [tab, setTab] = useState('overview');
    const st = statusMeta(project.status);
    const prog = timelineProgress(project.start_date, project.end_date);
    const left = daysLeft(project.end_date);
    const evalTotal = EVAL_ORDER.reduce((s, k) => s + (evaluation[k] || 0), 0);

    return (
        <InspectorLayout user={user}>
            <Head title={`Project: ${project.name}`} />

            <div className="mx-auto max-w-4xl space-y-4 px-4 pb-10 pt-5 sm:px-6">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-2xl" />
                    <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Project #{project.id}</p>
                                <h1 className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">{project.name}</h1>
                                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-300">
                                    <MapPin className="h-4 w-4 shrink-0 text-brand-400" /> {project.location || '-'}
                                </p>
                            </div>
                            <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${st.cls}`}>{st.label}</span>
                        </div>

                        {myRole && (
                            <p className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-brand-400">
                                <UserRound className="h-3.5 w-3.5" /> Your role: {myRole}
                            </p>
                        )}

                        <div className="mt-4">
                            <div className="mb-1.5 flex items-center justify-between text-xs text-gray-300">
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-brand-400" />
                                    {fmtDate(project.start_date)} → {fmtDate(project.end_date)}
                                </span>
                                {left !== null && (
                                    <span className={`font-bold ${left < 0 ? 'text-red-400' : 'text-brand-400'}`}>
                                        {left < 0 ? `${Math.abs(left)} days overdue` : left === 0 ? 'Ends today' : `${left} days left`}
                                    </span>
                                )}
                            </div>
                            {prog !== null && (
                                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${prog}%` }} />
                                </div>
                            )}
                        </div>

                        <div className="mt-5 flex gap-2">
                            <Link href="/inspector/inspections/create" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-extrabold text-ink-900 active:scale-95 transition">
                                <Plus className="h-4 w-4" strokeWidth={3} /> Inspection
                            </Link>
                            <Link href="/inspector/toolbox-talks/create" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-bold text-white active:scale-95 transition">
                                <HardHat className="h-4 w-4 text-brand-400" /> Toolbox talk
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat icon={ClipboardCheck} label="Inspections" value={stats.total_inspections ?? 0} />
                    <Stat icon={AlertTriangle} label="Open issues" value={stats.open_issues ?? 0} tone={stats.open_issues ? 'danger' : 'default'} />
                    <Stat icon={HardHat} label="Talks" value={`${stats.conducted_talks ?? 0}/${stats.toolbox_talks ?? 0}`} />
                    <Stat icon={Users} label="Team" value={(stats.team ?? 0) + (stats.subcons ?? 0)} />
                </div>

                {/* Tabs */}
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sb-scroll sm:mx-0 sm:px-0">
                    {TABS.map((t) => (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${tab === t.key ? 'bg-ink-900 text-brand-400' : 'border border-gray-200 bg-white text-gray-600'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Overview */}
                {tab === 'overview' && (
                    <div className="space-y-4">
                        <SectionCard title="Evaluation breakdown" icon={ClipboardCheck}>
                            {evalTotal === 0 ? (
                                <p className="text-sm text-gray-400">No inspections recorded yet.</p>
                            ) : (
                                <>
                                    <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
                                        {EVAL_ORDER.map((k) => evaluation[k] ? (
                                            <div key={k} style={{ width: `${(evaluation[k] / evalTotal) * 100}%`, background: EVAL[k].color }} title={`${EVAL[k].label}: ${evaluation[k]}`} />
                                        ) : null)}
                                    </div>
                                    <ul className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                        {EVAL_ORDER.map((k) => (
                                            <li key={k} className="flex items-center gap-3 text-sm">
                                                <span className="h-2.5 w-2.5 rounded-full" style={{ background: EVAL[k].color }} />
                                                <span className="flex-1 text-gray-700">{EVAL[k].label}</span>
                                                <span className="font-bold text-gray-900">{evaluation[k] || 0}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </SectionCard>

                        <SectionCard title="Project info" icon={Building2}>
                            <div className="grid grid-cols-2 gap-5">
                                <InfoRow label="Start date">{fmtDate(project.start_date)}</InfoRow>
                                <InfoRow label="End date">{fmtDate(project.end_date)}</InfoRow>
                                <InfoRow label="Location">{project.location}</InfoRow>
                                <InfoRow label="Status">{st.label}</InfoRow>
                            </div>
                        </SectionCard>
                    </div>
                )}

                {/* Team */}
                {tab === 'team' && (
                    team.length === 0 ? <EmptyState title="No team assigned" /> : (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {team.map((m) => (
                                <div key={m.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-base font-extrabold text-brand-400">
                                            {(m.name || '?').charAt(0).toUpperCase()}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-gray-900">
                                                {m.name} {m.is_me && <span className="ml-1 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-extrabold text-ink-900">You</span>}
                                            </p>
                                            <p className="truncate text-xs font-semibold text-brand-800">{m.role || 'Team member'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1.5">
                                        <ContactLine icon={Phone} value={m.contact} href={`tel:${m.contact}`} />
                                        <ContactLine icon={Mail} value={m.email} href={`mailto:${m.email}`} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Subcontractors */}
                {tab === 'subcons' && (
                    subcons.length === 0 ? <EmptyState title="No subcontractors assigned" /> : (
                        <div className="space-y-3">
                            {subcons.map((c) => (
                                <div key={c.id} className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-[15px] font-extrabold text-gray-900">{c.name}</p>
                                            {c.scope && <p className="mt-0.5 text-xs font-semibold text-brand-800">Scope: {c.scope}</p>}
                                        </div>
                                        <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-700">
                                            {c.inspections} inspection{c.inspections === 1 ? '' : 's'}
                                        </span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
                                        <ContactLine icon={Phone} value={c.contact} href={`tel:${c.contact}`} />
                                        <ContactLine icon={Mail} value={c.email} href={`mailto:${c.email}`} />
                                    </div>

                                    {c.staff.length > 0 && (
                                        <div className="mt-4 border-t border-gray-100 pt-3">
                                            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Assigned staff ({c.staff.length})</p>
                                            <ul className="space-y-2">
                                                {c.staff.map((s) => (
                                                    <li key={s.id} className="flex items-center gap-3 text-sm">
                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-xs font-extrabold text-brand-900">
                                                            {(s.name || '?').charAt(0).toUpperCase()}
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate font-semibold text-gray-800">{s.name}</span>
                                                            {s.role && <span className="block truncate text-xs text-gray-500">{s.role}</span>}
                                                        </span>
                                                        {s.contact && (
                                                            <a href={`tel:${s.contact}`} className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-600" aria-label="Call">
                                                                <Phone className="h-4 w-4" />
                                                            </a>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Inspections */}
                {tab === 'inspections' && (
                    recentInspections.length === 0 ? (
                        <EmptyState title="No inspections yet" action={<Link href="/inspector/inspections/create" className="rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-ink-900">New inspection</Link>} />
                    ) : (
                        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                            <div className="divide-y divide-gray-100">
                                {recentInspections.map((i) => (
                                    <Link key={i.id} href={`/inspector/inspections/${i.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-gray-50 active:bg-gray-50">
                                        <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: EVAL[i.evaluation]?.color || '#9ca3af' }} />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-gray-900">{i.topic}</p>
                                            <p className="truncate text-xs text-gray-500">{i.subcon_name} · {fmtDate(i.inspection_date)}</p>
                                            {i.location && <p className="truncate text-[11px] text-gray-400">{i.location}</p>}
                                        </div>
                                        <EvalBadge value={i.evaluation} className="shrink-0" />
                                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                                    </Link>
                                ))}
                            </div>
                            <Link href={`/inspector/inspections?project_id=${project.id}`} className="block border-t border-gray-100 bg-gray-50 py-3 text-center text-xs font-bold text-brand-800">
                                View all inspections for this project
                            </Link>
                        </div>
                    )
                )}

                {/* Talks */}
                {tab === 'talks' && (
                    recentTalks.length === 0 ? (
                        <EmptyState title="No toolbox talks yet" action={<Link href="/inspector/toolbox-talks/create" className="rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-ink-900">New toolbox talk</Link>} />
                    ) : (
                        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                            <div className="divide-y divide-gray-100">
                                {recentTalks.map((t) => {
                                    const done = t.conducted === 'yes';
                                    return (
                                        <Link key={t.id} href={`/inspector/toolbox-talks/detail/${t.id}`} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-gray-50 active:bg-gray-50">
                                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${done ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                                {done ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-gray-900">{fmtDate(t.inspection_date)}</p>
                                                <p className="truncate text-xs text-gray-500">{t.conducted_by || '-'} · {t.total_attended ?? 0} attended</p>
                                            </div>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                                        </Link>
                                    );
                                })}
                            </div>
                            <Link href={`/inspector/toolbox-talks?project_id=${project.id}`} className="block border-t border-gray-100 bg-gray-50 py-3 text-center text-xs font-bold text-brand-800">
                                View all talks for this project
                            </Link>
                        </div>
                    )
                )}
            </div>
        </InspectorLayout>
    );
}
