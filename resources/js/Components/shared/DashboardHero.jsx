import React, { useEffect, useId, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Award } from 'lucide-react';

function greeting(d) {
    const h = d.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    if (h < 21) return 'Good evening';
    return 'Good night';
}

const COMPLIANCE_TIERS = {
    GOLD: { label: 'Gold', light: '#fef08a', dark: '#eab308' },
    SILVER: { label: 'Silver', light: '#f8fafc', dark: '#94a3b8' },
    BRONZE: { label: 'Bronze', light: '#fed7aa', dark: '#c77c45' },
    UNRANKED: { label: 'Unranked', light: '#cbd5e1', dark: '#64748b' },
};

function ComplianceRing({ value, tier }) {
    const gradientId = useId();
    const reduceMotion = useReducedMotion();
    const { label, light, dark } = COMPLIANCE_TIERS[tier] ?? COMPLIANCE_TIERS.UNRANKED;
    const progress = Math.min(100, Math.max(0, value ?? 0));
    const displayValue = value == null ? '—' : `${value}%`;

    return (
        <div
            className="flex shrink-0 flex-col items-center gap-1 rounded-2xl border border-white/15 px-2 py-2 sm:px-3"
            style={{ background: `linear-gradient(155deg, ${light}18, #0f172a66 75%)` }}
            title="Dashboard compliance rate based on the share of inspections marked Good"
        >
            <span className="text-center text-[11px] font-semibold leading-tight tracking-wide text-slate-200">
                BSPR Status:
                <span className="block font-extrabold text-white">Overall Project</span>
            </span>
            <div className="relative size-24 sm:size-28">
                <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90" aria-hidden="true">
                    <defs>
                        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={light} />
                            <stop offset="100%" stopColor={dark} />
                        </linearGradient>
                    </defs>
                    <circle cx="56" cy="56" r="48" fill="none" stroke="white" strokeOpacity="0.14" strokeWidth="7" />
                    {progress > 0 && (
                        <motion.circle
                            cx="56"
                            cy="56"
                            r="48"
                            fill="none"
                            stroke={`url(#${gradientId})`}
                            strokeWidth="7"
                            strokeLinecap="round"
                            initial={reduceMotion ? false : { pathLength: 0 }}
                            animate={{ pathLength: progress / 100 }}
                            transition={{ duration: reduceMotion ? 0 : 0.8, ease: 'easeOut' }}
                        />
                    )}
                </svg>
                <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                    style={{ color: light }}
                >
                    <Award className="size-7 sm:size-8" aria-hidden="true" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider">{label}</span>
                </div>
            </div>
            <span className="text-2xl font-extrabold leading-none tabular-nums sm:text-3xl">
                {value == null && <span className="sr-only">No inspection data</span>}
                <span aria-hidden={value == null}>{displayValue}</span>
            </span>
        </div>
    );
}

export default function DashboardHero({ name, fallbackName, compliance = {} }) {
    // update once a minute – no need to re-render the whole page every second
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const firstName = name?.split(' ')[0] || fallbackName;
    const dateText = now.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long' });
    const timeText = now.toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit' });

    return (
        <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
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
                </div>
                <ComplianceRing value={compliance.rate} tier={compliance.tier} />
            </div>
        </motion.section>
    );
}
