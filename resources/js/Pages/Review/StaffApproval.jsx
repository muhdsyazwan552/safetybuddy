import React, { useEffect, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Clock, Loader2, Search, ShieldCheck } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';

const PAGE_SIZE = 15;

function Step({ label, at }) {
    return (
        <div className={at ? 'text-emerald-700' : 'text-amber-700'}>
            <b>{label}:</b> {at ? `Approved ${at.slice(0, 10)}` : 'Waiting'}
        </div>
    );
}

export default function StaffApproval({ staff = [], myRole = 'supervisor' }) {
    const [q, setQ] = useState('');
    const [company, setCompany] = useState('');
    const [view, setView] = useState('mine'); // mine = I can approve | other = waiting for the other approver | all
    const [selected, setSelected] = useState([]);
    const [busy, setBusy] = useState(false);
    const [page, setPage] = useState(1);

    const companies = useMemo(() => [...new Set(staff.map((s) => s.company).filter(Boolean))].sort(), [staff]);
    const myKey = myRole === 'manager' ? 'manager_approved_at' : 'supervisor_approved_at';

    const rows = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return staff.filter((s) => {
            if (company && s.company !== company) return false;
            if (view === 'mine' && !s.can_approve) return false;
            if (view === 'other' && !s[myKey]) return false;
            if (needle && ![s.name, s.code, s.role, s.email, s.company].some((v) => String(v || '').toLowerCase().includes(needle))) return false;
            return true;
        });
    }, [staff, q, company, view, myKey]);

    useEffect(() => { setPage(1); }, [q, company, view]);
    // drop selections that left the list (approved or filtered out)
    useEffect(() => { setSelected((sel) => sel.filter((id) => rows.some((r) => r.id === id && r.can_approve))); }, [rows]);

    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const current = Math.min(page, pages);
    const start = (current - 1) * PAGE_SIZE;
    const pageRows = rows.slice(start, start + PAGE_SIZE);

    const selectable = rows.filter((r) => r.can_approve);
    const allSelected = selectable.length > 0 && selectable.every((r) => selected.includes(r.id));
    const toggle = (id) => setSelected((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]));

    const approve = (ids) => {
        setBusy(true);
        router.post('/review/staff-approval/approve-many', { ids }, {
            preserveScroll: true,
            onSuccess: () => setSelected([]),
            onFinish: () => setBusy(false),
        });
    };

    const count = (k) => staff.filter((s) => (k === 'mine' ? s.can_approve : k === 'other' ? s[myKey] : true)).length;
    const TABS = [['mine', 'To approve'], ['other', 'Approved by me'], ['all', 'All pending']];

    return (
        <ReviewLayout title="Staff approval">
            <Head title="Staff approval" />
            <div className="mx-auto max-w-6xl space-y-4 px-4 pb-24 pt-5">
                <p className="text-sm text-gray-500">Newly registered subcontractor staff stay Pending until both the Supervisor and the Manager approve. You are approving as <b>{myRole}</b>.</p>

                <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
                    {TABS.map(([k, label]) => (
                        <button key={k} onClick={() => setView(k)} className={`shrink-0 rounded-full border-2 px-4 py-1.5 text-xs font-bold ${view === k ? 'border-ink-900 bg-ink-900 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>
                            {label} {count(k)}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, series number, role, company..." className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm" />
                    </div>
                    <select value={company} onChange={(e) => setCompany(e.target.value)} className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-700 sm:w-64">
                        <option value="">All subcontractors</option>
                        {companies.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* mobile: one card per worker */}
                <div className="space-y-2.5 md:hidden">
                    {selectable.length > 0 && (
                        <label className="flex items-center gap-2 px-1 text-xs font-bold text-gray-600">
                            <input type="checkbox" className="h-5 w-5 rounded border-gray-300" checked={allSelected} onChange={() => setSelected(allSelected ? [] : selectable.map((r) => r.id))} />
                            Select all ({selectable.length})
                        </label>
                    )}
                    {pageRows.map((s, n) => (
                        <article key={s.id} className={`rounded-2xl border bg-white p-3.5 shadow-sm ${selected.includes(s.id) ? 'border-emerald-400 bg-emerald-50/50' : 'border-gray-100'}`}>
                            <div className="flex items-start gap-3">
                                <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 rounded border-gray-300" disabled={!s.can_approve} checked={selected.includes(s.id)} onChange={() => toggle(s.id)} aria-label={`Select ${s.name}`} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-[15px] font-extrabold leading-tight text-gray-900"><span className="mr-1.5 text-xs font-bold text-gray-400">{start + n + 1}.</span><a href={`/review/staff-approval/${s.id}`} className="hover:underline">{s.name}</a></p>
                                    {s.code && <p className="text-[11px] font-semibold text-gray-500">{s.code}</p>}
                                    <p className="mt-0.5 text-xs text-gray-500">{[s.role, s.company].filter(Boolean).join(' · ')}</p>
                                </div>
                                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[10px] font-extrabold ${s.is_safetypassport ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                                    <ShieldCheck className="h-3 w-3" /> {s.is_safetypassport ? 'Yes' : 'No'}
                                </span>
                            </div>
                            <div className="mt-2.5 flex items-end justify-between gap-3 border-t border-gray-100 pt-2.5 text-xs">
                                <div className="space-y-0.5">
                                    <Step label="Supervisor" at={s.supervisor_approved_at} />
                                    <Step label="Manager" at={s.manager_approved_at} />
                                </div>
                                {s.can_approve ? (
                                    <button disabled={busy} onClick={() => approve([s.id])} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50">
                                        <CheckCircle2 className="h-4 w-4" /> Approve
                                    </button>
                                ) : (
                                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-gray-400"><Clock className="h-3.5 w-3.5" /> {s[myKey] ? 'Waiting other' : 'No passport'}</span>
                                )}
                            </div>
                        </article>
                    ))}
                    {rows.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-sm text-gray-400">No staff waiting for approval.</p>}
                </div>

                {/* desktop: table */}
                <div className="hidden overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-md shadow-gray-200/60 md:block">
                    <table className="min-w-full divide-y divide-gray-100 text-sm">
                        <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="w-10 px-4 py-3">
                                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300" checked={allSelected} disabled={selectable.length === 0}
                                        onChange={() => setSelected(allSelected ? [] : selectable.map((r) => r.id))} aria-label="Select all" />
                                </th>
                                <th className="w-10 px-2 py-3">#</th>
                                <th className="px-4 py-3">Staff</th>
                                <th className="px-4 py-3">Subcontractor</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3 text-center">Passport</th>
                                <th className="px-4 py-3">Approval</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pageRows.map((s, n) => (
                                <tr key={s.id} className={selected.includes(s.id) ? 'bg-emerald-50/50' : ''}>
                                    <td className="px-4 py-3">
                                        <input type="checkbox" className="h-4 w-4 rounded border-gray-300" disabled={!s.can_approve} checked={selected.includes(s.id)} onChange={() => toggle(s.id)} aria-label={`Select ${s.name}`} />
                                    </td>
                                    <td className="px-2 py-3 text-gray-400">{start + n + 1}</td>
                                    <td className="px-4 py-3">
                                        <a href={`/review/staff-approval/${s.id}`} className="font-bold text-gray-900 hover:underline">{s.name}</a>
                                        {s.code && <p className="text-[11px] font-semibold text-gray-500">{s.code}</p>}
                                        <p className="text-xs text-gray-500">{[s.contact, s.email].filter(Boolean).join(' · ')}</p>
                                    </td>
                                    <td className="px-4 py-3 text-gray-700">{s.company}</td>
                                    <td className="px-4 py-3 text-gray-700">{s.role || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold ${s.is_safetypassport ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                                            <ShieldCheck className="h-3.5 w-3.5" /> {s.is_safetypassport ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        <Step label="Supervisor" at={s.supervisor_approved_at} />
                                        <Step label="Manager" at={s.manager_approved_at} />
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {s.can_approve ? (
                                            <button disabled={busy} onClick={() => approve([s.id])} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
                                                <CheckCircle2 className="h-4 w-4" /> Approve
                                            </button>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400"><Clock className="h-3.5 w-3.5" /> {s[myKey] ? 'Waiting other' : 'No passport'}</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr><td colSpan="8" className="p-8 text-center text-gray-400">No staff waiting for approval.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {pages > 1 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                        <span className="text-xs font-semibold text-gray-500">{start + 1}–{Math.min(start + PAGE_SIZE, rows.length)} of {rows.length}</span>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-40">Prev</button>
                            {Array.from({ length: pages }, (_, k) => k + 1).map((p) => (
                                <button key={p} type="button" onClick={() => setPage(p)} className={`h-9 min-w-9 rounded-xl border px-2 text-xs font-bold ${p === current ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-700'}`}>{p}</button>
                            ))}
                            <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 disabled:opacity-40">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {selected.length > 0 && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
                    <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
                        <span className="text-sm font-bold text-gray-800">{selected.length} selected</span>
                        <div className="flex gap-2">
                            <button onClick={() => setSelected([])} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700">Clear</button>
                            <button disabled={busy} onClick={() => approve(selected)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve selected
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ReviewLayout>
    );
}
