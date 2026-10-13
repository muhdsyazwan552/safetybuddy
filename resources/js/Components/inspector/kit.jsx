// Shared building blocks for the Inspector (mobile-app style) pages.
import React, { useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, X, SlidersHorizontal, Inbox } from 'lucide-react';

export const EVAL = {
    good: { label: 'Good', color: '#10b981', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    moderate: { label: 'Moderate', color: '#f59e0b', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    poor: { label: 'Poor', color: '#f97316', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
    nonconformance: { label: 'Non-Conformance', color: '#ef4444', badge: 'bg-red-50 text-red-700 border-red-200' },
    clientcomplaint: { label: 'Client Complaint', color: '#8b5cf6', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
};
export const EVAL_ORDER = ['good', 'moderate', 'poor', 'nonconformance', 'clientcomplaint'];

export const inputClass =
    'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-400 ' +
    'focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 transition disabled:opacity-60';
export const labelClass = 'mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500';

export function fmtDate(value, opts = { day: '2-digit', month: 'short', year: 'numeric' }) {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString('en-GB', opts);
}

/** Photos are stored as a JSON list in one column (older rows: a single path). */
export function parsePhotos(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
        const v = JSON.parse(raw);
        if (Array.isArray(v)) return v;
    } catch (e) { /* plain path */ }
    return [raw];
}
export const storageUrl = (p) => (p?.startsWith('http') || p?.startsWith('/') ? p : `/storage/${p}`);

export function EvalBadge({ value, className = '' }) {
    const ev = EVAL[value];
    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${ev?.badge || 'bg-gray-50 text-gray-600 border-gray-200'} ${className}`}>
            {ev?.label || value || '-'}
        </span>
    );
}

export function Field({ label, error, children, className = '' }) {
    return (
        <div className={className}>
            {label && <label className={labelClass}>{label}</label>}
            {children}
            {error && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
}

/** Page header block used at the top of list pages */
export function ListHeader({ title, subtitle, count, action, onFilter, filterCount = 0 }) {
    return (
        <div className="mb-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
                <h1 className="truncate text-2xl font-extrabold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500">
                    {subtitle}
                    {typeof count === 'number' && <span className="font-semibold text-gray-700"> · {count} total</span>}
                </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
                {onFilter && (
                    <button
                        onClick={onFilter}
                        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm active:scale-95 transition"
                        aria-label="Filters"
                    >
                        <SlidersHorizontal className="h-5 w-5" />
                        {filterCount > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-ink-900">
                                {filterCount}
                            </span>
                        )}
                    </button>
                )}
                {action}
            </div>
        </div>
    );
}

/** Bottom-sheet on phones, centred dialog on desktop */
export function Sheet({ open, onClose, title, children, footer }) {
    useEffect(() => {
        if (!open) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative flex max-h-[88dvh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:max-w-lg sm:rounded-3xl">
                <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h3 className="text-base font-bold text-gray-900">{title}</h3>
                    <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-5 pb-4">{children}</div>
                {footer && <div className="border-t border-gray-100 p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>{footer}</div>}
            </div>
        </div>
    );
}

export function EmptyState({ title = 'Nothing here yet', hint, action }) {
    return (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white py-14 text-center">
            <Inbox className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-bold text-gray-700">{title}</p>
            {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
            {action && <div className="mt-5 flex justify-center">{action}</div>}
        </div>
    );
}

/** Laravel paginator controls */
export function Pager({ data }) {
    if (!data || !data.total) return null;
    const btn = (url, children, primary) => (
        <Link
            href={url || '#'}
            preserveScroll
            className={`flex flex-1 items-center justify-center gap-1 rounded-2xl px-4 py-3 text-sm font-bold transition active:scale-95 ${
                url
                    ? primary ? 'bg-ink-900 text-brand-400' : 'bg-white border border-gray-200 text-gray-700'
                    : 'pointer-events-none bg-gray-100 text-gray-300'
            }`}
        >
            {children}
        </Link>
    );
    return (
        <div className="mt-5 space-y-3">
            <p className="text-center text-xs text-gray-500">
                Showing <b>{data.from || 0}</b>–<b>{data.to || 0}</b> of <b>{data.total}</b>
            </p>
            <div className="flex gap-3">
                {btn(data.prev_page_url, <><ChevronLeft className="h-4 w-4" /> Previous</>)}
                {btn(data.next_page_url, <>Next <ChevronRight className="h-4 w-4" /></>, true)}
            </div>
        </div>
    );
}

export function SectionCard({ title, icon: Icon, children, tone = 'default', className = '' }) {
    const head = tone === 'danger' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500';
    return (
        <section className={`overflow-hidden rounded-3xl border bg-white shadow-sm ${tone === 'danger' ? 'border-red-100' : 'border-gray-100'} ${className}`}>
            {title && (
                <div className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-widest ${head}`}>
                    {Icon && <Icon className="h-4 w-4" />} {title}
                </div>
            )}
            <div className="p-5">{children}</div>
        </section>
    );
}

export function InfoRow({ label, children }) {
    return (
        <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
            <div className="mt-0.5 text-[15px] font-semibold text-gray-900 break-words">{children || '-'}</div>
        </div>
    );
}

/** Sticky action bar above the mobile tab bar */
export function ActionBar({ children }) {
    return (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:bottom-0 lg:left-72"
             style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom) * 0)' }}>
            <div className="mx-auto flex max-w-3xl gap-3">{children}</div>
        </div>
    );
}

export const primaryBtn =
    'inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-extrabold text-ink-900 shadow-md active:scale-95 transition disabled:opacity-50';
export const darkBtn =
    'inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 py-3 text-sm font-bold text-brand-400 shadow-md active:scale-95 transition disabled:opacity-50';
export const ghostBtn =
    'inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 active:scale-95 transition';
