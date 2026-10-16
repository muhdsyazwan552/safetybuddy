// resources/js/Pages/SubconPublic/Components/CertificationsSection.jsx
// Certification records of one staff member. Anyone can upload, only the leader can remove.
import React, { useRef } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Award, FileText, Trash2, Upload, Loader2, AlertCircle } from 'lucide-react';
import { showAlert } from '@/Helpers/alert';
import { formatDate } from './staffUtils';

function expiry(date) {
    if (!date) return null;
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    if (days < 0) return { text: 'Expired', cls: 'bg-red-100 text-red-700' };
    if (days <= 60) return { text: `${days}d left`, cls: 'bg-amber-100 text-amber-700' };
    return null;
}

export default function CertificationsSection({ staff, publicToken, leaderKey, isLeader }) {
    const fileRef = useRef(null);
    const form = useForm({ title: '', expiry_date: '', file: null });
    const certs = staff.certifications || [];

    const submit = (e) => {
        e.preventDefault();
        form.transform((d) => ({ ...d, expiry_date: d.expiry_date || '' }));
        form.post(`/subcon/${publicToken}/staff/${staff.id}/certifications`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                if (fileRef.current) fileRef.current.value = '';
                showAlert.success('Certification uploaded.', 'Saved');
            },
        });
    };

    const remove = async (c) => {
        const ok = await showAlert.confirmDelete(`"${c.title}" will be removed from ${staff.name}.`, 'Remove this certification?', { confirmText: 'Yes, remove' });
        if (!ok) return;
        router.delete(`/subcon/${publicToken}/staff/${staff.id}/certifications/${c.id}`, { data: { leader_key: leaderKey }, preserveScroll: true });
    };

    const err = form.errors;
    const input = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/20';

    return (
        <div>
            <p className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <Award className="h-4 w-4" /> Certification records ({certs.length})
            </p>

            {certs.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">No certification uploaded yet.</p>
            ) : (
                <ul className="space-y-2">
                    {certs.map((c) => {
                        const ex = expiry(c.expiry_date);
                        return (
                            <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3">
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-900"><FileText className="h-5 w-5" /></span>
                                <div className="min-w-0 flex-1">
                                    <a href={c.file_url} target="_blank" rel="noreferrer" className="block truncate text-sm font-bold text-gray-900 hover:underline">{c.title}</a>
                                    <p className="text-[11px] text-gray-500">
                                        {c.expiry_date ? `Expires ${formatDate(c.expiry_date)}` : 'No expiry date'}
                                        {ex && <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${ex.cls}`}>{ex.text}</span>}
                                    </p>
                                </div>
                                {isLeader && (
                                    <button onClick={() => remove(c)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-500 hover:bg-red-50" aria-label="Remove"><Trash2 className="h-4 w-4" /></button>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* upload */}
            <form onSubmit={submit} className="mt-3 space-y-2.5 rounded-2xl border border-gray-200 bg-gray-50 p-3.5">
                <p className="text-xs font-extrabold text-gray-700">Upload a certification</p>
                <div>
                    <input className={input} placeholder="Certificate name (e.g. Welding, Working at Height)" value={form.data.title} onChange={(e) => form.setData('title', e.target.value)} />
                    {err.title && <p className="mt-1 text-xs text-red-500">{err.title}</p>}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                    <div>
                        <input type="date" className={input} value={form.data.expiry_date} onChange={(e) => form.setData('expiry_date', e.target.value)} title="Expiry date (optional)" />
                        {err.expiry_date && <p className="mt-1 text-xs text-red-500">{err.expiry_date}</p>}
                    </div>
                    <label className="flex cursor-pointer items-center justify-center gap-2 truncate rounded-xl border border-dashed border-gray-300 bg-white px-3 py-2.5 text-xs font-bold text-gray-600 hover:border-brand-500">
                        <Upload className="h-4 w-4 shrink-0" />
                        <span className="truncate">{form.data.file ? form.data.file.name : 'Choose file'}</span>
                        <input ref={fileRef} type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => form.setData('file', e.target.files?.[0] || null)} />
                    </label>
                </div>
                {err.file && <p className="flex items-center gap-1 text-xs text-red-500"><AlertCircle className="h-3.5 w-3.5" />{err.file}</p>}
                <button type="submit" disabled={form.processing || !form.data.title.trim() || !form.data.file} className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink-900 py-2.5 text-sm font-bold text-brand-400 active:scale-95 transition disabled:opacity-40">
                    {form.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
                </button>
                <p className="text-[11px] text-gray-400">PDF or image, up to 5 MB.</p>
            </form>
        </div>
    );
}
