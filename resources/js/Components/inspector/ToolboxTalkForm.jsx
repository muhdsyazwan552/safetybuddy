import React, { useState } from 'react';
import { Camera, X, Check, Minus, Plus, Loader2, Save } from 'lucide-react';
import { ActionBar, Field, inputClass, labelClass, ghostBtn, primaryBtn } from '@/Components/inspector/kit';

const MAX = 2 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

function PhotoPicker({ label, preview, existing, error, onPick, onClear }) {
    const shown = preview || existing;
    return (
        <div>
            <p className={labelClass}>{label}</p>
            {shown ? (
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                    <img src={shown} alt={label} className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/90 py-2 text-xs font-bold text-gray-800">
                            <Camera className="h-4 w-4" /> Replace
                            <input type="file" accept="image/*" className="hidden" onChange={onPick} />
                        </label>
                        {preview && (
                            <button type="button" onClick={onClear} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-red-600" aria-label="Remove">
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <label className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 active:bg-brand-100 transition">
                    <Camera className="h-7 w-7" />
                    <span className="text-xs font-bold">Tap to take / upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={onPick} />
                </label>
            )}
            {error && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
}

/**
 * Shared Create / Edit toolbox talk form.
 *  projects: [{ id, name }]   topics: [{ id, name }]
 *  initial:  { project_id, inspection_date, is_conducted (1|0|null), total_attended, topics: [ids] }
 *  onSubmit(payload, { setErrors, setSaving })
 */
export default function ToolboxTalkForm({ projects, topics, initial, conductor, existingImages = {}, serverErrors = {}, submitLabel = 'Save record', onSubmit }) {
    const [data, setData] = useState({
        project_id: initial.project_id ?? '',
        inspection_date: initial.inspection_date ?? new Date().toISOString().split('T')[0],
        is_conducted: initial.is_conducted ?? null,
        total_attended: initial.total_attended ?? '',
        topics: initial.topics ?? [],
    });
    const [files, setFiles] = useState({ img_group: null, img_attendance: null });
    const [previews, setPreviews] = useState({ img_group: null, img_attendance: null });
    const [photoErrors, setPhotoErrors] = useState({});
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const err = { ...serverErrors, ...errors };
    const set = (k, v) => {
        setData((d) => ({ ...d, [k]: v }));
        if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
    };
    const toggleTopic = (id) =>
        set('topics', data.topics.includes(id) ? data.topics.filter((t) => t !== id) : [...data.topics, id]);

    const pick = (field) => (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!TYPES.includes(file.type)) return setPhotoErrors((p) => ({ ...p, [field]: 'Only JPEG, PNG or WEBP images are allowed.' }));
        if (file.size > MAX) return setPhotoErrors((p) => ({ ...p, [field]: 'Image must be smaller than 2 MB.' }));
        setPhotoErrors((p) => ({ ...p, [field]: null }));
        setFiles((f) => ({ ...f, [field]: file }));
        setPreviews((p) => ({ ...p, [field]: URL.createObjectURL(file) }));
    };
    const clear = (field) => {
        setFiles((f) => ({ ...f, [field]: null }));
        setPreviews((p) => ({ ...p, [field]: null }));
    };

    const submit = (e) => {
        e?.preventDefault();
        const v = {};
        if (!data.project_id) v.project_id = 'Select a project.';
        if (!data.inspection_date) v.inspection_date = 'Select a date.';
        if (data.is_conducted === null) v.is_conducted = 'Choose whether the talk was conducted.';
        if (data.is_conducted === 1) {
            if (!Number(data.total_attended)) v.total_attended = 'Enter the number of workers.';
            if (data.topics.length === 0) v.topics = 'Select at least one topic.';
        }
        if (Object.keys(v).length) return setErrors(v);

        const payload = {
            project_id: data.project_id,
            inspection_date: data.inspection_date,
            is_conducted: data.is_conducted,
            total_attended: data.is_conducted === 1 ? data.total_attended : 0,
        };
        if (data.is_conducted === 1) {
            payload.conducted = conductor || '';
            payload.topics = data.topics;
            if (files.img_group) payload.img_group = files.img_group;
            if (files.img_attendance) payload.img_attendance = files.img_attendance;
        }
        setSaving(true);
        onSubmit(payload, { setErrors, setSaving });
    };

    const yes = data.is_conducted === 1;

    return (
        <form onSubmit={submit}>
            <div className="mx-auto max-w-2xl space-y-4 px-4 pb-40 pt-5 sm:px-6 lg:pb-32">
                {/* General */}
                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
                    <Field label="Project *" error={err.project_id}>
                        <select className={inputClass} value={data.project_id} onChange={(e) => set('project_id', e.target.value)}>
                            <option value="">Select a project</option>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Date of talk *" error={err.inspection_date}>
                        <input type="date" className={inputClass} value={data.inspection_date} onChange={(e) => set('inspection_date', e.target.value)} />
                    </Field>
                </div>

                {/* Conducted? */}
                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="mb-3 text-center text-sm font-bold text-gray-800">Was the briefing conducted?</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => set('is_conducted', 1)}
                            className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-4 text-sm font-extrabold transition active:scale-95 ${yes ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-400'}`}
                        >
                            <Check className="h-5 w-5" /> Yes, conducted
                        </button>
                        <button
                            type="button"
                            onClick={() => set('is_conducted', 0)}
                            className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-4 text-sm font-extrabold transition active:scale-95 ${data.is_conducted === 0 ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-400'}`}
                        >
                            <X className="h-5 w-5" /> No, skipped
                        </button>
                    </div>
                    {err.is_conducted && <p className="mt-2 text-center text-xs font-medium text-red-500">{err.is_conducted}</p>}
                </div>

                {yes && (
                    <>
                        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
                            <Field label="Conductor">
                                <input type="text" className={inputClass} value={conductor || ''} disabled readOnly />
                            </Field>

                            <Field label="Total workers *" error={err.total_attended}>
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => set('total_attended', Math.max(0, Number(data.total_attended || 0) - 1))} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 text-gray-700 active:scale-95 transition" aria-label="Decrease">
                                        <Minus className="h-5 w-5" />
                                    </button>
                                    <input type="number" inputMode="numeric" min="0" className={`${inputClass} text-center text-xl font-extrabold`} value={data.total_attended} onChange={(e) => set('total_attended', e.target.value)} placeholder="0" />
                                    <button type="button" onClick={() => set('total_attended', Number(data.total_attended || 0) + 1)} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-ink-900 active:scale-95 transition" aria-label="Increase">
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>
                            </Field>
                        </div>

                        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <p className={`${labelClass} !mb-0`}>Safety topics *</p>
                                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-900">{data.topics.length} selected</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {topics.map((t) => {
                                    const on = data.topics.includes(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => toggleTopic(t.id)}
                                            className={`flex items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left text-sm font-semibold transition active:scale-[0.98] ${on ? 'border-brand-500 bg-brand-100 text-ink-900' : 'border-gray-200 bg-white text-gray-600'}`}
                                        >
                                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${on ? 'bg-brand-500 text-ink-900' : 'border border-gray-300'}`}>
                                                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                                            </span>
                                            {t.name}
                                        </button>
                                    );
                                })}
                            </div>
                            {err.topics && <p className="mt-2 text-xs font-medium text-red-500">{err.topics}</p>}
                        </div>

                        <div className="grid grid-cols-1 gap-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:grid-cols-2">
                            <PhotoPicker
                                label="Group photo"
                                preview={previews.img_group}
                                existing={existingImages.img_group}
                                error={photoErrors.img_group || err.img_group}
                                onPick={pick('img_group')}
                                onClear={() => clear('img_group')}
                            />
                            <PhotoPicker
                                label="Attendance sheet"
                                preview={previews.img_attendance}
                                existing={existingImages.img_attendance}
                                error={photoErrors.img_attendance || err.img_attendance}
                                onPick={pick('img_attendance')}
                                onClear={() => clear('img_attendance')}
                            />
                        </div>
                    </>
                )}
            </div>

            <ActionBar>
                <button type="button" onClick={() => window.history.back()} disabled={saving} className={ghostBtn}>Cancel</button>
                <button type="submit" disabled={saving} className={primaryBtn}>
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> {submitLabel}</>}
                </button>
            </ActionBar>
        </form>
    );
}
