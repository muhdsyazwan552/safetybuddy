import React from 'react';
import { Camera, X } from 'lucide-react';
import { EVAL, EVAL_ORDER, Field, inputClass, labelClass } from '@/Components/inspector/kit';

/**
 * Fields shared by the Create (multi) and Edit inspection forms.
 * `item` shape: project_id, subcon_company_id, topic_id, evaluation, inspection_date, location, description
 */
export default function InspectionFields({
    item,
    onChange,
    projects = [],
    subcons = [],
    categories = [],         // [{ id, name, items: [{ id, name, code }] }]
    evaluations = EVAL_ORDER,
    errors = {},
    newPhotos = [],          // [{ preview }]
    onPickPhotos,            // (FileList) => void
    onRemovePhoto,           // (index) => void
    existingPhotos = [],     // [url]
    hideProject = false,     // project already chosen earlier in the flow
    wide = false,            // web layout: 2 column grid
}) {
    const categoryId = String(item.category_id || '');
    const subTopics = categories.find((c) => String(c.id) === categoryId)?.items || [];

    return (
        <div className={wide ? 'grid grid-cols-1 gap-5 lg:grid-cols-2' : 'space-y-5'}>
            {!hideProject && (
            <Field label="Project *" error={errors.project_id}>
                <select
                    className={inputClass}
                    value={item.project_id}
                    onChange={(e) => { onChange('project_id', e.target.value); onChange('subcon_company_id', ''); }}
                >
                    <option value="">Select project</option>
                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </Field>
            )}

            <Field label="Subcon company *" error={errors.subcon_company_id}>
                <select
                    className={inputClass}
                    value={item.subcon_company_id}
                    disabled={!item.project_id}
                    onChange={(e) => onChange('subcon_company_id', e.target.value)}
                >
                    <option value="">{item.project_id ? 'Select subcon' : 'Choose a project first'}</option>
                    {subcons.map((c) => <option key={c.id} value={c.id}>{c.name}{String(c.status || '').toLowerCase() === 'inactive' ? ' (inactive)' : ''}</option>)}
                </select>
            </Field>

            <Field label="Inspection category *" error={errors.category_id}>
                <select
                    className={inputClass}
                    value={categoryId}
                    onChange={(e) => { onChange('category_id', e.target.value); onChange('topic_id', ''); }}
                >
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.code} · {c.name}</option>)}
                </select>
            </Field>

            {categoryId && (
                <Field label="Sub topic *" error={errors.topic_id}>
                    <select className={inputClass} value={item.topic_id} onChange={(e) => onChange('topic_id', e.target.value)}>
                        <option value="">Select sub topic</option>
                        {subTopics.map((t) => <option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}
                    </select>
                </Field>
            )}

            {/* Evaluation as big tap targets */}
            <div className={wide ? 'lg:col-span-2' : ''}>
                <p className={labelClass}>Evaluation *</p>
                <div className={`grid grid-cols-2 gap-2.5 ${wide ? 'lg:grid-cols-4' : ''}`}>
                    {evaluations.map((ev) => {
                        const selected = item.evaluation === ev;
                        const meta = EVAL[ev];
                        return (
                            <button
                                key={ev}
                                type="button"
                                onClick={() => onChange('evaluation', ev)}
                                className={`flex items-center gap-2.5 rounded-2xl border-2 px-3.5 py-3 text-left text-sm font-bold transition active:scale-[0.97] ${
                                    selected ? 'border-ink-900 bg-ink-900 text-white' : 'border-gray-200 bg-white text-gray-700'
                                } ${ev === 'clientcomplaint' && evaluations.length % 2 === 1 ? 'col-span-2' : ''}`}
                            >
                                <span className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/60" style={{ background: meta?.color || '#9ca3af' }} />
                                {meta?.label || ev}
                            </button>
                        );
                    })}
                </div>
                {errors.evaluation && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500">{errors.evaluation}</p>}
            </div>

            <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${wide ? 'lg:col-span-2' : ''}`}>
                <Field label="Date *" error={errors.inspection_date}>
                    <input type="date" className={inputClass} value={item.inspection_date} onChange={(e) => onChange('inspection_date', e.target.value)} />
                </Field>
                <Field label="Location *" error={errors.location}>
                    <input type="text" className={inputClass} placeholder="Level 3, Zone B…" value={item.location} onChange={(e) => onChange('location', e.target.value)} />
                </Field>
            </div>

            <Field label={`Notes / observations${item.evaluation && item.evaluation !== 'good' ? ' *' : ''}`} error={errors.description} className={wide ? 'lg:col-span-2' : ''}>
                <textarea rows={4} className={inputClass} placeholder="Describe what you observed…" value={item.description} onChange={(e) => onChange('description', e.target.value)} />
            </Field>

            {/* Photos */}
            <div className={wide ? 'lg:col-span-2' : ''}>
                <p className={labelClass}>Evidence photos{item.evaluation && item.evaluation !== 'good' ? ' *' : ''}</p>
                <div className={`grid grid-cols-3 gap-2.5 sm:grid-cols-4 ${wide ? 'lg:grid-cols-6' : ''}`}>
                    {existingPhotos.map((src) => (
                        <div key={src} className="aspect-square overflow-hidden rounded-2xl border border-gray-200">
                            <img src={src} alt="" className="h-full w-full object-cover" />
                        </div>
                    ))}
                    {newPhotos.map((p, idx) => (
                        <div key={p.preview} className="relative aspect-square overflow-hidden rounded-2xl border-2 border-brand-500">
                            <img src={p.preview} alt="" className="h-full w-full object-cover" />
                            <button
                                type="button"
                                onClick={() => onRemovePhoto(idx)}
                                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white"
                                aria-label="Remove photo"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    ))}
                    <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 active:bg-brand-100 transition">
                        <Camera className="h-6 w-6" />
                        <span className="text-[11px] font-bold">Add photo</span>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => { onPickPhotos(e.target.files); e.target.value = ''; }}
                        />
                    </label>
                </div>
                <p className="mt-2 ml-1 text-[11px] text-gray-400">JPG / PNG, up to 2&nbsp;MB each.</p>
                {errors.photos && <p className="mt-1 ml-1 text-xs font-medium text-red-500">{errors.photos}</p>}
            </div>
        </div>
    );
}
