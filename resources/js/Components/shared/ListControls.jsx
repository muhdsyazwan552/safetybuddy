// Search + filters + pagination for the Supervisor / Manager lists (the server does the filtering).
import React, { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Search, X, SlidersHorizontal, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

const iso = (d) => d.toISOString().slice(0, 10);
const presets = () => {
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - dayOfWeek);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const threeMonths = new Date(now); threeMonths.setMonth(now.getMonth() - 3);

    return [
        ['Today', { from: iso(now), to: iso(now) }],
        ['This week', { from: iso(weekStart), to: iso(now) }],
        ['This month', { from: iso(monthStart), to: iso(now) }],
        ['Last month', { from: iso(lastMonthStart), to: iso(lastMonthEnd) }],
        ['Last 3 months', { from: iso(threeMonths), to: iso(now) }],
        ['All time', { from: '', to: '' }],
    ];
};

const base = 'rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

/**
 * path     : page url, e.g. /review/visits
 * filters  : current filters echoed by the server
 * tabs     : [[value, label, count]] - status chips
 * tabKey   : query name of the chip group (status | state)
 * projects : [{id, name}]
 * extras   : [{ key, label, options: [[value, label]] }] - more dropdowns
 */
export default function ListControls({ path, filters, tabs = [], tabKey = 'status', projects = [], extras = [], placeholder = 'Search project, topic, subcontractor, location…' }) {
    const [q, setQ] = useState(filters.q || '');
    const [open, setOpen] = useState(false);
    const timer = useRef(null);

    useEffect(() => setQ(filters.q || ''), [filters.q]);

    const go = (changes = {}) => {
        const next = { ...filters, ...changes };
        const params = {};
        Object.entries(next).forEach(([k, v]) => {
            if (v === null || v === undefined || v === '' || v === 'all') return;
            if (k === 'page' && Number(v) === 1) return;
            if (k === 'sort' && v === 'newest') return;
            params[k] = v;
        });
        router.get(path, params, { preserveState: true, preserveScroll: true, replace: true });
    };
    const change = (changes) => go({ page: 1, ...changes });

    const onSearch = (value) => {
        setQ(value);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => change({ q: value }), 400);
    };

    const extraKeys = extras.map((e) => e.key);
    const active =
        [filters.q, filters.project_id, filters.from, filters.to, filters.sort === 'oldest' ? 'x' : '']
            .concat(extraKeys.map((k) => (filters[k] && filters[k] !== 'all' ? filters[k] : '')))
            .filter(Boolean).length;

    const clear = () => {
        const reset = { q: '', project_id: '', from: '', to: '', sort: 'newest', page: 1, [tabKey]: 'all' };
        extraKeys.forEach((k) => { reset[k] = 'all'; });
        setQ('');
        go(reset);
    };

    return (
        <div className="space-y-3">
            {/* search */}
            <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={q}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder={placeholder}
                        className={`${base} w-full py-3 pl-11 pr-10`}
                    />
                    {q && (
                        <button type="button" onClick={() => onSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400" aria-label="Clear search">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${open || active ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-700'}`}
                >
                    <SlidersHorizontal className="h-4 w-4" /> <span className="hidden sm:inline">Filters</span>
                    {active > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-extrabold text-ink-900">{active}</span>}
                </button>
            </div>

            {/* status chips with counts */}
            {tabs.length > 0 && (
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                    {tabs.map(([value, label, count]) => {
                        const on = (filters[tabKey] || 'all') === value;
                        return (
                            <button
                                key={value}
                                type="button"
                                onClick={() => change({ [tabKey]: value })}
                                className={`flex shrink-0 items-center gap-2 rounded-full border-2 px-4 py-1.5 text-xs font-bold ${on ? 'border-ink-900 bg-ink-900 text-white' : 'border-gray-200 bg-white text-gray-600'}`}
                            >
                                {label}
                                <span className={`rounded-full px-1.5 text-[11px] ${on ? 'bg-white/20' : 'bg-gray-100 text-gray-500'}`}>{count ?? 0}</span>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* filter panel */}
            {open && (
                <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4">
                    <div>
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400"><CalendarDays className="h-3.5 w-3.5" /> Period</p>
                        <div className="flex flex-wrap gap-2">
                            {presets().map(([label, range]) => {
                                const on = (filters.from || '') === range.from && (filters.to || '') === range.to;
                                return (
                                    <button key={label} type="button" onClick={() => change(range)} className={`rounded-full border px-3 py-1.5 text-xs font-bold ${on ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 text-gray-600'}`}>
                                        {label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            <label className="block text-xs font-semibold text-gray-500">From
                                <input type="date" className={`${base} mt-1 w-full`} value={filters.from || ''} max={filters.to || undefined} onChange={(e) => change({ from: e.target.value })} />
                            </label>
                            <label className="block text-xs font-semibold text-gray-500">To
                                <input type="date" className={`${base} mt-1 w-full`} value={filters.to || ''} min={filters.from || undefined} onChange={(e) => change({ to: e.target.value })} />
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <label className="block text-xs font-semibold text-gray-500">Project
                            <select className={`${base} mt-1 w-full`} value={filters.project_id || ''} onChange={(e) => change({ project_id: e.target.value })}>
                                <option value="">All projects</option>
                                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </label>
                        {extras.map((e) => (
                            <label key={e.key} className="block text-xs font-semibold text-gray-500">{e.label}
                                <select className={`${base} mt-1 w-full`} value={filters[e.key] || 'all'} onChange={(ev) => change({ [e.key]: ev.target.value })}>
                                    {e.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                </select>
                            </label>
                        ))}
                        <label className="block text-xs font-semibold text-gray-500">Order
                            <select className={`${base} mt-1 w-full`} value={filters.sort || 'newest'} onChange={(e) => change({ sort: e.target.value })}>
                                <option value="newest">Newest first</option>
                                <option value="oldest">Oldest first</option>
                            </select>
                        </label>
                    </div>

                    {active > 0 && (
                        <button type="button" onClick={clear} className="text-sm font-bold text-red-600">Clear all filters</button>
                    )}
                </div>
            )}
        </div>
    );
}

/** "Showing 13–24 of 108" + previous / next + numbered pages */
export function Pager({ meta, path, filters }) {
    if (!meta || meta.total === 0) return null;

    const go = (page) => {
        const params = {};
        Object.entries({ ...filters, page }).forEach(([k, v]) => {
            if (v === null || v === undefined || v === '' || v === 'all') return;
            if (k === 'page' && Number(v) === 1) return;
            if (k === 'sort' && v === 'newest') return;
            params[k] = v;
        });
        router.get(path, params, { preserveState: true, preserveScroll: false, replace: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // window of page numbers around the current one
    const nums = [];
    const start = Math.max(1, meta.page - 2);
    const end = Math.min(meta.pages, start + 4);
    for (let n = Math.max(1, end - 4); n <= end; n++) nums.push(n);

    return (
        <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-between">
            <p className="text-xs text-gray-500">Showing <b className="text-gray-800">{meta.from}–{meta.to}</b> of <b className="text-gray-800">{meta.total}</b></p>
            {meta.pages > 1 && (
                <div className="flex items-center gap-1.5">
                    <button type="button" disabled={meta.page === 1} onClick={() => go(meta.page - 1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-40" aria-label="Previous page">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    {nums[0] > 1 && <button type="button" onClick={() => go(1)} className="h-10 min-w-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-600">1</button>}
                    {nums[0] > 2 && <span className="px-1 text-gray-400">…</span>}
                    {nums.map((n) => (
                        <button key={n} type="button" onClick={() => go(n)} className={`h-10 min-w-10 rounded-xl border px-3 text-sm font-bold ${n === meta.page ? 'border-ink-900 bg-ink-900 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>{n}</button>
                    ))}
                    {nums[nums.length - 1] < meta.pages - 1 && <span className="px-1 text-gray-400">…</span>}
                    {nums[nums.length - 1] < meta.pages && <button type="button" onClick={() => go(meta.pages)} className="h-10 min-w-10 rounded-xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-600">{meta.pages}</button>}
                    <button type="button" disabled={meta.page === meta.pages} onClick={() => go(meta.page + 1)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white disabled:opacity-40" aria-label="Next page">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            )}
        </div>
    );
}
