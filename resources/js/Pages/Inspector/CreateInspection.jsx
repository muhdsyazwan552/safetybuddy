import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import { Plus, Trash2, ChevronLeft, ChevronRight, Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import InspectionFields from '@/Components/inspector/InspectionFields';
import { ActionBar, Sheet, EVAL, ghostBtn, darkBtn, primaryBtn } from '@/Components/inspector/kit';

const today = () => new Date().toISOString().split('T')[0];
const blank = (id) => ({
    id,
    project_id: '',
    subcon_company_id: '',
    topic_id: '',
    evaluation: '',
    inspection_date: today(),
    location: '',
    description: '',
    photos: [],      // File[]
    previews: [],    // string[]
});

const REQUIRED = ['project_id', 'subcon_company_id', 'topic_id', 'evaluation', 'inspection_date', 'location'];
const isComplete = (item) => REQUIRED.every((k) => String(item[k] || '').trim() !== '');

export default function CreateInspection({ projects = [], topics = [], evaluations = [], user }) {
    const [items, setItems] = useState([blank(1)]);
    const [step, setStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState('');
    const [confirmDiscard, setConfirmDiscard] = useState(false);

    const item = items[step];
    const isLast = step === items.length - 1;

    const subcons = useMemo(() => {
        const p = projects.find((x) => String(x.id) === String(item.project_id));
        return p?.subcon_companies || [];
    }, [projects, item.project_id]);

    const update = (field, value) => {
        setItems((all) => all.map((it, i) => (i === step ? { ...it, [field]: value } : it)));
        if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    };

    const addNew = () => {
        const nextId = Math.max(...items.map((i) => i.id), 0) + 1;
        // carry over project / date to speed up repeated entry
        const fresh = { ...blank(nextId), project_id: item.project_id, subcon_company_id: item.subcon_company_id, inspection_date: item.inspection_date };
        setItems([...items, fresh]);
        setStep(items.length);
        setErrors({});
    };

    const removeCurrent = () => {
        if (items.length === 1) return;
        const next = items.filter((_, i) => i !== step);
        setItems(next);
        setStep(Math.min(step, next.length - 1));
        setErrors({});
    };

    const pickPhotos = (fileList) => {
        const files = Array.from(fileList || []).filter((f) => f.size <= 2 * 1024 * 1024);
        if (files.length !== (fileList?.length || 0)) setServerError('Some photos were skipped (over 2 MB).');
        const previews = files.map((f) => URL.createObjectURL(f));
        setItems((all) => all.map((it, i) => (i === step ? { ...it, photos: [...it.photos, ...files], previews: [...it.previews, ...previews] } : it)));
    };

    const removePhoto = (idx) =>
        setItems((all) =>
            all.map((it, i) =>
                i === step ? { ...it, photos: it.photos.filter((_, p) => p !== idx), previews: it.previews.filter((_, p) => p !== idx) } : it,
            ),
        );

    const validateCurrent = () => {
        const e = {};
        REQUIRED.forEach((k) => { if (!String(item[k] || '').trim()) e[k] = 'Required'; });
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const next = () => {
        if (!validateCurrent()) return;
        setStep((s) => Math.min(s + 1, items.length - 1));
    };

    const submit = () => {
        // find first incomplete sheet
        const bad = items.findIndex((it) => !isComplete(it));
        if (bad !== -1) {
            setStep(bad);
            const e = {};
            REQUIRED.forEach((k) => { if (!String(items[bad][k] || '').trim()) e[k] = 'Required'; });
            setErrors(e);
            setServerError(`Inspection ${bad + 1} is missing required fields.`);
            return;
        }

        setSaving(true);
        setServerError('');
        const fd = new FormData();
        items.forEach((it, index) => {
            fd.append(`inspections[${index}][project_id]`, it.project_id);
            fd.append(`inspections[${index}][subcon_company_id]`, it.subcon_company_id);
            fd.append(`inspections[${index}][topic_id]`, it.topic_id);
            fd.append(`inspections[${index}][evaluation]`, it.evaluation);
            fd.append(`inspections[${index}][inspection_date]`, it.inspection_date);
            fd.append(`inspections[${index}][location]`, it.location);
            fd.append(`inspections[${index}][description]`, it.description || '');
            it.photos.forEach((photo, p) => fd.append(`inspections[${index}][photos][${p}]`, photo));
        });

        axios
            .post('/inspector/inspections/multiple', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
            .then((res) => {
                if (res.data?.success) {
                    router.visit('/inspector/inspections');
                } else {
                    setServerError(res.data?.message || 'Could not save inspections.');
                    setSaving(false);
                }
            })
            .catch((err) => {
                const apiErrors = err.response?.data?.errors;
                setServerError(
                    apiErrors ? Object.values(apiErrors).flat().slice(0, 3).join(' ') : err.response?.data?.message || 'Failed to save. Please try again.',
                );
                setSaving(false);
            });
    };

    const hasData = items.some((it) => it.project_id || it.location || it.description || it.photos.length);

    return (
        <InspectorLayout user={user}>
            <Head title="New Inspection" />

            <div className="mx-auto max-w-2xl px-4 pb-40 pt-5 sm:px-6 lg:pb-32">
                {/* Sheet switcher */}
                <div className="mb-4">
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-900">
                            Inspection {step + 1} <span className="font-medium text-gray-400">of {items.length}</span>
                        </p>
                        <button type="button" onClick={addNew} className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-3 py-2 text-xs font-bold text-brand-400 active:scale-95 transition">
                            <Plus className="h-4 w-4" strokeWidth={3} /> Add another
                        </button>
                    </div>

                    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sb-scroll sm:mx-0 sm:px-0">
                        {items.map((it, idx) => {
                            const done = isComplete(it);
                            const active = idx === step;
                            const color = EVAL[it.evaluation]?.color;
                            return (
                                <button
                                    key={it.id}
                                    type="button"
                                    onClick={() => { setStep(idx); setErrors({}); }}
                                    className={`flex shrink-0 items-center gap-2 rounded-2xl border-2 px-3.5 py-2 text-xs font-bold transition ${
                                        active ? 'border-ink-900 bg-ink-900 text-white' : 'border-gray-200 bg-white text-gray-600'
                                    }`}
                                >
                                    {done ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <span className="h-2.5 w-2.5 rounded-full" style={{ background: color || '#d1d5db' }} />}
                                    #{idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {serverError && (
                    <div className="mb-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{serverError}</span>
                    </div>
                )}

                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <h2 className="text-base font-extrabold text-gray-900">Inspection details</h2>
                        {items.length > 1 && (
                            <button type="button" onClick={removeCurrent} className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 active:scale-95 transition" aria-label="Remove this inspection">
                                <Trash2 className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    <InspectionFields
                        item={item}
                        onChange={update}
                        projects={projects}
                        subcons={subcons}
                        topics={topics}
                        evaluations={evaluations.length ? evaluations : undefined}
                        errors={errors}
                        newPhotos={item.previews.map((preview) => ({ preview }))}
                        onPickPhotos={pickPhotos}
                        onRemovePhoto={removePhoto}
                    />
                </div>

                {hasData && (
                    <button type="button" onClick={() => setConfirmDiscard(true)} className="mx-auto mt-5 block text-sm font-semibold text-gray-400">
                        Discard everything
                    </button>
                )}
            </div>

            <ActionBar>
                <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || saving} className={`${ghostBtn} disabled:opacity-40`}>
                    <ChevronLeft className="h-4 w-4" /> Back
                </button>
                {isLast ? (
                    <button type="button" onClick={submit} disabled={saving} className={primaryBtn}>
                        {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Send className="h-4 w-4" /> Submit {items.length > 1 ? `${items.length} inspections` : 'inspection'}</>}
                    </button>
                ) : (
                    <button type="button" onClick={next} className={darkBtn}>
                        Next <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </ActionBar>

            <Sheet
                open={confirmDiscard}
                onClose={() => setConfirmDiscard(false)}
                title="Discard all inspections?"
                footer={
                    <div className="flex gap-3">
                        <button onClick={() => setConfirmDiscard(false)} className={ghostBtn}>Keep editing</button>
                        <button onClick={() => window.history.back()} className="inline-flex flex-1 items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white">Discard</button>
                    </div>
                }
            >
                <p className="py-2 text-sm text-gray-600">Everything you entered on this screen will be lost.</p>
            </Sheet>
        </InspectorLayout>
    );
}
