// Small building blocks shared by the daily / monthly report views.
import React from 'react';

export const pct = (v) => (v === null || v === undefined ? '-' : `${Number(v).toFixed(2)}%`);
export const rm = (v) => `RM${Number(v || 0).toLocaleString('en-MY', { maximumFractionDigits: 2 })}`;
export const num = (v) => (v === null || v === undefined ? '-' : Number(v).toLocaleString('en-MY'));
const trim = (v) => String(Number(v));

// Reports are not approved by hand: they are complete (approved automatically) or not complete.
export const isComplete = (value) => value === 'approved';
export const STATUS_LABEL = { approved: 'Complete', other: 'Not complete' };

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
        <span className={`inline-flex items-center ${size === 'xs' ? 'gap-2 text-xs' : size === 'lg' ? 'gap-3 text-4xl' : 'gap-3 text-xl'} font-extrabold ${r.text}`}>
            <span className={`flex ${size === 'xs' ? 'h-6 w-6 text-xs ring-2' : size === 'lg' ? 'h-14 w-14 ring-4' : 'h-9 w-9 ring-4'} items-center justify-center rounded-full ${r.bg} text-white ${r.ring}`}>★</span>
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
    const done = isComplete(value);
    const tone = done ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800';
    return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${tone} ${className}`}>{done ? STATUS_LABEL.approved : STATUS_LABEL.other}</span>;
}

export const benchLabel = (v) => `${trim(v)}%`;

// Status as plain coloured text for the dark header (colours readable on dark)
export function HeroStatusText({ value }) {
    const done = isComplete(value);
    return <span className={`font-extrabold uppercase tracking-wide ${done ? 'text-emerald-400' : 'text-amber-300'}`}>{done ? STATUS_LABEL.approved : STATUS_LABEL.other}</span>;
}

/** Complete / Not complete card with the reasons a report is not complete yet (replaces the review progress). */
export function CompletionCard({ status, blockers = [], kind = 'report' }) {
    const done = isComplete(status);
    return (
        <div className={`rounded-3xl border p-4 shadow-sm ${done ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
            <p className={`text-sm font-extrabold ${done ? 'text-emerald-800' : 'text-amber-800'}`}>
                {done ? `This ${kind} is complete` : `This ${kind} is not complete yet`}
            </p>
            <p className={`mt-1 text-sm ${done ? 'text-emerald-800' : 'text-amber-900'}`}>
                {done
                    ? 'Every section is complete and approved, so the report was approved automatically. No manual approval is needed.'
                    : 'It becomes complete automatically once every section is complete and approved. No manual approval is needed.'}
            </p>
            {!done && blockers.length > 0 && (
                <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm font-semibold text-amber-900">
                    {blockers.map((b) => <li key={b}>{b}</li>)}
                </ul>
            )}
        </div>
    );
}

// "Scoring ON · BSPR ON · Penalties OFF" as coloured text for the dark header
export function SwitchText({ settings }) {
    const item = (label, on) => (
        <span key={label}>{label} <b className={on ? 'text-emerald-400' : 'text-gray-400'}>{on ? 'ON' : 'OFF'}</b></span>
    );
    return <span className="flex flex-wrap gap-x-4">{[item('Scoring', settings.scoring_on), item('BSPR', settings.bspr_on), item('Penalties', settings.penalties_on)]}</span>;
}