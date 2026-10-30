// Label : value rows for the dark header card of a detail page; status / evaluation are plain coloured text.
import React from 'react';
import { EVAL, REVIEW_STATUS } from '@/Components/inspector/kit';

// text colours that stay readable on the dark header
const STATUS_COLOR = {
    pending_verification: 'text-amber-300',
    verified: 'text-sky-300',
    approved: 'text-emerald-400',
    rejected: 'text-red-400',
};

const EVAL_COLOR = {
    good: 'text-emerald-400',
    poor: 'text-orange-300',
    nonconformance: 'text-red-400',
    clientcomplaint: 'text-violet-300',
};

const strong = 'font-extrabold uppercase tracking-wide';

export function HeroStatus({ value }) {
    const key = value || 'pending_verification';
    return <span className={`${strong} ${STATUS_COLOR[key] || 'text-gray-300'}`}>{REVIEW_STATUS[key]?.label || '-'}</span>;
}

export function HeroEval({ value }) {
    return <span className={`${strong} ${EVAL_COLOR[value] || 'text-gray-300'}`}>{EVAL[value]?.label || value || '-'}</span>;
}

// rows: [[label, node], ...]
export default function HeroMeta({ rows }) {
    return (
        <dl className="mt-3 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-2 text-sm">
            {rows.map(([label, value]) => (
                <React.Fragment key={label}>
                    <dt className="text-gray-400">{label} :</dt>
                    <dd className="min-w-0 font-semibold text-white">{value}</dd>
                </React.Fragment>
            ))}
        </dl>
    );
}
