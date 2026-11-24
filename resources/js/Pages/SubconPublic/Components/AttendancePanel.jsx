// Daily attendance: the leader just ticks the staff who worked. Hours are calculated by the system.
import React, { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { Loader2, Save, CalendarDays, Lock, ChevronDown, History, Search } from 'lucide-react';
import DateInput from '@/Components/shared/DateInput';
import { showAlert } from '@/Helpers/alert';

const today = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function AttendancePanel({ projects = [], staffs = [], hours = 8, isLeader, publicToken, leaderKey }) {
    const [projectId, setProjectId] = useState(projects[0]?.id ? String(projects[0].id) : '');
    const [date, setDate] = useState(today());
    const [ticked, setTicked] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [staffQuery, setStaffQuery] = useState('');

    useEffect(() => {
        if (!isLeader || !projectId || !date) return;
        const request = new AbortController();
        setLoading(true);
        axios
            .get(`/subcon/${publicToken}/attendance`, { signal: request.signal, params: { project_id: projectId, date, leader_key: leaderKey } })
            .then((res) => setTicked(res.data.ticked || []))
            .catch(() => { if (!request.signal.aborted) setTicked([]); })
            .finally(() => { if (!request.signal.aborted) setLoading(false); });
        return () => request.abort();
    }, [isLeader, projectId, date, publicToken, leaderKey]);

    const [history, setHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState(false);
    const [refreshHistory, setRefreshHistory] = useState(0);
    const [openDay, setOpenDay] = useState(null);
    useEffect(() => {
        setOpenDay(null);
        if (!isLeader || !projectId || !date) return;
        const request = new AbortController();
        setLoadingHistory(true);
        setHistoryError(false);
        axios
            .get(`/subcon/${publicToken}/attendance/history`, { signal: request.signal, params: { project_id: projectId, date, leader_key: leaderKey } })
            .then((res) => setHistory(res.data.days || []))
            .catch(() => { if (!request.signal.aborted) setHistoryError(true); })
            .finally(() => { if (!request.signal.aborted) setLoadingHistory(false); });
        return () => request.abort();
    }, [isLeader, projectId, date, publicToken, leaderKey, refreshHistory]);

    const active = useMemo(() => staffs.filter((s) => (s.status || 'active') !== 'inactive'), [staffs]);
    const toggle = (id) => setTicked((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
    const search = staffQuery.trim().toLowerCase();
    const visibleStaff = search
        ? active.filter(({ name, role }) => [name, role].some((value) => value?.toLowerCase().includes(search)))
        : active;
    const visibleIds = visibleStaff.map(({ id }) => id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => ticked.includes(id));
    const toggleVisible = () => {
        setTicked((selected) => (
            allVisibleSelected
                ? selected.filter((id) => !visibleIds.includes(id))
                : [...new Set([...selected, ...visibleIds])]
        ));
    };

    if (!isLeader) {
        return (
            <div className="rounded-3xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
                <Lock className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                Only the company leader can submit daily attendance.
            </div>
        );
    }

    if (projects.length === 0) {
        return <div className="rounded-3xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">Your company is not assigned to any project yet.</div>;
    }

    const save = async () => {
        const project = projects.find(({ id }) => String(id) === projectId);
        if (!project || !date || loading || saving) return;

        const payload = { project_id: projectId, work_date: date, staff_ids: ticked, leader_key: leaderKey };
        const reportDate = new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
        const confirmed = await showAlert.confirm('Review the attendance details before submitting.', 'Confirm attendance', {
            confirmText: 'Submit attendance',
            details: [
                `Total staff selected: ${payload.staff_ids.length}`,
                `Project: ${project.name}`,
                `Date: ${reportDate}`,
            ],
        });
        if (!confirmed) return;

        setSaving(true);
        setError('');
        router.post(
            `/subcon/${publicToken}/attendance`,
            payload,
            {
                preserveScroll: true,
                onSuccess: () => setRefreshHistory((value) => value + 1),
                onError: (e) => setError(Object.values(e)[0] || 'Could not save attendance.'),
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2.5 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm sm:grid-cols-2">
                <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Project</span>
                    <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </label>
                <label className="block">
                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Date</span>
                    <DateInput max={today()} value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm" />
                </label>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="space-y-2 border-b border-gray-100 px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-gray-900">Tick staff who worked</p>
                        {!loading && visibleIds.length > 0 && (
                            <button type="button" onClick={toggleVisible} className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                                {allVisibleSelected ? 'Clear' : 'Tick'} {search ? 'matches' : 'all'}
                            </button>
                        )}
                    </div>
                    {active.length > 0 && (
                        <div className="relative sm:max-w-xs">
                            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                            <input
                                type="search"
                                aria-label="Search staff by name or role"
                                placeholder="Search by name or role"
                                value={staffQuery}
                                onChange={(event) => setStaffQuery(event.target.value)}
                                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm"
                            />
                        </div>
                    )}
                </div>
                {loading ? (
                    <p className="flex items-center justify-center gap-2 p-8 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</p>
                ) : active.length === 0 ? (
                    <p className="p-8 text-center text-sm text-gray-500">Add staff to your company first.</p>
                ) : visibleStaff.length === 0 ? (
                    <p className="p-4 text-center text-sm text-gray-500">No staff match your search.</p>
                ) : (
                    <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto sm:max-h-72">
                        {visibleStaff.map((s) => (
                            <li key={s.id}>
                                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-gray-50">
                                    <input type="checkbox" checked={ticked.includes(s.id)} onChange={() => toggle(s.id)} className="h-5 w-5 shrink-0 rounded border-gray-300 text-brand-600" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold text-gray-900">{s.name}</span>
                                        {s.role && <span className="block truncate text-xs text-gray-500">{s.role}</span>}
                                    </span>
                                </label>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="flex flex-col gap-3 rounded-3xl bg-ink-900 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-brand-400" />
                    <p className="text-sm">
                        <strong>{ticked.length}</strong> worker(s) × {hours} h = <strong className="text-brand-400">{ticked.length * hours} manhours</strong>
                    </p>
                </div>
                <button type="button" disabled={saving || loading || !date || !projectId} onClick={save} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-bold text-ink-900 disabled:opacity-50">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Submit attendance
                </button>
            </div>
            {error && <p className="text-sm font-medium text-red-500">{error}</p>}

            <div className="rounded-3xl border border-gray-200 bg-white shadow-md shadow-gray-200/60">
                <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
                    <History className="h-4 w-4 text-gray-500" />
                    <p className="text-sm font-extrabold text-gray-900">Saved attendance</p>
                    {date === today() && <span className="ml-auto text-xs text-gray-500">Today</span>}
                </div>
                {!date ? (
                    <p className="p-6 text-center text-sm text-gray-500">Select a date to view saved attendance.</p>
                ) : loadingHistory ? (
                    <p className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</p>
                ) : historyError ? (
                    <p className="p-6 text-center text-sm text-red-600">Could not load saved attendance.</p>
                ) : history.length === 0 ? (
                    <p className="p-6 text-center text-sm text-gray-500">No attendance has been submitted for the selected project and date.</p>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {history.map((d) => {
                            const open = openDay === d.date;
                            return (
                                <li key={d.date}>
                                    <div className="flex w-full items-center gap-3 px-4 py-3.5">
                                        <button type="button" onClick={() => setOpenDay(open ? null : d.date)} className="min-w-0 flex-1 text-left">
                                            <span className="block text-[15px] font-bold text-gray-900">
                                                {new Date(`${d.date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className="block text-xs text-gray-500">{d.workers} worker(s) · {d.manhours} manhours</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setDate(d.date); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-600"
                                        >
                                            Edit
                                        </button>
                                        <ChevronDown className={`h-5 w-5 shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
                                    </div>
                                    {open && (
                                        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                                            {d.staff.length ? (
                                                <ol className="space-y-1.5 text-sm">
                                                    {d.staff.map((p, i) => (
                                                        <li key={p.id} className="flex items-center gap-2">
                                                            <span className="w-5 text-right text-xs text-gray-400">{i + 1}</span>
                                                            <span className="font-semibold text-gray-800">{p.name}</span>
                                                            {p.role && <span className="ml-auto text-xs text-gray-400">{p.role}</span>}
                                                        </li>
                                                    ))}
                                                </ol>
                                            ) : (
                                                <p className="text-xs text-gray-500">Only a headcount was recorded for this day (no names).</p>
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
