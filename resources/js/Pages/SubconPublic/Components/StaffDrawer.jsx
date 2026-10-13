// resources/js/Pages/SubconPublic/Components/StaffDrawer.jsx
// Side panel (bottom sheet on phones) showing one staff member's full record.
import React, { useEffect } from 'react';
import { X, Check, Minus, Pencil, Trash2, Phone, Mail, CalendarDays, Clock, BadgeCheck } from 'lucide-react';
import { REQUIRED_FIELDS, completeness, formatDate, timeAgo, initials, isActiveStatus } from './staffUtils';

export default function StaffDrawer({ staff, onClose, onEdit, onDelete, canEdit, canDelete }) {
    useEffect(() => {
        if (!staff) return undefined;
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [staff, onClose]);

    if (!staff) return null;
    const info = completeness(staff);
    const active = isActiveStatus(staff.status);

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-stretch sm:justify-end">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <div className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-none sm:max-w-md sm:rounded-none sm:rounded-l-3xl">
                {/* header */}
                <div className="relative bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white">
                    <button onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10" aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-4 pr-10">
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-brand-500 text-xl font-extrabold text-ink-900">
                            {initials(staff.name)}
                        </span>
                        <div className="min-w-0">
                            <h3 className="truncate text-lg font-extrabold">{staff.name}</h3>
                            <p className="truncate text-sm text-gray-300">{staff.role || 'No role set'}</p>
                            <span className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-gray-300'}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-gray-400'}`} />
                                {active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                    {/* completeness */}
                    <div className={`rounded-2xl border p-4 ${info.isComplete ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                        <div className="flex items-center justify-between">
                            <p className={`flex items-center gap-2 text-sm font-extrabold ${info.isComplete ? 'text-emerald-700' : 'text-amber-700'}`}>
                                <BadgeCheck className="h-5 w-5" />
                                {info.isComplete ? 'Information complete' : 'Information incomplete'}
                            </p>
                            <span className="text-sm font-extrabold text-gray-800">{info.pct}%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                            <div className={`h-full rounded-full ${info.isComplete ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${info.pct}%` }} />
                        </div>
                        {!info.isComplete && (
                            <p className="mt-2 text-xs text-amber-800">
                                Still needed: <b>{info.missing.map((m) => m.label).join(', ')}</b>
                            </p>
                        )}
                    </div>

                    {/* checklist */}
                    <div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Details</p>
                        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100">
                            {REQUIRED_FIELDS.map((f) => {
                                const value = staff[f.key];
                                const ok = String(value ?? '').trim() !== '';
                                return (
                                    <li key={f.key} className="flex items-center gap-3 px-4 py-3">
                                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${ok ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                            {ok ? <Check className="h-4 w-4" strokeWidth={3} /> : <Minus className="h-4 w-4" strokeWidth={3} />}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{f.label}</p>
                                            <p className={`truncate text-sm font-semibold ${ok ? 'text-gray-900' : 'text-red-500'}`}>{ok ? value : 'Not provided'}</p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* registration */}
                    <div>
                        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Registration</p>
                        <div className="space-y-2.5 rounded-2xl border border-gray-100 p-4 text-sm">
                            <p className="flex items-center gap-2 text-gray-700">
                                <CalendarDays className="h-4 w-4 text-gray-400" />
                                Registered on <b>{formatDate(staff.created_at)}</b>
                                <span className="text-xs text-gray-400">({timeAgo(staff.created_at)})</span>
                            </p>
                            <p className="flex items-center gap-2 text-gray-700">
                                <Clock className="h-4 w-4 text-gray-400" />
                                Last updated <b>{formatDate(staff.updated_at)}</b>
                            </p>
                        </div>
                    </div>

                    {/* quick contact */}
                    <div className="flex gap-2">
                        {staff.contact && (
                            <a href={`tel:${staff.contact}`} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink-900 py-3 text-sm font-bold text-brand-400">
                                <Phone className="h-4 w-4" /> Call
                            </a>
                        )}
                        {staff.email && (
                            <a href={`mailto:${staff.email}`} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-700">
                                <Mail className="h-4 w-4" /> Email
                            </a>
                        )}
                    </div>
                </div>

                {(canEdit || canDelete) && (
                    <div className="flex gap-3 border-t border-gray-100 p-4">
                        {canEdit && (
                            <button onClick={() => onEdit(staff)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3 text-sm font-extrabold text-ink-900 active:scale-95 transition">
                                <Pencil className="h-4 w-4" /> Edit
                            </button>
                        )}
                        {canDelete && (
                            <button onClick={() => onDelete(staff.id, staff.name)} className="flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-bold text-red-600 active:scale-95 transition">
                                <Trash2 className="h-4 w-4" /> Delete
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
