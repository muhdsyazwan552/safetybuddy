import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ClipboardCheck, AlertTriangle, Siren, BarChart3, BadgeCheck, Wallet, ChevronRight, CheckCircle2, Sun, CalendarDays, ArrowUpRight,
} from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import { StatusBadge } from '@/Components/inspector/kit';
import { incidentTone } from './Incidents';

const rm = (v) => `RM${Number(v || 0).toLocaleString('en-MY', { maximumFractionDigits: 2 })}`;
const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const TONES = {
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    sky: 'border-sky-200 bg-amber-50 text-sky-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
};

function ActionTile({ icon: Icon, label, hint, value, href, tone }) {
    const urgent = value > 0;
    return (
        <Link
            href={href}
            className={`group flex flex-col gap-2 rounded-2xl border p-3.5 shadow-sm transition active:scale-[0.97] sm:flex-row sm:items-center sm:gap-3 sm:p-4 ${urgent ? TONES[tone] : 'border-gray-100 bg-white text-gray-400'}`}
        >
            <span className="flex items-center justify-between sm:block">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${urgent ? 'bg-white/70' : 'bg-gray-100'}`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className={`text-3xl font-extrabold leading-none sm:hidden ${urgent ? 'text-gray-900' : 'text-gray-300'}`}>{value}</span>
            </span>
            <span className="min-w-0 flex-1">
                <span className={`hidden text-3xl font-extrabold leading-none sm:block ${urgent ? 'text-gray-900' : 'text-gray-300'}`}>{value}</span>
                <span className={`block text-[13px] font-bold leading-tight sm:mt-1 sm:truncate sm:text-sm ${urgent ? 'text-gray-800' : 'text-gray-400'}`}>{label}</span>
                {hint && <span className="mt-0.5 hidden truncate text-xs opacity-70 sm:block">{hint}</span>}
            </span>
            <ChevronRight className="hidden h-5 w-5 shrink-0 opacity-40 transition group-hover:translate-x-0.5 sm:block" />
        </Link>
    );
}

function Section({ title, href, linkLabel = 'See all', children }) {
    return (
        <section className="min-w-0 space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-700">{title}</h2>
                {href && <Link href={href} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700">{linkLabel} <ArrowUpRight className="h-3.5 w-3.5" /></Link>}
            </div>
            {children}
        </section>
    );
}

const Empty = ({ text }) => (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-5 text-sm text-gray-500">
        <CheckCircle2 className="h-5 w-5 text-emerald-500" /> {text}
    </div>
);

export default function Dashboard({ counts, queue = [], cases = [], incidents = [], performance, today, is_manager }) {
    const user = usePage().props.auth?.user;
    const first = (user?.name || '').split(' ')[0];
    const need =
        counts.visits_verify + (is_manager ? counts.visits_approve : 0) + counts.cases_review + counts.incidents_new
        + counts.monthly_verify + (is_manager ? counts.monthly_approve + counts.penalties_pending : 0);

    const rankTone = { GOLD: 'bg-amber-500', SILVER: 'bg-slate-400', BRONZE: 'bg-orange-600' };
    const month = new Date(`${performance.period}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    return (
        <ReviewLayout title="Home">
            <Head title="Home" />
            <div className="mx-auto w-full min-w-0 max-w-6xl space-y-5 overflow-x-hidden px-3 pb-12 pt-4 sm:space-y-6 sm:px-4 sm:pt-5">
                {/* hello + the one number that matters */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-4 text-white shadow-lg sm:p-7">
                    <div className="pointer-events-none absolute -right-10 -top-12 h-52 w-52 rounded-full bg-brand-500/20 blur-3xl" />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-400"><Sun className="h-4 w-4" /> {greeting()}</p>
                            <h1 className="mt-1 text-xl font-extrabold sm:text-3xl">{first || 'Welcome'}</h1>
                            <p className="mt-1 flex items-center gap-2 text-xs text-gray-300 sm:text-sm">
                                <CalendarDays className="h-4 w-4" />
                                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:flex">
                            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur sm:px-5">
                                <p className="text-3xl font-extrabold text-brand-400">{need}</p>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-300">Need your action</p>
                            </div>
                            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur sm:px-5">
                                <p className="text-3xl font-extrabold">{today.visits}</p>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-300">Visits today</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* what needs a decision */}
                <Section title="Needs your action">
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        <ActionTile icon={ClipboardCheck} tone="amber" value={counts.visits_verify} label="Toolbox talk & Inspection to verify" hint="Toolbox talk + inspections" href="/review/visits?status=pending_verification" />
                        {is_manager && <ActionTile icon={BadgeCheck} tone="sky" value={counts.visits_approve} label="Toolbox talk & Inspection to approve" hint="Verified by a supervisor" href="/review/visits?status=verified" />}
                        <ActionTile icon={AlertTriangle} tone="violet" value={counts.cases_review} label="NC / CC replies to review" hint={`${counts.cases_waiting} waiting for the subcontractor`} href="/review/cases?state=responded" />
                        {!is_manager && <ActionTile icon={Siren} tone="rose" value={counts.incidents_open} label="Incidents awaiting approval" hint={counts.incidents_new ? `${counts.incidents_new} awaiting review` : 'All reviewed; awaiting approval'} href="/review/incidents" />}
                        <ActionTile icon={BarChart3} tone="sky" value={is_manager ? counts.monthly_approve : counts.monthly_verify} label={is_manager ? 'Monthly reports to approve' : 'Monthly reports to verify'} hint={is_manager ? `${counts.monthly_verify} more waiting for verification` : 'Pooled from approved inspections'} href="/review/reports?tab=monthly" />
                        {is_manager && <ActionTile icon={Wallet} tone="amber" value={counts.penalties_pending} label="Penalties to review" hint={`${rm(performance.pending_penalty)} not yet confirmed`} href="/review/reports?tab=daily&status=approved" />}
                    </div>
                </Section>

                {/* performance */}
                <Section title={`Performance • ${month}`} href="/review/reports" linkLabel="Open reports">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Average SPGPNC</p>
                            <p className="mt-1 text-3xl font-extrabold text-ink-900 sm:text-4xl">{performance.avg !== null ? `${performance.avg.toFixed(2)}%` : '-'}</p>
                            <p className="mt-1 text-xs text-gray-500">{performance.reports} approved daily report(s) this month</p>
                        </div>
                        <div className="order-last col-span-2 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:order-none sm:col-span-1 sm:p-5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">BSPR ranks</p>
                            <div className="mt-3 flex gap-2">
                                {Object.entries(performance.ranks).map(([rank, n]) => (
                                    <div key={rank} className="flex-1 rounded-xl bg-gray-50 p-2 text-center">
                                        <span className={`mx-auto mb-1 block h-2 w-8 rounded-full ${rankTone[rank]}`} />
                                        <p className="text-xl font-extrabold text-gray-900">{n}</p>
                                        <p className="text-[10px] font-bold uppercase text-gray-500">{rank}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Calculated penalties</p>
                            <p className="mt-1 text-2xl font-extrabold text-gray-900 sm:text-4xl">{rm(performance.penalty)}</p>
                            <p className="mt-1 text-xs text-gray-500">{performance.pending_penalty > 0 ? `${rm(performance.pending_penalty)} waiting for Manager review` : 'Nothing pending review'}</p>
                        </div>
                    </div>
                </Section>

                <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
                    {/* waiting list */}
                    <Section title={is_manager ? 'Waiting for approval' : 'Waiting for verification'} href="/review/visits">
                        {queue.length === 0 ? (
                            <Empty text="No toolbox talk & inspection is waiting. Nice work." />
                        ) : (
                            <div className="space-y-2">
                                {queue.map((v, n) => (
                                    <Link
                                        key={v.key}
                                        href={`/review/visits/${v.key}`}
                                        className={`${n >= 3 ? 'hidden sm:flex' : 'flex'} min-w-0 items-center gap-2.5 rounded-xl border border-amber-100 bg-white px-3 py-2.5 shadow-sm active:scale-[0.99] transition`}
                                    >
                                        <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-gray-100 text-center leading-none">
                                            <span className="text-[9px] font-bold uppercase text-gray-500">{v.date ? new Date(`${v.date}T00:00:00`).toLocaleDateString('en-GB', { month: 'short' }) : ''}</span>
                                            <span className="text-sm font-extrabold text-gray-900">{v.date ? v.date.slice(8, 10) : '-'}</span>
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[13px] font-bold text-gray-900">{v.project}</span>
                                            <span className="block truncate text-[11px] text-gray-500">{v.by} · {v.inspections} insp.{v.toolbox ? ` · ${v.toolbox}` : ''}</span>
                                        </span>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                                    </Link>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* cases */}
                    <Section title="NC / CC cases" href="/review/cases">
                        {cases.length === 0 ? (
                            <Empty text="No open case." />
                        ) : (
                            <div className="space-y-2">
                                {cases.map((c, n) => {
                                    const stateLabel = { open: 'Awaiting reply', responded: 'Review reply', returned: 'Returned', closed: 'Closed' }[c.state];
                                    const dot = { open: 'bg-amber-500', responded: 'bg-amber-500', returned: 'bg-rose-500', closed: 'bg-emerald-500' }[c.state];
                                    return (
                                        <Link
                                            key={c.key}
                                            href={`/review/cases/${c.type}/${c.id}`}
                                            className={`${n >= 3 ? 'hidden sm:flex' : 'flex'} min-w-0 items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm active:scale-[0.99] transition`}
                                        >
                                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-extrabold text-white ${c.type === 'nc' ? 'bg-red-500' : 'bg-violet-500'}`}>{c.type.toUpperCase()}</span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-[13px] font-bold text-gray-900">{c.inspection.subcon || c.inspection.topic || 'Case'}</span>
                                                <span className="flex items-center gap-1.5 truncate text-[11px] text-gray-500">
                                                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />{stateLabel} · {c.inspection.topic}
                                                </span>
                                            </span>
                                            <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </Section>
                </div>

                {/* incidents */}
                <Section title="Incidents awaiting approval" href="/review/incidents">
                    {incidents.length === 0 ? (
                        <Empty text="No incident is awaiting approval." />
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {incidents.map((i) => {
                                const tone = incidentTone(i.status);
                                return (
                                    <Link key={i.id} href={`/review/incidents/${i.id}`} className={`block rounded-2xl border p-4 shadow-sm transition active:scale-[0.99] ${tone.card}`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-extrabold text-gray-900">{i.type || 'Incident'}</p>
                                                <p className="truncate text-xs text-gray-500">{i.project}</p>
                                            </div>
                                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${tone.badge}`}>{tone.label}</span>
                                        </div>
                                        <p className="mt-2 line-clamp-2 text-xs text-gray-600">{i.description}</p>
                                        <p className="mt-2 text-[11px] font-semibold text-gray-500">{i.date} · {i.responses_count} response(s)</p>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </Section>
            </div>
        </ReviewLayout>
    );
}
