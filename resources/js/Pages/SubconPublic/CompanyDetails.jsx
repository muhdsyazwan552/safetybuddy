// resources/js/Pages/SubconPublic/CompanyDetails.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Search, X, UserPlus, LayoutGrid, Rows3, Users, BadgeCheck, AlertTriangle, UserCheck, UserX, SlidersHorizontal,
    Mail, Phone, MapPin, ShieldCheck, Eye, ArrowDownAZ, RotateCcw, Pencil, Info, Crown, Tractor, ClipboardCheck,
} from 'lucide-react';
import { showAlert } from '@/Helpers/alert';
import Toast from '@/Components/Toast';
import StaffList from './Components/StaffList';
import StaffDrawer from './Components/StaffDrawer';
import AddStaffModal from './Components/AddStaffModal';
import InductionPanel from './Components/InductionPanel';
import MachineryPanel from './Components/MachineryPanel';
import CasesPanel from './Components/CasesPanel';
import AttendancePanel from './Components/AttendancePanel';
import { completeness, isNewThisWeek, isActiveStatus } from './Components/staffUtils';

const SORTS = [
    { key: 'newest', label: 'Newest first' },
    { key: 'name', label: 'Name A–Z' },
    { key: 'incomplete', label: 'Least complete first' },
];

function SummaryCard({ icon: Icon, label, value, tone, active, onClick, hint }) {
    const tones = {
        neutral: 'bg-ink-900 text-brand-400',
        green: 'bg-emerald-100 text-emerald-600',
        amber: 'bg-amber-100 text-amber-600',
        gray: 'bg-gray-100 text-gray-500',
    };
    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-2xl border bg-white p-3.5 text-left shadow-sm transition active:scale-[0.98] ${
                active ? 'border-brand-500 ring-4 ring-brand-500/20' : 'border-gray-100 hover:border-gray-200'
            }`}
        >
            <div className="flex items-center justify-between">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
                    <Icon className="h-5 w-5" />
                </span>
                <span className="text-2xl font-extrabold leading-none text-gray-900">{value}</span>
            </div>
            <p className="mt-2 text-xs font-bold text-gray-700">{label}</p>
            {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
        </button>
    );
}

export default function CompanyDetails({
    company, staffs = [], public_token, leader_key = null, access_level, role,
    induction = { topics: [], total: 0, done: 0, complete: true }, machinery = [], cases = [], attendance_projects = [], hours_per_worker = 8, performance = null,
}) {
    const isLeader = access_level === 'full';
    const canEdit = isLeader;
    const canDelete = isLeader;

    // ---- UI state
    // the leader's daily jobs come first: reply to open cases, otherwise tick attendance
    const [tab, setTab] = useState(() => (isLeader ? (cases.some((c) => c.state === 'open' || c.state === 'returned') ? 'cases' : 'attendance') : 'staff'));
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [selected, setSelected] = useState(null);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const [query, setQuery] = useState('');
    const [info, setInfo] = useState('all'); // all | complete | incomplete
    const [status, setStatus] = useState('all'); // all | active | inactive
    const [roleFilter, setRoleFilter] = useState('all');
    const [sort, setSort] = useState('newest');
    const [viewMode, setViewMode] = useState(() => {
        try {
            return localStorage.getItem('sb-subcon-view') || 'cards';
        } catch (e) {
            return 'cards';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('sb-subcon-view', viewMode);
        } catch (e) { /* ignore */ }
    }, [viewMode]);

    // keep the open drawer in sync after an edit / reload
    useEffect(() => {
        if (selected) setSelected(staffs.find((s) => s.id === selected.id) || null);
    }, [staffs]);

    // ---- forms
    const addForm = useForm({ name: '', email: '', contact: '', role: '' });
    const editForm = useForm({ name: '', email: '', contact: '', role: '', status: 'active' });

    const submitAdd = () => {
        addForm.post(`/subcon/${public_token}/staff`, {
            preserveScroll: true,
            onSuccess: () => {
                addForm.reset();
                setShowModal(false);
                showAlert.success('The staff member has been registered.', 'Staff registered');
            },
            onError: () => showAlert.warning('Please correct the highlighted fields.', 'Check the form'),
        });
    };

    const submitEdit = () => {
        editForm.transform((d) => ({ ...d, leader_key })).put(`/subcon/${public_token}/staff/${editingStaff.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                closeModal();
                showAlert.success('The staff details have been updated.', 'Changes saved');
            },
            onError: () => showAlert.warning('Please correct the highlighted fields.', 'Check the form'),
        });
    };

    const openAdd = () => {
        setEditingStaff(null);
        addForm.reset();
        addForm.clearErrors();
        setShowModal(true);
    };

    const openEdit = (staff) => {
        if (!canEdit) return;
        setSelected(null);
        setEditingStaff(staff);
        editForm.clearErrors();
        editForm.setData({
            name: staff.name || '',
            email: staff.email || '',
            contact: staff.contact || '',
            role: staff.role || '',
            status: isActiveStatus(staff.status) ? 'active' : 'inactive',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingStaff(null);
        addForm.reset();
        editForm.reset();
    };

    const toggleStatus = (staff) => {
        if (!isLeader) return;
        const next = isActiveStatus(staff.status) ? 'inactive' : 'active';
        router.put(
            `/subcon/${public_token}/staff/${staff.id}`,
            {
                name: staff.name,
                email: staff.email,
                contact: staff.contact || '',
                role: staff.role || '',
                status: next,
                leader_key,
            },
            {
                preserveScroll: true,
                onSuccess: () => showAlert.success(`${staff.name} is now ${next}.`, 'Status updated'),
                onError: () => showAlert.error('The status could not be changed.', 'Update failed'),
            }
        );
    };

    const handleDelete = async (id, name) => {
        if (!canDelete) return;
        const ok = await showAlert.confirmDelete(
            `${name} will be removed from ${company.name}. Their project assignments are removed as well.`,
            'Remove this staff member?',
            { confirmText: 'Yes, remove' }
        );
        if (!ok) return;
        router.delete(`/subcon/${public_token}/staff/${id}`, {
            data: { leader_key },
            preserveScroll: true,
            onSuccess: () => {
                setSelected(null);
                showAlert.success(`${name} has been removed.`, 'Staff removed');
            },
        });
    };

    // ---- derived data
    const enriched = useMemo(() => staffs.map((s) => ({ ...s, _info: completeness(s) })), [staffs]);

    const stats = useMemo(() => {
        const complete = enriched.filter((s) => s._info.isComplete).length;
        const active = enriched.filter((s) => isActiveStatus(s.status)).length;
        return {
            total: enriched.length,
            complete,
            incomplete: enriched.length - complete,
            active,
            inactive: enriched.length - active,
            fresh: enriched.filter(isNewThisWeek).length,
            pct: enriched.length ? Math.round((complete / enriched.length) * 100) : 0,
        };
    }, [enriched]);

    const roles = useMemo(
        () => [...new Set(enriched.map((s) => (s.role || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
        [enriched]
    );

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = enriched.filter((s) => {
            if (q) {
                const hay = [s.name, s.email, s.contact, s.role].filter(Boolean).join(' ').toLowerCase();
                if (!hay.includes(q)) return false;
            }
            if (info === 'complete' && !s._info.isComplete) return false;
            if (info === 'incomplete' && s._info.isComplete) return false;
            if (status !== 'all' && (isActiveStatus(s.status) ? 'active' : 'inactive') !== status) return false;
            if (roleFilter === '__none') return !(s.role || '').trim();
            if (roleFilter !== 'all' && (s.role || '').trim() !== roleFilter) return false;
            return true;
        });

        const by = {
            newest: (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
            name: (a, b) => (a.name || '').localeCompare(b.name || ''),
            incomplete: (a, b) => a._info.pct - b._info.pct || (a.name || '').localeCompare(b.name || ''),
        }[sort];
        list = [...list].sort(by);
        return list;
    }, [enriched, query, info, status, roleFilter, sort]);

    const activeFilters = [info !== 'all', status !== 'all', roleFilter !== 'all', query.trim() !== ''].filter(Boolean).length;
    const reset = () => {
        setQuery('');
        setInfo('all');
        setStatus('all');
        setRoleFilter('all');
        setSort('newest');
    };

    const openCases = cases.filter((c) => c.state !== 'closed').length;
    const needsReply = cases.filter((c) => c.state === 'open' || c.state === 'returned').length;
    const tabs = [
        ...(isLeader ? [
            { key: 'attendance', label: 'Daily attendance', short: 'Attendance', Icon: ClipboardCheck, count: '', warn: false },
            { key: 'cases', label: 'NC / CC cases', short: 'Cases', Icon: AlertTriangle, count: needsReply || openCases, warn: needsReply > 0 },
        ] : []),
        { key: 'staff', label: 'Staff', short: 'Staff', Icon: Users, count: staffs.length, warn: false },
        { key: 'induction', label: 'Safety induction', short: 'Induction', Icon: ShieldCheck, count: `${induction.done}/${induction.total}`, warn: !induction.complete },
        { key: 'machinery', label: 'Machinery', short: 'Machinery', Icon: Tractor, count: machinery.length, warn: false },
    ];

    const TAB_HELP = {
        attendance: ['Daily attendance', 'Choose the project and date, then tick the staff who worked. Hours are calculated for you.'],
        cases: ['Cases to answer', 'Inspectors raised these against your company. Write what happened and what you did about it.'],
        staff: ['Your staff', isLeader ? 'Tap a person to see details, edit, or remove them.' : 'Tap a person to see details. Ask your leader to edit or remove.'],
        induction: ['Safety induction', isLeader ? 'Tick every topic after your team has been briefed. The company becomes Active when all are ticked.' : 'The leader ticks each topic after the team is briefed.'],
        machinery: ['Machinery', 'Machines your company uses on site, with their certificate and operator.'],
    };

    const pillBtn = (activeNow) =>
        `rounded-xl border px-3 py-2 text-xs font-bold transition ${activeNow ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`;

    return (
        <>
            <Head title={`${company.name} – Staff registration`} />
            <Toast />

            <div className="min-h-screen bg-gray-100 pb-28">
                {/* Top bar */}
                <header className="sticky top-0 z-40 bg-ink-900 text-white shadow-md">
                    <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
                        <img src="/images/logo.png" alt="Safety Buddy" className="h-10 w-10 shrink-0 rounded-full ring-2 ring-brand-500" />
                        <div className="min-w-0 flex-1 leading-tight">
                            <p className="truncate text-[15px] font-extrabold">{company.name}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-brand-400">
                                {isLeader ? <Crown className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                {isLeader ? 'Team leader' : 'Staff (view & register)'}
                            </p>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase ${isActiveStatus(company.status) ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-ink-900'}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {isActiveStatus(company.status) ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 lg:px-8">
                    {/* Company contact - collapsed to keep the page short */}
                    {(company.email || company.contact || company.address) && (
                        <details className="group rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm">
                            <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-gray-700">
                                Company details
                                <span className="text-xs font-semibold text-gray-400 group-open:hidden">Show</span>
                                <span className="hidden text-xs font-semibold text-gray-400 group-open:inline">Hide</span>
                            </summary>
                            <div className="mt-3 space-y-2 text-gray-600">
                                {company.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" />{company.email}</p>}
                                {company.contact && <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" />{company.contact}</p>}
                                {company.address && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />{company.address}</p>}
                            </div>
                        </details>
                    )}

                    {/* Inactive banner */}
                    {!induction.complete && tab !== 'induction' && (
                        <button
                            type="button"
                            onClick={() => setTab('induction')}
                            className="flex w-full items-center gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-left transition hover:bg-amber-100"
                        >
                            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
                            <span className="text-sm text-amber-900">
                                <b>This company is INACTIVE.</b> Safety induction is {induction.done}/{induction.total} ticked
                                {isLeader ? ' — tap to complete it.' : ' — the company leader must tick every topic.'}
                            </span>
                        </button>
                    )}

                    {/* Latest performance (leader) */}
                    {isLeader && performance && (performance.daily.length > 0 || performance.monthly) && (
                        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between bg-ink-900 px-4 py-2.5 text-white">
                                <h3 className="text-sm font-extrabold uppercase tracking-wide">Safety performance (SPGPNC)</h3>
                                {performance.monthly && (
                                    <span className="text-xs font-bold">
                                        {performance.monthly.period}: {Number(performance.monthly.spgpnc ?? 0).toFixed(2)}% {performance.monthly.rank || ''}
                                    </span>
                                )}
                            </div>
                            <ul className="divide-y divide-gray-100">
                                {performance.daily.map((d) => (
                                    <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                                        <span className="min-w-0">
                                            <span className="block font-bold text-gray-900">{d.date}</span>
                                            <span className="block truncate text-xs text-gray-500">{d.project}</span>
                                        </span>
                                        <span className="flex items-center gap-3 text-right">
                                            <span className="font-extrabold text-ink-900">{d.spgpnc !== null ? `${Number(d.spgpnc).toFixed(2)}%` : 'Incomplete'}</span>
                                            {d.rank && <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold text-white ${d.rank === 'GOLD' ? 'bg-amber-500' : d.rank === 'SILVER' ? 'bg-slate-400' : 'bg-orange-600'}`}>{d.rank}</span>}
                                            <span className="text-xs font-semibold text-gray-600">RM{Number(d.penalty).toLocaleString()}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {/* Desktop tabs (phones use the bottom bar) */}
                    <div className="hidden gap-2 overflow-x-auto rounded-2xl bg-gray-200/70 p-1 lg:flex">
                        {tabs.map(({ key, label, Icon, count, warn }) => (
                            <button
                                key={key}
                                onClick={() => setTab(key)}
                                className={`flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition ${tab === key ? 'bg-white text-ink-900 shadow' : 'text-gray-500'}`}
                            >
                                <Icon className="h-4 w-4" /> {label}
                                {count !== '' && count !== null && (
                                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${warn ? 'bg-amber-400 text-ink-900' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* What this screen is for, in one line */}
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900">{TAB_HELP[tab]?.[0]}</h2>
                        <p className="text-sm text-gray-500">{TAB_HELP[tab]?.[1]}</p>
                    </div>

                    {tab === 'induction' && (
                        <InductionPanel
                            induction={induction}
                            isLeader={isLeader}
                            publicToken={public_token}
                            leaderKey={leader_key}
                            companyName={company.name}
                        />
                    )}

                    {tab === 'attendance' && (
                        <AttendancePanel
                            projects={attendance_projects}
                            staffs={staffs}
                            hours={hours_per_worker}
                            isLeader={isLeader}
                            publicToken={public_token}
                            leaderKey={leader_key}
                        />
                    )}

                    {tab === 'cases' && (
                        <CasesPanel cases={cases} isLeader={isLeader} publicToken={public_token} leaderKey={leader_key} />
                    )}

                    {tab === 'machinery' && (
                        <MachineryPanel
                            machinery={machinery}
                            staffs={staffs}
                            isLeader={isLeader}
                            publicToken={public_token}
                            leaderKey={leader_key}
                        />
                    )}

                    {tab === 'staff' && (
                    <>
                    {/* Quick filters */}
                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                        {[
                            ['all', `All ${stats.total}`, info === 'all' && status === 'all', () => { setInfo('all'); setStatus('all'); }],
                            ['incomplete', `Need details ${stats.incomplete}`, info === 'incomplete', () => setInfo(info === 'incomplete' ? 'all' : 'incomplete')],
                            ['active', `Active ${stats.active}`, status === 'active', () => setStatus(status === 'active' ? 'all' : 'active')],
                            ['inactive', `Inactive ${stats.inactive}`, status === 'inactive', () => setStatus(status === 'inactive' ? 'all' : 'inactive')],
                        ].map(([k, label, on, fn]) => (
                            <button key={k} onClick={fn} className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm font-bold transition ${on ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-700'}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Toolbar */}
                    <section className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
                                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search name, email, phone or role…"
                                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-10 text-base focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/20"
                                />
                                {query && (
                                    <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:bg-gray-100" aria-label="Clear search">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setFiltersOpen((o) => !o)}
                                    className={`relative inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition ${filtersOpen ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-700'}`}
                                >
                                    <SlidersHorizontal className="h-4 w-4" /> Filters
                                    {activeFilters > 0 && (
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-extrabold text-ink-900">{activeFilters}</span>
                                    )}
                                </button>
                                <div className="hidden rounded-2xl border border-gray-200 bg-gray-50 p-1 sm:flex">
                                    <button onClick={() => setViewMode('cards')} className={`rounded-xl p-2 ${viewMode === 'cards' ? 'bg-white shadow text-ink-900' : 'text-gray-400'}`} title="Cards"><LayoutGrid className="h-5 w-5" /></button>
                                    <button onClick={() => setViewMode('table')} className={`rounded-xl p-2 ${viewMode === 'table' ? 'bg-white shadow text-ink-900' : 'text-gray-400'}`} title="Table"><Rows3 className="h-5 w-5" /></button>
                                </div>
                                <button onClick={openAdd} className="sb-create !hidden sm:!inline-flex">
                                    <UserPlus className="h-4 w-4" /> Register staff
                                </button>
                            </div>
                        </div>

                        {filtersOpen && (
                            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 md:grid-cols-4">
                                <div>
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Information</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[['all', 'All'], ['complete', 'Complete'], ['incomplete', 'Incomplete']].map(([k, l]) => (
                                            <button key={k} onClick={() => setInfo(k)} className={pillBtn(info === k)}>{l}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</p>
                                    <div className="flex flex-wrap gap-2">
                                        {[['all', 'All'], ['active', 'Active'], ['inactive', 'Inactive']].map(([k, l]) => (
                                            <button key={k} onClick={() => setStatus(k)} className={pillBtn(status === k)}>{l}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Role</p>
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
                                    >
                                        <option value="all">All roles</option>
                                        <option value="__none">No role set</option>
                                        {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <p className="mb-2 flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400"><ArrowDownAZ className="h-3.5 w-3.5" /> Sort by</p>
                                    <select
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value)}
                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700"
                                    >
                                        {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                            <span>
                                Showing <b className="text-gray-800">{results.length}</b> of <b className="text-gray-800">{stats.total}</b> staff
                            </span>
                            {activeFilters > 0 && (
                                <button onClick={reset} className="inline-flex items-center gap-1.5 font-bold text-brand-800 hover:underline">
                                    <RotateCcw className="h-3.5 w-3.5" /> Clear filters
                                </button>
                            )}
                        </div>
                    </section>

                    {/* List */}
                    {stats.total === 0 ? (
                        <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
                            <Users className="mx-auto h-12 w-12 text-gray-300" />
                            <p className="mt-3 text-base font-extrabold text-gray-700">No staff registered yet</p>
                            <p className="mt-1 text-sm text-gray-400">Be the first — register your team so they can be assigned to projects.</p>
                            <button onClick={openAdd} className="sb-create mt-5">
                                <UserPlus className="h-4 w-4" /> Register staff
                            </button>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="rounded-3xl border border-gray-100 bg-white py-14 text-center shadow-sm">
                            <Search className="mx-auto h-10 w-10 text-gray-300" />
                            <p className="mt-3 text-base font-extrabold text-gray-700">No staff match your search</p>
                            <p className="mt-1 text-sm text-gray-400">Try a different keyword or clear the filters.</p>
                            <button onClick={reset} className="mt-4 rounded-2xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-brand-400">Clear filters</button>
                        </div>
                    ) : (
                        <StaffList
                            staffs={results}
                            query={query}
                            viewMode={viewMode}
                            onOpen={setSelected}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            isLeader={isLeader}
                            onToggleStatus={toggleStatus}
                        />
                    )}
                    </>
                    )}
                </main>

                {/* Floating register button – phones */}
                {tab === 'staff' && (
                <button
                    onClick={openAdd}
                    className="fixed bottom-24 right-4 z-30 flex h-14 items-center gap-2 rounded-full bg-brand-500 px-5 text-sm font-extrabold text-ink-900 shadow-xl shadow-black/30 active:scale-95 transition sm:hidden"
                >
                    <UserPlus className="h-5 w-5" /> Register
                </button>
                )}

                {/* Bottom navigation - phones & tablets */}
                <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-900 lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    <div className="mx-auto grid max-w-3xl" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
                        {tabs.map(({ key, short, Icon, count, warn }) => (
                            <button
                                key={key}
                                onClick={() => { setTab(key); window.scrollTo({ top: 0 }); }}
                                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold ${tab === key ? 'text-brand-400' : 'text-gray-400'}`}
                            >
                                <Icon className="h-6 w-6" />
                                {short}
                                {warn && count !== '' && <span className="absolute right-1/2 top-1 -mr-5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-extrabold text-ink-900">{count}</span>}
                                {tab === key && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-brand-500" />}
                            </button>
                        ))}
                    </div>
                </nav>
            </div>

            <StaffDrawer
                staff={selected}
                onClose={() => setSelected(null)}
                onEdit={openEdit}
                onDelete={handleDelete}
                canEdit={canEdit}
                canDelete={canDelete}
                isLeader={isLeader}
                publicToken={public_token}
                leaderKey={leader_key}
            />

            <AddStaffModal
                isOpen={showModal}
                onClose={closeModal}
                onSubmit={editingStaff ? submitEdit : submitAdd}
                data={editingStaff ? editForm.data : addForm.data}
                setData={editingStaff ? editForm.setData : addForm.setData}
                errors={editingStaff ? editForm.errors : addForm.errors}
                processing={editingStaff ? editForm.processing : addForm.processing}
                isEditing={!!editingStaff}
                isLeader={isLeader}
            />
        </>
    );
}
