import React, { useState } from 'react';
import { Camera, X, Check, Loader2, Save, Users, Search } from 'lucide-react';
import { ActionBar, Field, inputClass, labelClass, ghostBtn, primaryBtn } from '@/Components/inspector/kit';
import SpPerSubcon, { spGroups } from '@/Components/shared/SpPerSubcon';

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


/** Tick the subcontractor staff who attended – their count is the total attendance. */
function AttendeeSelect({ staff, value, onChange, error, projectSelected }) {
    const [q, setQ] = useState('');
    const sel = new Set(value.map(Number));
    const needle = q.trim().toLowerCase();

    const groups = [];
    staff.forEach((s) => {
        if (needle && !`${s.name} ${s.role || ''} ${s.company_name}`.toLowerCase().includes(needle)) return;
        let g = groups.find((x) => x.id === s.company_id);
        if (!g) { g = { id: s.company_id, name: s.company_name, people: [] }; groups.push(g); }
        g.people.push(s);
    });

    const toggle = (id) => {
        const next = new Set(sel);
        next.has(id) ? next.delete(id) : next.add(id);
        onChange([...next]);
    };
    const toggleGroup = (g) => {
        const ids = g.people.map((p) => p.id);
        const all = ids.every((id) => sel.has(id));
        const next = new Set(sel);
        ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
        onChange([...next]);
    };

    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <p className={`${labelClass} !mb-0`}>Who attended?</p>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1 text-xs font-extrabold text-brand-400">
                    <Users className="h-3.5 w-3.5" /> Total: {sel.size}
                </span>
            </div>

            {!projectSelected ? (
                <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center text-sm text-gray-500">Choose the project first.</p>
            ) : staff.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-5 text-center text-sm text-amber-800">No subcontractor staff registered for this project yet.</p>
            ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200">
                    <div className="relative border-b border-gray-100 bg-gray-50 p-2">
                        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or company…" className="w-full rounded-xl border-0 bg-white py-2.5 pl-9 pr-3 text-base focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                        {groups.map((g) => {
                            const all = g.people.every((p) => sel.has(p.id));
                            return (
                                <div key={g.id}>
                                    <div className="flex items-center justify-between bg-gray-100 px-4 py-2">
                                        <p className="truncate text-[11px] font-extrabold uppercase tracking-wider text-gray-600">{g.name}</p>
                                        <button type="button" onClick={() => toggleGroup(g)} className="shrink-0 text-xs font-bold text-brand-800">{all ? 'Clear' : 'Select all'}</button>
                                    </div>
                                    {g.people.map((p) => {
                                        const on = sel.has(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => toggle(p.id)}
                                                className={`flex w-full items-center gap-3 border-t border-gray-100 px-4 py-3.5 text-left active:bg-gray-50 ${on ? 'bg-brand-100/60' : 'bg-white'}`}
                                            >
                                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 ${on ? 'border-brand-600 bg-brand-500 text-ink-900' : 'border-gray-300'}`}>
                                                    {on && <Check className="h-4 w-4" strokeWidth={3} />}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[15px] font-semibold text-gray-900">{p.name}</span>
                                                    {p.role && <span className="block truncate text-xs text-gray-500">{p.role}</span>}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                        {groups.length === 0 && <p className="p-5 text-center text-sm text-gray-400">No staff match your search.</p>}
                    </div>
                </div>
            )}
            {error && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
}

/**
 * Shared Create / Edit toolbox talk form.
 *  projects: [{ id, name }]   topics: [{ id, name }]  (the toolbox CATEGORY list)
 *  initial:  { project_id, inspection_date, is_conducted (1|0|null), total_attended, categories: [ids] }
 *  onSubmit(payload, { setErrors, setSaving })
 */
export default function ToolboxTalkForm({ projects, topics, initial, conductor, staffByProject = {}, existingImages = {}, serverErrors = {}, submitLabel = 'Save record', onSubmit, embedded = false, onCancel = null, cancelLabel = 'Cancel', actionBarLeft = '', wide = false }) {
    const [data, setData] = useState({
        project_id: initial.project_id ?? '',
        inspection_date: initial.inspection_date ?? new Date().toISOString().split('T')[0],
        is_conducted: initial.is_conducted ?? (embedded ? 1 : null),
        attendees: initial.attendees ?? [],
        sp: initial.sp ?? {},
        categories: initial.categories ?? [],
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
        set('categories', data.categories.includes(id) ? data.categories.filter((t) => t !== id) : [...data.categories, id]);

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
        if (data.attendees.length === 0) v.attendees = 'Select at least one person for Safety Passport sampling.';
        if (data.is_conducted === 1) {
            if (data.attendees.length === 0) v.attendees = 'Tick at least one staff member who attended.';
            if (data.categories.length === 0) v.categories = 'Select at least one category.';
        }
        if (data.attendees.length > 0) {
            const over = spGroups(staffByProject[data.project_id] || [], data.attendees).some((g) => Number(data.sp[g.id] || 0) > g.sampled);
            if (over) v.sp = 'Workers not registered cannot be more than the workers sampled for a company.';
        }
        if (Object.keys(v).length) return setErrors(v);

        const payload = {
            project_id: data.project_id,
            inspection_date: data.inspection_date,
            is_conducted: data.is_conducted,
            attendees: data.attendees,
        };
        // Safety Passport sampling is recorded for every talk: { company id: not registered }
        payload.sp = Object.fromEntries(
            spGroups(staffByProject[data.project_id] || [], data.attendees).map((g) => [g.id, Number(data.sp[g.id] || 0)]),
        );
        if (data.is_conducted === 1) {
            payload.conducted = conductor || '';
            payload.categories = data.categories;
            if (files.img_group) payload.img_group = files.img_group;
            if (files.img_attendance) payload.img_attendance = files.img_attendance;
        }
        setSaving(true);
        onSubmit(payload, { setErrors, setSaving });
    };

    const yes = data.is_conducted === 1;

    return (
        <form onSubmit={submit}>
            <div className={wide ? 'mx-auto grid max-w-6xl grid-cols-1 items-start gap-4 px-4 pb-6 pt-5 sm:px-6 lg:grid-cols-2' : 'mx-auto max-w-2xl space-y-4 px-4 pb-32 pt-5 sm:px-6 lg:pb-32'}>
                {/* General */}
                {!embedded && (
                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
                    <Field label="Project *" error={err.project_id}>
                        <select className={inputClass} value={data.project_id} onChange={(e) => setData((d) => ({ ...d, project_id: e.target.value, attendees: [] }))}>
                            <option value="">Select a project</option>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Date of talk *" error={err.inspection_date}>
                        <input type="date" className={inputClass} value={data.inspection_date} onChange={(e) => set('inspection_date', e.target.value)} />
                    </Field>
                </div>

                )}

                {/* Conducted? (the site visit flow asks this on its first screen) */}
                {!embedded && (
                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <p className="mb-3 text-center text-sm font-bold text-gray-800">Do you want to conduct a Toolbox Talk?</p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => set('is_conducted', 1)}
                            className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-4 text-sm font-extrabold transition active:scale-95 ${yes ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-gray-400'}`}
                        >
                            <Check className="h-5 w-5 shrink-0" /> <span className="px-1 text-center leading-snug">Yes &ndash; Proceed with Toolbox Talk.</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => set('is_conducted', 0)}
                            className={`flex items-center justify-center gap-2 rounded-2xl border-2 py-4 text-sm font-extrabold transition active:scale-95 ${data.is_conducted === 0 ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-400'}`}
                        >
                            <X className="h-5 w-5 shrink-0" /> <span className="px-1 text-center leading-snug">No &ndash; Skip to Safety Passport Sampling.</span>
                        </button>
                    </div>
                    {err.is_conducted && <p className="mt-2 text-center text-xs font-medium text-red-500">{err.is_conducted}</p>}
                </div>

                )}

                {/* Attendance (Yes and No) + Safety Passport sampling (No only) */}
                {data.is_conducted !== null && (
                    <>
                        <div className={`rounded-3xl border border-gray-100 bg-white p-5 shadow-sm ${wide ? 'lg:row-span-3' : ''}`}>
                            <AttendeeSelect
                                staff={staffByProject[data.project_id] || []}
                                value={data.attendees}
                                onChange={(ids) => set('attendees', ids)}
                                projectSelected={!!data.project_id}
                                error={err.attendees}
                            />
                            {!yes && <p className="mt-3 text-xs text-gray-400">Optional when the talk was not conducted.</p>}
                        </div>

                        <SpPerSubcon
                            staff={staffByProject[data.project_id] || []}
                            attendees={data.attendees}
                            value={data.sp}
                            onChange={(value) => set('sp', value)}
                            error={err.sp}
                        />
                    </>
                )}

                {yes && (
                    <>
                        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm space-y-5">
                            <Field label="Conductor">
                                <input type="text" className={inputClass} value={conductor || ''} disabled readOnly />
                            </Field>

                        </div>

                        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-3 flex items-center justify-between">
                                <p className={`${labelClass} !mb-0`}>Toolbox category *</p>
                                <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold text-brand-900">{data.categories.length} selected</span>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {topics.map((t) => {
                                    const on = data.categories.includes(t.id);
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
                            {err.categories && <p className="mt-2 text-xs font-medium text-red-500">{err.categories}</p>}
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

            <ActionBar leftClass={actionBarLeft} inline={wide}>
                <button type="button" onClick={onCancel || (() => window.history.back())} disabled={saving} className={ghostBtn}>{cancelLabel}</button>
                <button type="submit" disabled={saving} className={primaryBtn}>
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> {submitLabel}</>}
                </button>
            </ActionBar>
        </form>
    );
}
