// One flow for the day on site:  setup -> toolbox talk (can be skipped) -> inspections, or toolbox only.
import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import {
    Check, X, ChevronLeft, Plus, Trash2, Send, Loader2, AlertCircle, ClipboardCheck, HardHat, ArrowRight, CheckCircle2,
} from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import AppLayout from '@/Pages/WSIS/Layout';
import InspectionFields from '@/Components/inspector/InspectionFields';
import ToolboxTalkForm from '@/Components/inspector/ToolboxTalkForm';
import { ActionBar, Field, EVAL, inputClass, ghostBtn, darkBtn, primaryBtn } from '@/Components/inspector/kit';

const today = () => new Date().toISOString().split('T')[0];
const blankItem = (id, project_id, date) => ({
    id, project_id, subcon_company_id: '', category_id: '', topic_id: '', evaluation: '',
    inspection_date: date, location: '', description: '', photos: [], previews: [],
});
const REQUIRED = ['subcon_company_id', 'category_id', 'topic_id', 'evaluation', 'inspection_date', 'location'];
const complete = (it) => REQUIRED.every((k) => String(it[k] || '').trim() !== '');

function Stepper({ step, withToolbox }) {
    const steps = [
        ['start', 'Start'],
        ...(withToolbox ? [['toolbox', 'Toolbox talk'], ['choose', 'Next']] : []),
        ['inspect', 'Inspection'],
    ];
    const idx = Math.max(0, steps.findIndex(([k]) => k === step));
    return (
        <div className="flex items-center gap-2">
            {steps.map(([k, label], i) => (
                <React.Fragment key={k}>
                    <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide ${i <= idx ? 'text-ink-900' : 'text-gray-400'}`}>
                        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${i < idx ? 'bg-emerald-500 text-white' : i === idx ? 'bg-ink-900 text-brand-400' : 'bg-gray-200 text-gray-500'}`}>
                            {i < idx ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                        </span>
                        <span className="hidden sm:inline">{label}</span>
                    </span>
                    {i < steps.length - 1 && <span className="h-px flex-1 bg-gray-300" />}
                </React.Fragment>
            ))}
        </div>
    );
}

export default function NewVisit({
    portal = 'inspector',
    endpoints = { store: '/inspector/visits', done: '/inspector/visits', doneToolbox: '/inspector/visits' },
    projects = [], categories = [], toolboxCategories = [], staffByProject = {}, evaluations = [], user,
}) {
    const isAdmin = portal === 'admin';
    const Shell = isAdmin ? AppLayout : InspectorLayout;
    const shellProps = isAdmin ? { title: 'New site visit' } : { user };
    const barLeft = isAdmin ? 'lg:left-64' : '';
    const maxW = isAdmin ? 'max-w-6xl' : 'max-w-2xl';
    const padB = isAdmin ? 'pb-6' : 'pb-32';
    const [step, setStep] = useState('start'); // start | toolbox | choose | inspect
    const [projectId, setProjectId] = useState('');
    const [date, setDate] = useState(today());
    const [talk, setTalk] = useState(null); // 'yes' | 'no' | 'skip'  (was the toolbox talk conducted?)
    const [toolbox, setToolbox] = useState(null);     // payload from the embedded form
    const [items, setItems] = useState([]);
    const [idx, setIdx] = useState(0);
    const [errors, setErrors] = useState({});
    const [startErrors, setStartErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState('');

    const project = projects.find((p) => String(p.id) === String(projectId));
    const subcons = project?.subcon_companies || [];
    const withToolbox = talk === 'yes' || talk === 'no';
    const item = items[idx];

    // ---- step 1
    const goStart = () => {
        const e = {};
        if (!projectId) e.project = 'Select a project.';
        if (!date) e.date = 'Select a date.';
        if (talk === null) e.toolbox = 'Choose Yes or No.';
        setStartErrors(e);
        if (Object.keys(e).length) return;
        if (withToolbox) {
            setStep('toolbox');
        } else {
            beginInspection();
        }
    };

    const beginInspection = () => {
        if (items.length === 0) setItems([blankItem(1, projectId, date)]);
        setIdx(0);
        setStep('inspect');
    };

    // ---- inspections
    const update = (field, value) => {
        setItems((all) => all.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
        if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    };
    const addAnother = () => {
        const nextId = Math.max(...items.map((i) => i.id), 0) + 1;
        setItems([...items, { ...blankItem(nextId, projectId, date), subcon_company_id: item?.subcon_company_id || '' }]);
        setIdx(items.length);
        setErrors({});
    };
    const removeCurrent = () => {
        if (items.length === 1) return;
        const next = items.filter((_, i) => i !== idx);
        setItems(next);
        setIdx(Math.min(idx, next.length - 1));
    };
    const pickPhotos = (fileList) => {
        const files = Array.from(fileList || []).filter((f) => f.size <= 2 * 1024 * 1024);
        const previews = files.map((f) => URL.createObjectURL(f));
        setItems((all) => all.map((it, i) => (i === idx ? { ...it, photos: [...it.photos, ...files], previews: [...it.previews, ...previews] } : it)));
    };
    const removePhoto = (n) =>
        setItems((all) => all.map((it, i) => (i === idx ? { ...it, photos: it.photos.filter((_, p) => p !== n), previews: it.previews.filter((_, p) => p !== n) } : it)));

    // ---- submit
    const submit = ({ toolboxOnly = false } = {}) => {
        if (!toolboxOnly) {
            const bad = items.findIndex((it) => !complete(it));
            if (bad !== -1) {
                setIdx(bad);
                const e = {};
                REQUIRED.forEach((k) => { if (!String(items[bad][k] || '').trim()) e[k] = 'Required'; });
                setErrors(e);
                setServerError(`Inspection ${bad + 1} is missing required fields.`);
                return;
            }
        }

        setSaving(true);
        setServerError('');
        const fd = new FormData();
        fd.append('project_id', projectId);
        fd.append('visit_date', date);
        fd.append('toolbox', withToolbox ? 1 : 0);
        fd.append('conducted', talk === 'yes' ? 1 : 0);
        if (toolboxOnly) fd.append('toolbox_only', 1);

        if (withToolbox && toolbox) {
            toolbox.attendees.forEach((id, n) => fd.append(`attendees[${n}]`, id));
            (toolbox.categories || []).forEach((id, n) => fd.append(`categories[${n}]`, id));
            Object.entries(toolbox.sp || {}).forEach(([companyId, n]) => fd.append(`sp[${companyId}]`, n));
            if (toolbox.img_group) fd.append('img_group', toolbox.img_group);
            if (toolbox.img_attendance) fd.append('img_attendance', toolbox.img_attendance);
        }

        if (!toolboxOnly) {
            items.forEach((it, i) => {
                fd.append(`inspections[${i}][subcon_company_id]`, it.subcon_company_id);
                fd.append(`inspections[${i}][topic_id]`, it.topic_id);
                fd.append(`inspections[${i}][evaluation]`, it.evaluation);
                fd.append(`inspections[${i}][inspection_date]`, it.inspection_date);
                fd.append(`inspections[${i}][location]`, it.location);
                fd.append(`inspections[${i}][description]`, it.description || '');
                it.photos.forEach((p, n) => fd.append(`inspections[${i}][photos][${n}]`, p));
            });
        }

        axios
            .post(endpoints.store, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then(() => router.visit(toolboxOnly ? endpoints.doneToolbox : endpoints.done))
            .catch((err) => {
                const apiErrors = err.response?.data?.errors;
                setServerError(apiErrors ? Object.values(apiErrors).flat().slice(0, 3).join(' ') : err.response?.data?.message || 'Failed to save. Please try again.');
                setSaving(false);
            });
    };

    const header = (
        <div className={`mx-auto ${maxW} px-4 pt-5 sm:px-6`}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-800">Site visit</p>
            <h1 className="mb-4 text-2xl font-extrabold text-gray-900">Toolbox &amp; inspection</h1>
            <Stepper step={step} withToolbox={withToolbox} />
        </div>
    );

    return (
        <Shell {...shellProps}>
            <Head title="Site visit" />
            {header}

            {/* ───── 1. Start ───── */}
            {step === 'start' && (
                <>
                    <div className={`mx-auto ${maxW} space-y-4 px-4 ${padB} pt-5 sm:px-6 ${isAdmin ? 'lg:grid lg:grid-cols-2 lg:items-start lg:gap-4 lg:space-y-0' : ''}`}>
                        <div className="space-y-5 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                            <Field label="Project *" error={startErrors.project}>
                                <select className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                                    <option value="">Select a project</option>
                                    {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </Field>
                            <Field label="Date *" error={startErrors.date}>
                                <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
                            </Field>
                        </div>

                        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                            <p className="mb-1 text-center text-base font-extrabold text-gray-900">Was the toolbox talk conducted?</p>
                            <p className="mb-4 text-center text-xs text-gray-500">If not, you still record who was present and the Safety Passport sampling.</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setTalk('yes')}
                                    className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-5 text-sm font-extrabold transition active:scale-95 ${talk === 'yes' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}
                                >
                                    <HardHat className="h-6 w-6" /> Yes, conducted
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTalk('no')}
                                    className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-5 text-sm font-extrabold transition active:scale-95 ${talk === 'no' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'}`}
                                >
                                    <X className="h-6 w-6" /> No, not conducted
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setTalk('skip')}
                                className={`mx-auto mt-4 block text-sm font-semibold ${talk === 'skip' ? 'text-ink-900 underline' : 'text-gray-500'}`}
                            >
                                {talk === 'skip' ? 'Skipping the toolbox record' : 'Skip the toolbox record, inspection only'}
                            </button>
                            {startErrors.toolbox && <p className="mt-2 text-center text-xs font-medium text-red-500">{startErrors.toolbox}</p>}
                        </div>
                    </div>
                    <ActionBar leftClass={barLeft} inline={isAdmin}>
                        <button type="button" onClick={() => window.history.back()} className={ghostBtn}>Cancel</button>
                        <button type="button" onClick={goStart} className={darkBtn}>
                            {talk === 'skip' ? 'Start inspection' : 'Next'} <ArrowRight className="h-4 w-4" />
                        </button>
                    </ActionBar>
                </>
            )}

            {/* ───── 2. Toolbox talk ───── */}
            {step === 'toolbox' && (
                <ToolboxTalkForm
                    embedded
                    projects={projects.map((p) => ({ id: p.id, name: p.name }))}
                    topics={toolboxCategories}
                    initial={{ project_id: projectId, inspection_date: date, is_conducted: talk === 'yes' ? 1 : 0 }}
                    staffByProject={staffByProject}
                    conductor={user?.staff_name || user?.name}
                    submitLabel="Save & continue"
                    cancelLabel="Back"
                    actionBarLeft={barLeft}
                    wide={isAdmin}
                    onCancel={() => setStep('start')}
                    onSubmit={(payload, { setSaving: done }) => {
                        setToolbox(payload);
                        done(false);
                        setStep('choose');
                    }}
                />
            )}

            {/* ───── 3. Inspect or toolbox only ───── */}
            {step === 'choose' && (
                <div className={`mx-auto ${maxW} space-y-4 px-4 ${padB} pt-5 sm:px-6`}>
                    <div className="flex items-start gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                        <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
                        <div>
                            <p className="text-sm font-extrabold text-emerald-800">{talk === 'yes' ? 'Toolbox talk ready' : 'Toolbox record ready (not conducted)'}</p>
                            <p className="text-xs text-emerald-700">
                                {toolbox?.attendees?.length || 0} present{talk === 'yes' ? ` · ${toolbox?.categories?.length || 0} categor${toolbox?.categories?.length === 1 ? 'y' : 'ies'}` : ` · ${toolbox?.sp_not_registered || 0} not registered`}. It is saved when you finish.
                            </p>
                        </div>
                    </div>

                    {serverError && (
                        <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{serverError}</span>
                        </div>
                    )}

                    <button type="button" onClick={beginInspection} className="flex w-full items-center gap-4 rounded-3xl border-2 border-ink-900 bg-white p-5 text-left active:scale-[0.98] transition">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-brand-400"><ClipboardCheck className="h-6 w-6" /></span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-base font-extrabold text-gray-900">Continue to inspection</span>
                            <span className="block text-xs text-gray-500">Record the findings of this visit.</span>
                        </span>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                    </button>

                    <button type="button" disabled={saving} onClick={() => submit({ toolboxOnly: true })} className="flex w-full items-center gap-4 rounded-3xl border-2 border-gray-200 bg-white p-5 text-left active:scale-[0.98] transition disabled:opacity-60">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-ink-900">
                            {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <HardHat className="h-6 w-6" />}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-base font-extrabold text-gray-900">Toolbox talk only</span>
                            <span className="block text-xs text-gray-500">Save the talk now, no inspection today.</span>
                        </span>
                    </button>

                    <button type="button" onClick={() => setStep('toolbox')} className="mx-auto block text-sm font-semibold text-gray-500">Edit toolbox talk</button>
                </div>
            )}

            {/* ───── 4. Inspections ───── */}
            {step === 'inspect' && item && (
                <>
                    <div className={`mx-auto ${maxW} px-4 ${padB} pt-5 sm:px-6`}>
                        <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-bold text-gray-900">
                                Inspection {idx + 1} <span className="font-medium text-gray-400">of {items.length}</span>
                            </p>
                            <button type="button" onClick={addAnother} className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-3 py-2 text-xs font-bold text-brand-400 active:scale-95 transition">
                                <Plus className="h-4 w-4" strokeWidth={3} /> Add another
                            </button>
                        </div>

                        <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                            {items.map((it, n) => (
                                <button
                                    key={it.id}
                                    type="button"
                                    onClick={() => { setIdx(n); setErrors({}); }}
                                    className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 px-3.5 py-2 text-xs font-bold ${n === idx ? 'border-ink-900 bg-ink-900 text-white' : 'border-gray-200 bg-white text-gray-600'}`}
                                >
                                    {complete(it) ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="h-2.5 w-2.5 rounded-full" style={{ background: EVAL[it.evaluation]?.color || '#d1d5db' }} />}
                                    #{n + 1}
                                </button>
                            ))}
                        </div>

                        {serverError && (
                            <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> <span>{serverError}</span>
                            </div>
                        )}

                        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-5 flex items-center justify-between">
                                <div className="min-w-0">
                                    <h2 className="text-base font-extrabold text-gray-900">Inspection details</h2>
                                    <p className="truncate text-xs text-gray-500">{project?.name}</p>
                                </div>
                                {items.length > 1 && (
                                    <button type="button" onClick={removeCurrent} className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500" aria-label="Remove this inspection">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                            <InspectionFields
                                item={item}
                                onChange={update}
                                hideProject
                                wide={isAdmin}
                                projects={projects}
                                subcons={subcons}
                                categories={categories}
                                evaluations={evaluations.length ? evaluations : undefined}
                                errors={errors}
                                newPhotos={item.previews.map((preview) => ({ preview }))}
                                onPickPhotos={pickPhotos}
                                onRemovePhoto={removePhoto}
                            />
                        </div>
                    </div>

                    <ActionBar leftClass={barLeft} inline={isAdmin}>
                        <button
                            type="button"
                            disabled={saving}
                            onClick={() => (idx > 0 ? setIdx(idx - 1) : setStep(withToolbox ? 'choose' : 'start'))}
                            className={`${ghostBtn} disabled:opacity-40`}
                        >
                            <ChevronLeft className="h-4 w-4" /> Back
                        </button>
                        {idx < items.length - 1 ? (
                            <button type="button" onClick={() => setIdx(idx + 1)} className={darkBtn}>Next <ArrowRight className="h-4 w-4" /></button>
                        ) : (
                            <button type="button" onClick={() => submit()} disabled={saving} className={primaryBtn}>
                                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Send className="h-4 w-4" /> Submit{withToolbox ? ' talk + ' : ' '}{items.length > 1 ? `${items.length} inspections` : 'inspection'}</>}
                            </button>
                        )}
                    </ActionBar>
                </>
            )}
        </Shell>
    );
}
