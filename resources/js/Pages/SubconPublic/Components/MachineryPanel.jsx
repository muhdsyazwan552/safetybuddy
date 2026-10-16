// resources/js/Pages/SubconPublic/Components/MachineryPanel.jsx
// Machinery records (leader adds / edits). Matches the "1 machinery record" mock-up.
import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Tractor, Paperclip, ChevronRight, X, Loader2, Save, Info, Lock, FileUp, AlertCircle } from 'lucide-react';
import { showAlert } from '@/Helpers/alert';
import { formatDate } from './staffUtils';

const field =
    'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/20';

function expiryState(date) {
    if (!date) return null;
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    if (days < 0) return { label: 'Expired', cls: 'bg-red-100 text-red-700' };
    if (days <= 30) return { label: `Expires in ${days}d`, cls: 'bg-amber-100 text-amber-700' };
    return null;
}

function MachineryModal({ open, onClose, machine, staffs, publicToken, leaderKey }) {
    const editing = !!machine;
    const form = useForm({
        name: machine?.name || '',
        identifier: machine?.identifier || '',
        cf_expiry: machine?.cf_expiry || '',
        operator_id: machine?.operator_id || '',
        cf_file: null,
        remove_cf_file: false,
        leader_key: leaderKey,
    });

    if (!open) return null;

    const submit = (e) => {
        e.preventDefault();
        const url = editing
            ? `/subcon/${publicToken}/machinery/${machine.id}`
            : `/subcon/${publicToken}/machinery`;
        form.transform((d) => ({ ...d, operator_id: d.operator_id || '', cf_expiry: d.cf_expiry || '' }));
        form.post(url, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                showAlert.success(editing ? 'Machinery updated.' : 'Machinery added.', 'Saved');
                onClose();
            },
        });
    };

    const err = form.errors;
    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <form onSubmit={submit} className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-brand-400"><Tractor className="h-5 w-5" /></span>
                        <h3 className="text-base font-extrabold text-gray-900">{editing ? 'Edit machinery' : 'Add machinery'}</h3>
                    </div>
                    <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600" aria-label="Close"><X className="h-5 w-5" /></button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Machinery name *</label>
                        <input className={field} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="e.g. Excavator EX-01" required />
                        {err.name && <p className="mt-1 text-xs font-medium text-red-500">{err.name}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Plate / serial number</label>
                        <input className={field} value={form.data.identifier} onChange={(e) => form.setData('identifier', e.target.value)} placeholder="optional" />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Certificate of Fitness (CF) attachment</label>
                        <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 transition hover:border-brand-500">
                            <FileUp className="h-5 w-5 shrink-0 text-gray-400" />
                            <span className="min-w-0 flex-1 truncate">
                                {form.data.cf_file ? form.data.cf_file.name : machine?.cf_attached && !form.data.remove_cf_file ? 'CF attached – tap to replace' : 'Upload PDF or photo (max 5 MB)'}
                            </span>
                            <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => form.setData('cf_file', e.target.files?.[0] || null)} />
                        </label>
                        {machine?.cf_attached && !form.data.cf_file && (
                            <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-gray-500">
                                <input type="checkbox" checked={form.data.remove_cf_file} onChange={(e) => form.setData('remove_cf_file', e.target.checked)} className="rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
                                Remove the current attachment
                            </label>
                        )}
                        {err.cf_file && <p className="mt-1 text-xs font-medium text-red-500">{err.cf_file}</p>}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">CF expiry date</label>
                            <input type="date" className={field} value={form.data.cf_expiry} onChange={(e) => form.setData('cf_expiry', e.target.value)} />
                            {err.cf_expiry && <p className="mt-1 text-xs font-medium text-red-500">{err.cf_expiry}</p>}
                        </div>
                        <div>
                            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Operator</label>
                            <select className={field} value={form.data.operator_id} onChange={(e) => form.setData('operator_id', e.target.value)}>
                                <option value="">— none —</option>
                                {staffs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <p className="flex items-start gap-2 rounded-2xl bg-gray-50 p-3 text-xs text-gray-500">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" /> An attachment does not confirm machinery approval.
                    </p>
                </div>

                <div className="flex gap-3 border-t border-gray-100 p-4">
                    <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-700">Cancel</button>
                    <button type="submit" disabled={form.processing} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3 text-sm font-extrabold text-ink-900 shadow-md active:scale-95 transition disabled:opacity-50">
                        {form.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {editing ? 'Save changes' : 'Add machinery'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function MachineryPanel({ machinery = [], staffs = [], isLeader, publicToken, leaderKey }) {
    const [modal, setModal] = useState({ open: false, machine: null });

    const remove = async (m) => {
        const ok = await showAlert.confirmDelete(`"${m.name}" and its CF attachment will be removed.`, 'Remove this machinery?', { confirmText: 'Yes, remove' });
        if (!ok) return;
        router.delete(`/subcon/${publicToken}/machinery/${m.id}`, { data: { leader_key: leaderKey }, preserveScroll: true });
    };

    return (
        <div className="mx-auto max-w-2xl space-y-4">
            <div className="flex items-end justify-between">
                <p className="text-lg font-extrabold text-gray-900">
                    {machinery.length} machinery record{machinery.length === 1 ? '' : 's'}
                </p>
            </div>

            <div className="space-y-3">
                {machinery.map((m) => {
                    const exp = expiryState(m.cf_expiry);
                    return (
                        <div key={m.id} className="group relative flex items-center gap-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
                            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-ink-900">
                                <Tractor className="h-9 w-9" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-lg font-extrabold text-gray-900">{m.name}{m.identifier ? <span className="ml-2 text-sm font-semibold text-gray-400">{m.identifier}</span> : null}</p>
                                <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[15px] text-gray-600">
                                    <span>CF:{' '}
                                        {m.cf_attached ? (
                                            <a href={m.cf_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-gray-800 underline decoration-gray-300 underline-offset-2">
                                                <Paperclip className="h-3.5 w-3.5" /> Attached
                                            </a>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 font-bold text-red-500"><AlertCircle className="h-3.5 w-3.5" /> Missing</span>
                                        )}
                                    </span>
                                </p>
                                <p className="text-[15px] text-gray-600">
                                    Expiry: <span className="font-semibold text-gray-800">{m.cf_expiry ? formatDate(m.cf_expiry) : '—'}</span>
                                    {exp && <span className={`ml-2 rounded-full px-2 py-0.5 text-[11px] font-extrabold ${exp.cls}`}>{exp.label}</span>}
                                </p>
                                <p className="text-[15px] text-gray-600">Operator: <span className="font-semibold text-gray-800">{m.operator_name || '—'}</span></p>
                            </div>

                            {isLeader ? (
                                <div className="flex shrink-0 flex-col gap-1.5">
                                    <button onClick={() => setModal({ open: true, machine: m })} className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-900 text-brand-400" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                                    <button onClick={() => remove(m)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                                </div>
                            ) : (
                                <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
                            )}
                        </div>
                    );
                })}

                {machinery.length === 0 && (
                    <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white py-12 text-center">
                        <Tractor className="mx-auto h-12 w-12 text-gray-300" />
                        <p className="mt-3 font-extrabold text-gray-700">No machinery registered</p>
                        <p className="text-sm text-gray-400">Excavators, cranes, lorries and other machines used on site.</p>
                    </div>
                )}
            </div>

            {isLeader ? (
                <button
                    onClick={() => setModal({ open: true, machine: null })}
                    className="sb-create w-full"
                >
                    <Plus className="h-6 w-6" strokeWidth={3} /> Add Machinery
                </button>
            ) : (
                <p className="flex items-center gap-2 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-900">
                    <Lock className="h-4 w-4 shrink-0 text-sky-500" /> Only the company leader can add or update machinery.
                </p>
            )}

            <p className="flex items-start gap-2.5 px-1 text-[15px] text-gray-500">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                <span>An <b>attachment</b> does not confirm machinery approval.</span>
            </p>

            {modal.open && (
                <MachineryModal
                    key={modal.machine?.id || 'new'}
                    open
                    onClose={() => setModal({ open: false, machine: null })}
                    machine={modal.machine}
                    staffs={staffs}
                    publicToken={publicToken}
                    leaderKey={leaderKey}
                />
            )}
        </div>
    );
}
