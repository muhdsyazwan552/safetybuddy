// resources/js/Pages/SubconPublic/Components/StaffList.jsx
import React from 'react';
import { Pencil, Trash2, ChevronRight, CheckCircle2, AlertCircle, Phone, Mail, BriefcaseBusiness } from 'lucide-react';
import { completeness, initials, formatDate, timeAgo, isNewThisWeek, isActiveStatus } from './staffUtils';

function CompleteBadge({ info }) {
    return info.isComplete ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Complete
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" /> {info.done}/{info.total}
        </span>
    );
}

function CompletenessBar({ info }) {
    const tone = info.isComplete ? 'bg-emerald-500' : info.pct >= 50 ? 'bg-amber-400' : 'bg-red-400';
    return (
        <div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div className={`h-full rounded-full transition-all ${tone}`} style={{ width: `${info.pct}%` }} />
            </div>
            {!info.isComplete && (
                <p className="mt-1.5 flex flex-wrap gap-1">
                    {info.missing.map((m) => (
                        <span key={m.key} className="rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600">
                            No {m.label}
                        </span>
                    ))}
                </p>
            )}
        </div>
    );
}

function StatusPill({ status }) {
    const active = isActiveStatus(status);
    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function StatusSwitch({ active, onChange, label }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label={label}
            onClick={(e) => { e.stopPropagation(); onChange(); }}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}
        >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
    );
}

function Avatar({ name, size = 'h-11 w-11 text-sm' }) {
    return (
        <span className={`flex shrink-0 items-center justify-center rounded-2xl bg-ink-900 font-extrabold text-brand-400 ${size}`}>
            {initials(name)}
        </span>
    );
}

export default function StaffList({ staffs, onOpen, onEdit, onDelete, canEdit, canDelete, isLeader = false, onToggleStatus, viewMode = 'cards', query = '' }) {
    if (staffs.length === 0) {
        return null;
    }

    const Mark = ({ text }) => {
        const q = query.trim();
        if (!q || !text) return <>{text || '-'}</>;
        const i = String(text).toLowerCase().indexOf(q.toLowerCase());
        if (i === -1) return <>{text}</>;
        return (
            <>
                {String(text).slice(0, i)}
                <mark className="rounded bg-brand-300 px-0.5 text-ink-900">{String(text).slice(i, i + q.length)}</mark>
                {String(text).slice(i + q.length)}
            </>
        );
    };

    if (viewMode === 'cards') {
        return (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {staffs.map((s) => {
                    const info = completeness(s);
                    return (
                        <div
                            key={s.id}
                            className={`group relative rounded-3xl border bg-white p-4 shadow-sm transition hover:shadow-md ${info.isComplete ? (isLeader ? 'border-brand-300' : 'border-gray-100') : 'border-amber-300'}`}
                        >
                            <button type="button" onClick={() => onOpen(s)} className="absolute inset-0 rounded-3xl" aria-label={`View ${s.name}`} />

                            <div className="relative flex items-start gap-3">
                                <Avatar name={s.name} />
                                <div className="min-w-0 flex-1">
                                    <p className="flex flex-wrap items-center gap-2 text-[15px] font-extrabold text-gray-900">
                                        <span className="truncate"><Mark text={s.name} /></span>
                                        {isNewThisWeek(s) && <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-extrabold text-ink-900">NEW</span>}
                                    </p>
                                    <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-gray-500">
                                        <BriefcaseBusiness className="h-3.5 w-3.5 shrink-0" />
                                        {s.role ? <Mark text={s.role} /> : <span className="font-semibold text-red-500">No role</span>}
                                    </p>
                                </div>
                                <StatusPill status={s.status} />
                            </div>

                            <div className="relative mt-3 space-y-1.5 text-xs">
                                <p className="flex items-center gap-2 truncate text-gray-600">
                                    <Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" /> <Mark text={s.email} />
                                </p>
                                <p className="flex items-center gap-2 truncate">
                                    <Phone className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                                    {s.contact ? <span className="text-gray-600"><Mark text={s.contact} /></span> : <span className="font-semibold text-red-500">No phone number</span>}
                                </p>
                            </div>

                            <div className="relative mt-4 border-t border-gray-100 pt-3">
                                <div className="mb-2 flex items-center justify-between">
                                    <CompleteBadge info={info} />
                                    <span className="text-[11px] text-gray-400" title={formatDate(s.created_at, true)}>
                                        Registered {timeAgo(s.created_at)}
                                    </span>
                                </div>
                                <CompletenessBar info={info} />
                            </div>

                            {isLeader && (canEdit || canDelete) ? (
                                <div className="relative -mx-4 -mb-4 mt-4 flex items-center gap-2 rounded-b-3xl border-t border-brand-200 bg-brand-100/60 px-4 py-3">
                                    <label className="mr-auto flex items-center gap-2 text-[11px] font-bold text-ink-900">
                                        <StatusSwitch active={isActiveStatus(s.status)} onChange={() => onToggleStatus?.(s)} label="Toggle active" />
                                        {isActiveStatus(s.status) ? 'Active' : 'Inactive'}
                                    </label>
                                    {canEdit && (
                                        <button onClick={() => onEdit(s)} className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-3 py-2 text-xs font-bold text-brand-400 active:scale-95 transition">
                                            <Pencil className="h-3.5 w-3.5" /> Edit
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button onClick={() => onDelete(s.id, s.name)} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 active:scale-95 transition">
                                            <Trash2 className="h-3.5 w-3.5" /> Delete
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="relative mt-3 flex justify-end">
                                    <button onClick={() => onOpen(s)} className="inline-flex items-center gap-1 text-xs font-bold text-brand-800">
                                        View details <ChevronRight className="h-4 w-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    // Table view
    return (
        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <tr>
                        <th className="w-12 px-4 py-3">#</th>
                        <th className="px-4 py-3">Staff</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Information</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Registered</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {staffs.map((s, i) => {
                        const info = completeness(s);
                        return (
                            <tr key={s.id} className={`cursor-pointer transition hover:bg-gray-50 ${info.isComplete ? '' : 'bg-amber-50/40'}`} onClick={() => onOpen(s)}>
                                <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar name={s.name} size="h-9 w-9 text-xs" />
                                        <div className="min-w-0">
                                            <p className="truncate font-bold text-gray-900"><Mark text={s.name} /> {isNewThisWeek(s) && <span className="ml-1 rounded-full bg-brand-500 px-1.5 py-0.5 text-[9px] font-extrabold text-ink-900">NEW</span>}</p>
                                            <p className="truncate text-xs text-gray-500"><Mark text={s.email} /></p>
                                        </div>
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3">{s.contact ? <Mark text={s.contact} /> : <span className="text-xs font-bold text-red-500">Missing</span>}</td>
                                <td className="px-4 py-3">{s.role ? <Mark text={s.role} /> : <span className="text-xs font-bold text-red-500">Missing</span>}</td>
                                <td className="w-44 px-4 py-3">
                                    <div className="mb-1"><CompleteBadge info={info} /></div>
                                    <CompletenessBar info={{ ...info, missing: [] }} />
                                </td>
                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                    {isLeader ? (
                                        <div className="flex items-center gap-2">
                                            <StatusSwitch active={isActiveStatus(s.status)} onChange={() => onToggleStatus?.(s)} label="Toggle active" />
                                            <span className="text-xs font-bold text-gray-600">{isActiveStatus(s.status) ? 'Active' : 'Inactive'}</span>
                                        </div>
                                    ) : (
                                        <StatusPill status={s.status} />
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                                    {formatDate(s.created_at)}
                                    <span className="block text-[11px] text-gray-400">{timeAgo(s.created_at)}</span>
                                </td>
                                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex justify-end gap-1.5">
                                        <button onClick={() => onOpen(s)} className="flex h-8 w-8 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100" title="Details"><ChevronRight className="h-4 w-4" /></button>
                                        {canEdit && <button onClick={() => onEdit(s)} className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-3 py-1.5 text-xs font-bold text-brand-400" title="Edit"><Pencil className="h-3.5 w-3.5" /> Edit</button>}
                                        {canDelete && <button onClick={() => onDelete(s.id, s.name)} className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600" title="Delete"><Trash2 className="h-3.5 w-3.5" /> Delete</button>}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
