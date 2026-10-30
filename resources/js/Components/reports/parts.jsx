// Small building blocks shared by the daily / monthly report views.
import React from 'react';

export const pct = (v) => (v === null || v === undefined ? '-' : `${Number(v).toFixed(2)}%`);
export const rm = (v) => `RM${Number(v || 0).toLocaleString('en-MY', { maximumFractionDigits: 2 })}`;
export const num = (v) => (v === null || v === undefined ? '-' : Number(v).toLocaleString('en-MY'));
const trim = (v) => String(Number(v));

export const STATUS_LABEL = {
    pending_verification: 'Pending Supervisor verification',
    verified: 'Pending Manager approval',
    approved: 'Approved',
    rejected: 'Returned',
};

export const RANK = {
    GOLD: { bg: 'bg-amber-500', text: 'text-amber-700', ring: 'ring-amber-300', soft: 'bg-amber-50' },
    SILVER: { bg: 'bg-slate-400', text: 'text-slate-600', ring: 'ring-slate-300', soft: 'bg-slate-50' },
    BRONZE: { bg: 'bg-orange-600', text: 'text-orange-700', ring: 'ring-orange-300', soft: 'bg-orange-50' },
};

// Same look as the SectionCard of the other detail pages: light header, rounded card
export function Panel({ title, tone = 'blue', children, className = '' }) {
    const head = { blue: 'bg-gray-50 text-gray-500', grey: 'bg-gray-50 text-gray-500', gold: 'bg-amber-50 text-amber-700' }[tone] || 'bg-gray-50 text-gray-500';
    return (
        <section className={`overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-md shadow-gray-200/60 ${className}`}>
            <h3 className={`${head} px-5 py-3 text-xs font-bold uppercase tracking-widest`}>{title}</h3>
            <div className="p-5">{children}</div>
        </section>
    );
}

export function RankMedal({ rank, size = 'lg' }) {
    const r = RANK[rank];
    if (!r) return <span className="text-2xl font-extrabold text-slate-300">-</span>;
    return (
        <span className={`inline-flex items-center gap-3 ${size === 'lg' ? 'text-4xl' : 'text-xl'} font-extrabold ${r.text}`}>
            <span className={`flex ${size === 'lg' ? 'h-14 w-14' : 'h-9 w-9'} items-center justify-center rounded-full ${r.bg} text-white ring-4 ${r.ring}`}>★</span>
            {rank}
        </span>
    );
}

export function RankStrip({ settings }) {
    return (
        <div className="flex flex-wrap gap-2 text-xs font-extrabold text-white">
            <span className="rounded-md bg-amber-500 px-3 py-2">GOLD  ≥ {trim(settings.gold_min)}%</span>
            <span className="rounded-md bg-slate-400 px-3 py-2">SILVER  ≥ {trim(settings.silver_min)}% to &lt; {trim(settings.gold_min)}%</span>
            <span className="rounded-md bg-orange-600 px-3 py-2">BRONZE  &lt; {trim(settings.silver_min)}%</span>
        </div>
    );
}

export function SwitchChips({ settings }) {
    const on = (v) => (v ? 'ON' : 'OFF');
    return (
        <span className="inline-flex flex-wrap gap-x-3 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-extrabold text-brand-800">
            <span>Scoring {on(settings.scoring_on)}</span>
            <span>BSPR {on(settings.bspr_on)}</span>
            <span>Penalties {on(settings.penalties_on)}</span>
        </span>
    );
}

export function ResultText({ result }) {
    if (result === 'below') return <span className="font-extrabold text-red-600">Below target</span>;
    if (result === 'meets') return <span className="font-extrabold text-emerald-600">Meets target</span>;
    return <span className="text-slate-400">Not assessed</span>;
}

export function Status({ value, className = '' }) {
    const tone = {
        pending_verification: 'bg-amber-100 text-amber-800',
        verified: 'bg-cyan-100 text-cyan-800',
        approved: 'bg-emerald-100 text-emerald-800',
        rejected: 'bg-rose-100 text-rose-800',
    }[value] || 'bg-slate-100 text-slate-700';
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${tone} ${className}`}>{STATUS_LABEL[value] || value}</span>;
}

export const benchLabel = (v) => `${trim(v)}%`;

// Status as plain coloured text for the dark header (colours readable on dark)
const HERO_STATUS = {
    pending_verification: 'text-amber-300',
    verified: 'text-sky-300',
    approved: 'text-emerald-400',
    rejected: 'text-red-400',
};

export function HeroStatusText({ value }) {
    return <span className={`font-extrabold uppercase tracking-wide ${HERO_STATUS[value] || 'text-gray-300'}`}>{STATUS_LABEL[value] || value}</span>;
}

// "Scoring ON · BSPR ON · Penalties OFF" as coloured text for the dark header
export function SwitchText({ settings }) {
    const item = (label, on) => (
        <span key={label}>{label} <b className={on ? 'text-emerald-400' : 'text-gray-400'}>{on ? 'ON' : 'OFF'}</b></span>
    );
    return <span className="flex flex-wrap gap-x-4">{[item('Scoring', settings.scoring_on), item('BSPR', settings.bspr_on), item('Penalties', settings.penalties_on)]}</span>;
}