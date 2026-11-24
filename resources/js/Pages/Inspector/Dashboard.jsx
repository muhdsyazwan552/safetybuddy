import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import DashboardHero from '@/Components/shared/DashboardHero';
import InspectorLayout from '@/Layouts/InspectorLayout';
import {
    ClipboardCheck,
    HardHat,
    ClipboardList,
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
    const evalMap = useMemo(() => {
        const m = {};
        evaluationStats.forEach((e) => { m[e.evaluation] = Number(e.total); });
        return m;
    }, [evaluationStats]);
    const evalTotal = EVAL_ORDER.reduce((s, k) => s + (evalMap[k] || 0), 0);

    const maxDay = Math.max(1, ...weeklyActivity.map((d) => d.count));
    const weekTotal = weeklyActivity.reduce((s, d) => s + d.count, 0);
    const openIssues = (insights.open_nc || 0) + (insights.open_cc || 0);

    const kpis = [
        {
            label: 'Today',
            value: insights.today_inspections ?? 0,
            icon: CalendarDays,
            sub: <span className="text-[11px] text-gray-400">inspections done</span>,
            href: '/inspector/visits',
        },
        {
            label: 'This week',
            value: insights.week_inspections ?? 0,
            icon: ClipboardCheck,
            sub: <Trend current={insights.week_inspections ?? 0} previous={insights.last_week_inspections ?? 0} />,
            href: '/inspector/visits',
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
                    <DashboardHero
                        name={user?.name}
                        fallbackName="Inspector"
                        compliance={{ rate: insights.compliance_rate, tier: insights.compliance_tier }}
                    />

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
