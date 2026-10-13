// resources/js/Pages/SubconPublic/CompanyDetails.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import {
    Search, X, UserPlus, LayoutGrid, Rows3, Users, BadgeCheck, AlertTriangle, UserCheck, UserX, SlidersHorizontal,
    Mail, Phone, MapPin, ShieldCheck, Eye, ArrowDownAZ, RotateCcw, Pencil, Info, Crown,
} from 'lucide-react';
import { showAlert } from '@/Helpers/alert';
import StaffList from './Components/StaffList';
import StaffDrawer from './Components/StaffDrawer';
import AddStaffModal from './Components/AddStaffModal';
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

export default function CompanyDetails({ company, staffs = [], public_token, leader_key = null, access_level, role }) {
    const isLeader = access_level === 'full';
    const canEdit = isLeader;
    const canDelete = isLeader;

    // ---- UI state
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

    const pillBtn = (activeNow) =>
        `rounded-xl border px-3 py-2 text-xs font-bold transition ${activeNow ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`;

    return (
        <>
            <Head title={`${company.name} – Staff registration`} />

            <div className="min-h-screen bg-gray-100 pb-28">
                {/* Top bar */}
                <header className={isLeader ? 'bg-brand-500 text-ink-900' : 'bg-ink-900 text-white'}>
                    <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
                        <img src="/images/logo.png" alt="Safety Buddy" className={`h-10 w-10 rounded-full ring-2 ${isLeader ? 'ring-ink-900' : 'ring-brand-500'}`} />
                        <div className="min-w-0 flex-1 leading-tight">
                            <p className="truncate text-sm font-extrabold">Safety Buddy</p>
                            <p className={`text-[10px] font-bold uppercase tracking-wider ${isLeader ? 'text-ink-900/70' : 'text-brand-400'}`}>
                                {isLeader ? 'Leader console' : 'Subcontractor staff portal'}
                            </p>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold ${isLeader ? 'bg-ink-900 text-brand-400' : 'bg-white/10 text-gray-200'}`}>
                            {isLeader ? <Crown className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {isLeader ? 'Leader · edit & delete' : 'Staff · view & register'}
                        </span>
                    </div>
                </header>

                <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 lg:px-8">
                    {/* Company card */}
                    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg sm:p-6">
                        <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-500/20 blur-2xl" />
                        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-extrabold text-ink-900">
                                    {(company.name || '?').charAt(0).toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <h1 className="truncate text-xl font-extrabold sm:text-2xl">{company.name}</h1>
                                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-300">
                                        {company.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-brand-400" />{company.email}</span>}
                                        {company.contact && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-brand-400" />{company.contact}</span>}
                                        {company.address && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-brand-400" />{company.address}</span>}
                                    </div>
                                </div>
                            </div>

                            {/* overall completeness */}
                            <div className="w-full shrink-0 rounded-2xl bg-white/10 p-4 sm:w-60">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-xs font-bold text-gray-300">Staff info complete</span>
                                    <span className="text-lg font-extrabold text-brand-400">{stats.pct}%</span>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                                    <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${stats.pct}%` }} />
                                </div>
                                <p className="mt-2 text-[11px] text-gray-400">
                                    {stats.incomplete === 0 ? 'Everyone has complete details.' : `${stats.incomplete} of ${stats.total} still need details.`}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Role panel – clearly different for leader and staff */}
                    {isLeader ? (
                        <section className="overflow-hidden rounded-3xl border-2 border-brand-500 bg-white shadow-sm">
                            <div className="flex flex-col gap-3 bg-brand-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-brand-400">
                                        <Crown className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-extrabold text-ink-900">You are the team leader</p>
                                        <p className="text-xs text-ink-700">You can register, <b>edit</b>, activate / deactivate and <b>delete</b> staff of {company.name}.</p>
                                    </div>
                                </div>
                                <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-brand-400 active:scale-95 transition">
                                    <UserPlus className="h-4 w-4" /> Register staff
                                </button>
                            </div>

                            {stats.incomplete > 0 && (
                                <div className="px-5 py-4">
                                    <p className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700">
                                        <AlertTriangle className="h-4 w-4" /> Needs your attention ({stats.incomplete})
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {enriched.filter((s) => !s._info.isComplete).slice(0, 8).map((s) => (
                                            <button
                                                key={s.id}
                                                onClick={() => openEdit(s)}
                                                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-left text-xs font-bold text-amber-800 transition hover:bg-amber-100 active:scale-95"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                                {s.name}
                                                <span className="font-semibold text-amber-600">· {s._info.missing.map((m) => m.label).join(', ')}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    ) : (
                        <section className="flex items-start gap-3 rounded-3xl border border-sky-100 bg-sky-50 p-4 text-sky-900">
                            <Info className="mt-0.5 h-5 w-5 shrink-0 text-sky-500" />
                            <p className="text-sm">
                                <b>Staff view.</b> You can see everyone in {company.name} and register new colleagues.
                                To change or remove a record, please ask your <b>team leader</b>.
                            </p>
                        </section>
                    )}

                    {/* Summary / quick filters */}
                    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                        <SummaryCard icon={Users} label="Registered staff" value={stats.total} tone="neutral"
                            active={info === 'all' && status === 'all'} onClick={() => { setInfo('all'); setStatus('all'); }}
                            hint={stats.fresh ? `${stats.fresh} new this week` : 'All registered'} />
                        <SummaryCard icon={BadgeCheck} label="Complete" value={stats.complete} tone="green"
                            active={info === 'complete'} onClick={() => setInfo(info === 'complete' ? 'all' : 'complete')} hint="All details filled" />
                        <SummaryCard icon={AlertTriangle} label="Incomplete" value={stats.incomplete} tone="amber"
                            active={info === 'incomplete'} onClick={() => setInfo(info === 'incomplete' ? 'all' : 'incomplete')} hint="Missing phone / role" />
                        <SummaryCard icon={UserCheck} label="Active" value={stats.active} tone="green"
                            active={status === 'active'} onClick={() => setStatus(status === 'active' ? 'all' : 'active')} />
                        <SummaryCard icon={UserX} label="Inactive" value={stats.inactive} tone="gray"
                            active={status === 'inactive'} onClick={() => setStatus(status === 'inactive' ? 'all' : 'inactive')} />
                    </section>

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
                                <button onClick={openAdd} className="hidden items-center gap-2 rounded-2xl bg-brand-500 px-4 py-3 text-sm font-extrabold text-ink-900 shadow-md active:scale-95 transition sm:inline-flex">
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
                            <button onClick={openAdd} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-extrabold text-ink-900">
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
                </main>

                {/* Floating register button – phones */}
                <button
                    onClick={openAdd}
                    className="fixed bottom-5 right-5 z-30 flex h-14 items-center gap-2 rounded-full bg-brand-500 px-5 text-sm font-extrabold text-ink-900 shadow-xl shadow-black/30 active:scale-95 transition sm:hidden"
                >
                    <UserPlus className="h-5 w-5" /> Register
                </button>
            </div>

            <StaffDrawer
                staff={selected}
                onClose={() => setSelected(null)}
                onEdit={openEdit}
                onDelete={handleDelete}
                canEdit={canEdit}
                canDelete={canDelete}
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
