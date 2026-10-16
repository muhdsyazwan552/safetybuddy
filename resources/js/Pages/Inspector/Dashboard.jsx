import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import InspectorLayout from '@/Layouts/InspectorLayout';
import {
    ClipboardCheck,
    HardHat,
    Building2,
    Plus,
    ArrowRight,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    AlertTriangle,
    MessageSquareWarning,
    CalendarDays,
    Users,
    MapPin,
    ShieldCheck,
    CheckCircle2,
} from 'lucide-react';

const EVAL = {
    good: { label: 'Good', color: '#10b981', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    poor: { label: 'Poor', color: '#f97316', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
    nonconformance: { label: 'Non-Conformance', color: '#ef4444', badge: 'bg-red-50 text-red-700 border-red-200' },
    clientcomplaint: { label: 'Client Complaint', color: '#8b5cf6', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
};
const EVAL_ORDER = ['good', 'poor', 'nonconformance', 'clientcomplaint'];

const fade = {
    hidden: { opacity: 0, y: 14 },
    show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, type: 'spring', stiffness: 260, damping: 24 } }),
};

function greeting(d) {
    const h = d.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
}

function ComplianceRing({ value = 0, size = 112 }) {
    const stroke = 10;
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c;
    return (
        <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={stroke} />
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    fill="none"
                    stroke="#F7D31A"
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={c}
                    initial={{ strokeDashoffset: c }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-white leading-none">{value}%</span>
                <span className="text-[10px] uppercase tracking-wider text-gray-400 mt-1">Compliance</span>
            </div>
        </div>
    );
}

function Trend({ current, previous }) {
    if (previous === 0 && current === 0) {
        return <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400"><Minus className="w-3 h-3" /> no change</span>;
    }
    if (previous === 0) {
        return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600"><ArrowUpRight className="w-3 h-3" /> new</span>;
    }
    const diff = Math.round(((current - previous) / previous) * 100);
    if (diff === 0) return <span className="inline-flex items-center gap-0.5 text-[11px] text-gray-400"><Minus className="w-3 h-3" /> same as last week</span>;
    const up = diff > 0;
    return (
        <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(diff)}% vs last week
        </span>
    );
}

function Card({ title, action, children, className = '' }) {
    return (
        <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm ${className}`}>
            {(title || action) && (
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h2 className="text-sm font-bold text-gray-900">{title}</h2>
                    {action}
                </div>
            )}
            {children}
        </div>
    );
}

function SeeAll({ href }) {
    return (
        <Link href={href} className="text-xs font-semibold text-brand-800 hover:text-brand-900 inline-flex items-center gap-1">
            See all <ArrowRight className="w-3 h-3" />
        </Link>
    );
}

export default function Dashboard({
    stats = {},
    recentInspections = [],
    projects = [],
    evaluationStats = [],
    recentToolboxTalks = [],
    insights = {},
    weeklyActivity = [],
    attention = [],
    user,
}) {
    // update once a minute – no need to re-render the whole page every second
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const firstName = user?.name?.split(' ')[0] || 'Inspector';
    const dateText = now.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeText = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });

    const evalMap = useMemo(() => {
        const m = {};
        evaluationStats.forEach((e) => { m[e.evaluation] = Number(e.total); });
        return m;
    }, [evaluationStats]);
    const evalTotal = EVAL_ORDER.reduce((s, k) => s + (evalMap[k] || 0), 0);

    const maxDay = Math.max(1, ...weeklyActivity.map((d) => d.count));
    const weekTotal = weeklyActivity.reduce((s, d) => s + d.count, 0);
    const openIssues = (insights.open_nc || 0) + (insights.open_cc || 0);

    const quickActions = [
        { label: 'New Inspection', href: '/inspector/inspections/create', icon: ClipboardCheck, primary: true },
        { label: 'Toolbox Talk', href: '/inspector/toolbox-talks/create', icon: HardHat },
        { label: 'Projects', href: '/inspector/projects', icon: Building2 },
        { label: 'Subcons', href: '/inspector/subcon-companies', icon: Users },
    ];

    const kpis = [
        {
            label: 'Today',
            value: insights.today_inspections ?? 0,
            icon: CalendarDays,
            sub: <span className="text-[11px] text-gray-400">inspections done</span>,
            href: '/inspector/inspections',
        },
        {
            label: 'This week',
            value: insights.week_inspections ?? 0,
            icon: ClipboardCheck,
            sub: <Trend current={insights.week_inspections ?? 0} previous={insights.last_week_inspections ?? 0} />,
            href: '/inspector/inspections',
        },
        {
            label: 'Open NC',
            value: insights.open_nc ?? 0,
            icon: AlertTriangle,
            tone: (insights.open_nc ?? 0) > 0 ? 'danger' : 'ok',
            sub: <span className="text-[11px] text-gray-400">non-conformance</span>,
            href: '/inspector/inspections?evaluation=nonconformance',
        },
        {
            label: 'Open complaints',
            value: insights.open_cc ?? 0,
            icon: MessageSquareWarning,
            tone: (insights.open_cc ?? 0) > 0 ? 'warn' : 'ok',
            sub: <span className="text-[11px] text-gray-400">client complaints</span>,
            href: '/inspector/inspections?evaluation=clientcomplaint',
        },
    ];

    const toneClass = {
        danger: 'bg-red-50 text-red-600',
        warn: 'bg-violet-50 text-violet-600',
        ok: 'bg-brand-100 text-brand-800',
        undefined: 'bg-brand-100 text-brand-800',
    };

    return (
        <InspectorLayout user={user}>
            <Head title="Dashboard" />

            <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
                <div className="max-w-7xl mx-auto space-y-5 sm:space-y-6">

                    {/* ───────── Hero ───────── */}
                    <motion.section
                        variants={fade}
                        initial="hidden"
                        animate="show"
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 text-white p-5 sm:p-7 shadow-lg"
                    >
                        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-500/20 blur-2xl" />
                        <div className="pointer-events-none absolute -left-8 -bottom-12 h-36 w-36 rounded-full bg-brand-500/10 blur-2xl" />

                        <div className="relative flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-wider text-brand-400">{dateText} · {timeText}</p>
                                <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold leading-tight">
                                    {greeting(now)},<br className="sm:hidden" /> <span className="text-brand-400">{firstName}</span>
                                </h1>
                                <p className="mt-2 text-sm text-gray-300 max-w-sm">
                                    {openIssues > 0
                                        ? `${openIssues} open issue${openIssues > 1 ? 's' : ''} need your follow-up.`
                                        : 'All clear — no open issues right now.'}
                                </p>
                            </div>
                            <ComplianceRing value={insights.compliance_rate ?? 0} />
                        </div>

                        <div className="relative mt-5 flex flex-wrap gap-2">
                            <Link
                                href="/inspector/inspections/create"
                                className="sb-create"
                            >
                                <Plus className="w-4 h-4" strokeWidth={3} /> New Inspection
                            </Link>
                            <Link
                                href="/inspector/toolbox-talks/create"
                                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white border border-white/10 active:scale-95 transition"
                            >
                                <HardHat className="w-4 h-4 text-brand-400" /> Toolbox Talk
                            </Link>
                        </div>
                    </motion.section>

                    {/* ───────── Quick actions ───────── */}
                    <motion.section variants={fade} custom={1} initial="hidden" animate="show" className="grid grid-cols-4 gap-2 sm:gap-4">
                        {quickActions.map((a) => (
                            <Link
                                key={a.label}
                                href={a.href}
                                className="flex flex-col items-center gap-2 rounded-2xl bg-white border border-gray-100 shadow-sm py-3 px-1 active:scale-95 transition hover:shadow-md"
                            >
                                <span className={`h-11 w-11 rounded-2xl flex items-center justify-center ${a.primary ? 'bg-brand-500 text-ink-900' : 'bg-ink-900 text-brand-400'}`}>
                                    <a.icon className="w-5 h-5" />
                                </span>
                                <span className="text-[11px] sm:text-xs font-semibold text-gray-700 text-center leading-tight">{a.label}</span>
                            </Link>
                        ))}
                    </motion.section>

                    {/* ───────── KPIs ───────── */}
                    <motion.section variants={fade} custom={2} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {kpis.map((k) => (
                            <Link
                                key={k.label}
                                href={k.href}
                                className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 active:scale-[0.98] transition hover:shadow-md"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-500">{k.label}</span>
                                    <span className={`h-8 w-8 rounded-xl flex items-center justify-center ${toneClass[k.tone]}`}>
                                        <k.icon className="w-4 h-4" />
                                    </span>
                                </div>
                                <p className="mt-2 text-3xl font-extrabold text-gray-900 leading-none">{k.value}</p>
                                <div className="mt-2">{k.sub}</div>
                            </Link>
                        ))}
                    </motion.section>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
                        {/* ───────── Left column ───────── */}
                        <div className="lg:col-span-2 space-y-5 sm:space-y-6">

                            {/* Needs attention */}
                            <motion.div variants={fade} custom={3} initial="hidden" animate="show">
                                <Card
                                    title={
                                        <span className="inline-flex items-center gap-2">
                                            Needs attention
                                            {openIssues > 0 && (
                                                <span className="rounded-full bg-red-500 text-white text-[10px] font-bold px-2 py-0.5">{openIssues}</span>
                                            )}
                                        </span>
                                    }
                                >
                                    {attention.length === 0 ? (
                                        <div className="px-5 pb-6 pt-2 flex items-center gap-3 text-sm text-gray-500">
                                            <span className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </span>
                                            Nothing pending — great job keeping sites safe.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {attention.map((a, i) => {
                                                const isNc = a.type === 'Non-Conformance';
                                                return (
                                                    <Link
                                                        key={`${a.type}-${a.inspection_id}-${i}`}
                                                        href={`/inspector/inspections/${a.inspection_id}`}
                                                        className="flex items-center gap-3 px-5 py-3.5 active:bg-gray-50 hover:bg-gray-50 transition"
                                                    >
                                                        <span className={`h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center ${isNc ? 'bg-red-50 text-red-600' : 'bg-violet-50 text-violet-600'}`}>
                                                            {isNc ? <AlertTriangle className="w-5 h-5" /> : <MessageSquareWarning className="w-5 h-5" />}
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">{a.project_name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{a.subcon_name}{a.date_open ? ` · opened ${a.date_open}` : ''}</p>
                                                        </div>
                                                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${isNc ? EVAL.nonconformance.badge : EVAL.clientcomplaint.badge}`}>
                                                            {isNc ? 'NC' : 'Complaint'}
                                                        </span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </Card>
                            </motion.div>

                            {/* Weekly activity */}
                            <motion.div variants={fade} custom={4} initial="hidden" animate="show">
                                <Card
                                    title="Inspections · last 7 days"
                                    action={<span className="text-xs font-semibold text-gray-500">{weekTotal} total</span>}
                                >
                                    <div className="px-5 pb-5">
                                        {weeklyActivity.length === 0 ? (
                                            <p className="py-8 text-center text-sm text-gray-400">No activity yet.</p>
                                        ) : (
                                            <div className="flex items-end justify-between gap-2 sm:gap-4 h-40">
                                                {weeklyActivity.map((d, i) => {
                                                    const h = d.count === 0 ? 4 : Math.max(10, (d.count / maxDay) * 100);
                                                    return (
                                                        <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full gap-2">
                                                            <span className={`text-[11px] font-bold ${d.count ? 'text-gray-800' : 'text-gray-300'}`}>{d.count}</span>
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${h}%` }}
                                                                transition={{ delay: 0.2 + i * 0.05, duration: 0.5, ease: 'easeOut' }}
                                                                className={`w-full max-w-[40px] rounded-xl ${d.is_today ? 'bg-brand-500' : d.count ? 'bg-ink-800' : 'bg-gray-100'}`}
                                                            />
                                                            <span className={`text-[10px] font-semibold ${d.is_today ? 'text-brand-800' : 'text-gray-400'}`}>{d.label}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Recent inspections */}
                            <motion.div variants={fade} custom={5} initial="hidden" animate="show">
                                <Card title="Recent inspections" action={<SeeAll href="/inspector/inspections" />}>
                                    {recentInspections.length === 0 ? (
                                        <p className="px-5 pb-6 text-sm text-gray-400">No inspections yet. Tap + to start one.</p>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {recentInspections.map((i) => {
                                                const ev = EVAL[i.evaluation];
                                                return (
                                                    <Link
                                                        key={i.id}
                                                        href={`/inspector/inspections/${i.id}`}
                                                        className="flex items-center gap-3 px-5 py-3.5 active:bg-gray-50 hover:bg-gray-50 transition"
                                                    >
                                                        <span className="w-1.5 h-10 rounded-full shrink-0" style={{ background: ev?.color || '#9ca3af' }} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">{i.project_name}</p>
                                                            <p className="text-xs text-gray-500 truncate">{i.subcon_name} · {i.topic}</p>
                                                            <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                                                                <MapPin className="w-3 h-3 shrink-0" /> {i.location || '—'} · {i.inspection_date}
                                                            </p>
                                                        </div>
                                                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${ev?.badge || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                                            {ev?.label || i.evaluation}
                                                        </span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </Card>
                            </motion.div>
                        </div>

                        {/* ───────── Right column ───────── */}
                        <div className="space-y-5 sm:space-y-6">

                            {/* Evaluation breakdown */}
                            <motion.div variants={fade} custom={3} initial="hidden" animate="show">
                                <Card title="Evaluation breakdown" action={<span className="text-xs font-semibold text-gray-500">{evalTotal} total</span>}>
                                    <div className="px-5 pb-5">
                                        <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
                                            {EVAL_ORDER.map((k) => {
                                                const v = evalMap[k] || 0;
                                                if (!v) return null;
                                                return (
                                                    <motion.div
                                                        key={k}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(v / evalTotal) * 100}%` }}
                                                        transition={{ duration: 0.7, ease: 'easeOut' }}
                                                        style={{ background: EVAL[k].color }}
                                                        title={`${EVAL[k].label}: ${v}`}
                                                    />
                                                );
                                            })}
                                        </div>

                                        <ul className="mt-4 space-y-2.5">
                                            {EVAL_ORDER.map((k) => {
                                                const v = evalMap[k] || 0;
                                                const pct = evalTotal ? Math.round((v / evalTotal) * 100) : 0;
                                                return (
                                                    <li key={k} className="flex items-center gap-3 text-sm">
                                                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: EVAL[k].color }} />
                                                        <span className="flex-1 text-gray-700">{EVAL[k].label}</span>
                                                        <span className="text-xs text-gray-400 w-9 text-right">{pct}%</span>
                                                        <span className="font-bold text-gray-900 w-6 text-right">{v}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Projects */}
                            <motion.div variants={fade} custom={4} initial="hidden" animate="show">
                                <Card title="My projects" action={<SeeAll href="/inspector/projects" />}>
                                    <div className="px-5 pb-5 space-y-3">
                                        {projects.length === 0 && <p className="text-sm text-gray-400">No assigned projects.</p>}
                                        {projects.map((p) => {
                                            const progress = Math.min(100, Math.max(0, Number(p.progress) || 0));
                                            return (
                                                <Link
                                                    key={p.id}
                                                    href={`/inspector/projects/${p.id}`}
                                                    className="block rounded-2xl border border-gray-100 bg-gray-50/60 p-3.5 active:scale-[0.98] transition hover:bg-white hover:shadow-sm"
                                                >
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                                                            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                                <MapPin className="w-3 h-3 shrink-0" /> {p.location || '—'}
                                                            </p>
                                                        </div>
                                                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                                                            {p.status}
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <div className="h-1.5 flex-1 rounded-full bg-gray-200 overflow-hidden">
                                                            <div className="h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-semibold text-gray-500">{progress}%</span>
                                                    </div>
                                                    <p className="mt-2 text-[11px] text-gray-400">{p.inspection_count} inspection{p.inspection_count === 1 ? '' : 's'}</p>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Toolbox talks */}
                            <motion.div variants={fade} custom={5} initial="hidden" animate="show">
                                <Card
                                    title="Toolbox talks"
                                    action={
                                        <span className="text-xs font-semibold text-gray-500">{insights.toolbox_this_month ?? 0} this month</span>
                                    }
                                >
                                    <div className="px-5 pb-5 space-y-3">
                                        {recentToolboxTalks.length === 0 && <p className="text-sm text-gray-400">No toolbox talks yet.</p>}
                                        {recentToolboxTalks.map((t) => (
                                            <Link
                                                key={t.id}
                                                href={`/inspector/toolbox-talks/detail/${t.id}`}
                                                className="flex items-center gap-3 active:opacity-70"
                                            >
                                                <span className="h-10 w-10 shrink-0 rounded-2xl bg-ink-900 text-brand-400 flex items-center justify-center">
                                                    <HardHat className="w-5 h-5" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{t.project_name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{t.conducted_by} · {t.inspection_date}</p>
                                                </div>
                                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600">
                                                    <Users className="w-3.5 h-3.5" /> {t.total_attended ?? 0}
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                </Card>
                            </motion.div>

                            {/* Safety tip */}
                            <motion.div variants={fade} custom={6} initial="hidden" animate="show">
                                <div className="rounded-3xl bg-brand-500 text-ink-900 p-5 flex gap-3">
                                    <ShieldCheck className="w-6 h-6 shrink-0" />
                                    <div>
                                        <p className="text-sm font-extrabold">Safety first</p>
                                        <p className="text-xs mt-1 leading-relaxed">
                                            Inspect before work starts, capture photos of every finding, and close non-conformances within the agreed date.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Footer stats */}
                    <p className="text-center text-[11px] text-gray-400 pb-2">
                        {stats.total_projects ?? 0} projects · {stats.total_inspections ?? 0} inspections · {stats.total_toolbox_talks ?? 0} toolbox talks · {stats.active_subcons ?? 0} active subcons
                    </p>
                </div>
            </div>
        </InspectorLayout>
    );
}
