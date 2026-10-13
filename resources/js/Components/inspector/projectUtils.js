export const statusMeta = (s) => {
    const k = String(s || '').toLowerCase();
    if (['active', 'in_progress', 'ongoing'].includes(k)) {
        return { label: k === 'active' ? 'Active' : 'In progress', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    }
    if (['completed', 'done', 'closed'].includes(k)) return { label: 'Completed', cls: 'bg-sky-50 text-sky-700 border-sky-200' };
    if (['on_hold', 'hold', 'paused'].includes(k)) return { label: 'On hold', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    if (['cancelled', 'canceled'].includes(k)) return { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' };
    return {
        label: String(s || 'Unknown').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
        cls: 'bg-gray-50 text-gray-600 border-gray-200',
    };
};

/** % of the project timeline that has elapsed (null when dates are missing/invalid) */
export const timelineProgress = (start, end) => {
    if (!start || !end) return null;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    if (!(e > s)) return null;
    return Math.max(0, Math.min(100, Math.round(((Date.now() - s) / (e - s)) * 100)));
};

/** whole days from today until `end` (negative = overdue) */
export const daysLeft = (end) => {
    if (!end) return null;
    const e = new Date(end);
    if (Number.isNaN(e.getTime())) return null;
    return Math.ceil((e.getTime() - Date.now()) / 86400000);
};
