import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Save, X, Loader2, Gauge, Wallet, Percent, Sparkles } from 'lucide-react';
import AppLayout from '@/Pages/WSIS/Layout';
import PerformanceSettingsCard from '@/Components/reports/PerformanceSettingsCard';
import { showAlert } from '@/Helpers/alert';

const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/20';
const labelClass = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-500';

const rm = (v) =>
    v === null || v === undefined || v === ''
        ? null
        : `RM ${Number(v).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Field({ label, error, hint, children }) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            {children}
            {hint && !error && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
            {error && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
}

/** Add / edit form – same fields for both */
function SettingForm({ form, onSubmit, onCancel, heading, submitLabel }) {
    const { data, setData, errors, processing } = form;
    return (
        <section className="rounded-3xl border-2 border-brand-500 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-base font-extrabold text-gray-900">{heading}</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                <div className="md:col-span-4">
                    <Field label="Title *" error={errors.title}>
                        <input className={inputClass} value={data.title} onChange={(e) => setData('title', e.target.value)} placeholder="e.g. Target for Overall Compliance Level 'GOOD'" />
                    </Field>
                </div>
                <div className="md:col-span-1">
                    <Field label="Percent (%)" error={errors.percent} hint="0 – 100, optional">
                        <input type="number" min="0" max="100" step="0.01" className={inputClass} value={data.percent} onChange={(e) => setData('percent', e.target.value)} placeholder="—" />
                    </Field>
                </div>
                <div className="md:col-span-1">
                    <Field label="Penalty (RM)" error={errors.value} hint="optional">
                        <input type="number" min="0" step="0.01" className={inputClass} value={data.value} onChange={(e) => setData('value', e.target.value)} placeholder="—" />
                    </Field>
                </div>
                <div className="md:col-span-6">
                    <Field label="Description *" error={errors.description}>
                        <textarea rows={2} className={inputClass} value={data.description} onChange={(e) => setData('description', e.target.value)} placeholder="What does this setting measure or penalise?" />
                    </Field>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
                <button onClick={onSubmit} disabled={processing || !data.title.trim() || !data.description.trim()} className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-ink-900 shadow-md active:scale-95 transition disabled:opacity-40">
                    {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {submitLabel}
                </button>
                <button onClick={onCancel} className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">
                    <X className="h-4 w-4" /> Cancel
                </button>
            </div>
        </section>
    );
}

export default function ComplianceMetrics({ title, metrics = [], performance = null }) {
    const [mode, setMode] = useState(null); // null | 'add' | metric id
    const [loadingDefaults, setLoadingDefaults] = useState(false);

    const empty = { title: '', description: '', percent: '', value: '' };
    const addForm = useForm(empty);
    const editForm = useForm(empty);

    const clean = (d) => ({
        title: d.title,
        description: d.description,
        percent: d.percent === '' ? null : d.percent,
        value: d.value === '' ? null : d.value,
    });

    const startAdd = () => {
        addForm.reset();
        addForm.clearErrors();
        setMode('add');
    };

    const startEdit = (m) => {
        editForm.clearErrors();
        editForm.setData({
            title: m.title || '',
            description: m.description || '',
            percent: m.percent ?? '',
            value: m.value ?? '',
        });
        setMode(m.id);
    };

    const cancel = () => setMode(null);

    const saveAdd = () =>
        addForm.transform(clean).post(route('compliance-metrics.store'), {
            preserveScroll: true,
            onSuccess: () => { addForm.reset(); setMode(null); },
        });

    const saveEdit = () =>
        editForm.transform(clean).put(route('compliance-metrics.update', mode), {
            preserveScroll: true,
            onSuccess: () => setMode(null),
        });

    const remove = async (m) => {
        const ok = await showAlert.confirmDelete(
            `"${m.title}" and its percent and penalty values will be permanently removed.`,
            'Delete this setting?'
        );
        if (ok) router.delete(route('compliance-metrics.destroy', m.id), { preserveScroll: true });
    };

    const loadDefaults = () => {
        setLoadingDefaults(true);
        router.post(route('compliance-metrics.defaults'), {}, { preserveScroll: true, onFinish: () => setLoadingDefaults(false) });
    };

    const withPercent = metrics.filter((m) => m.percent !== null && m.percent !== undefined).length;
    const withPenalty = metrics.filter((m) => m.value !== null && m.value !== undefined && Number(m.value) > 0).length;

    return (
        <AppLayout title={title}>
            <Head title={title} />

            <div className="mx-auto max-w-6xl space-y-5 pb-10">
                {performance && <PerformanceSettingsCard settings={performance} />}

                {/* header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-brand-800">Performance settings</p>
                        <h1 className="text-2xl font-extrabold text-gray-900">Compliance &amp; Penalty Settings</h1>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            One list for each performance factor: its target <b>percent</b> and the <b>penalty value (RM)</b> that applies when it is not met.
                        </p>
                    </div>
                    <button onClick={startAdd} className="sb-create">
                        <Plus className="h-4 w-4" strokeWidth={3} /> Add setting
                    </button>
                </div>

                {/* quick stats */}
                {metrics.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { l: 'Settings', v: metrics.length, i: Gauge },
                            { l: 'With percent', v: withPercent, i: Percent },
                            { l: 'With penalty', v: withPenalty, i: Wallet },
                        ].map((s) => (
                            <div key={s.l} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-brand-400"><s.i className="h-5 w-5" /></span>
                                <div>
                                    <p className="text-xl font-extrabold leading-none text-gray-900">{s.v}</p>
                                    <p className="mt-1 text-xs text-gray-500">{s.l}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {mode === 'add' && (
                    <SettingForm form={addForm} onSubmit={saveAdd} onCancel={cancel} heading="Add a setting" submitLabel="Save setting" />
                )}

                {/* empty state */}
                {metrics.length === 0 && mode !== 'add' && (
                    <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white px-6 py-14 text-center">
                        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-800"><Sparkles className="h-7 w-7" /></span>
                        <p className="mt-4 text-lg font-extrabold text-gray-900">No settings yet</p>
                        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                            Start from the recommended list (Safety Passport, Overall Compliance, NC, Client Complaint, BSPR) and then adjust the percent and penalty values.
                        </p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <button onClick={loadDefaults} disabled={loadingDefaults} className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-extrabold text-ink-900 shadow-md active:scale-95 transition disabled:opacity-50">
                                {loadingDefaults ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Load default settings
                            </button>
                            <button onClick={startAdd} className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700">
                                <Plus className="h-4 w-4" /> Add my own
                            </button>
                        </div>
                    </div>
                )}

                {/* the one table */}
                {metrics.length > 0 && (
                    <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100 text-sm">
                                <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    <tr>
                                        <th className="w-12 px-5 py-3">#</th>
                                        <th className="px-5 py-3">Title</th>
                                        <th className="px-5 py-3">Description</th>
                                        <th className="px-5 py-3">Percent setting</th>
                                        <th className="px-5 py-3">Penalty value (RM)</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {metrics.map((m, i) => {
                                        const editing = mode === m.id;
                                        return (
                                            <React.Fragment key={m.id}>
                                                <tr className={`transition hover:bg-gray-50 ${editing ? 'bg-brand-100/40' : ''}`}>
                                                    <td className="px-5 py-4 text-gray-400">{i + 1}</td>
                                                    <td className="px-5 py-4 font-bold text-gray-900">{m.title}</td>
                                                    <td className="max-w-md px-5 py-4 text-gray-600">{m.description}</td>
                                                    <td className="whitespace-nowrap px-5 py-4">
                                                        {m.percent === null || m.percent === undefined ? (
                                                            <span className="text-gray-300">—</span>
                                                        ) : (
                                                            <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-xs font-extrabold text-brand-900">{Number(m.percent).toFixed(2)}%</span>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4">
                                                        {rm(m.value) ? (
                                                            <span className="inline-flex rounded-full bg-ink-900 px-3 py-1 text-xs font-extrabold text-brand-400">{rm(m.value)}</span>
                                                        ) : (
                                                            <span className="text-gray-300">—</span>
                                                        )}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4">
                                                        <div className="flex justify-end gap-1.5">
                                                            <button onClick={() => (editing ? cancel() : startEdit(m))} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-ink-900 px-3 text-xs font-bold text-brand-400">
                                                                <Pencil className="h-3.5 w-3.5" /> Edit
                                                            </button>
                                                            <button onClick={() => remove(m)} className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50" title="Delete">
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                                {editing && (
                                                    <tr>
                                                        <td colSpan="6" className="bg-gray-50 p-4">
                                                            <SettingForm form={editForm} onSubmit={saveEdit} onCancel={cancel} heading="Edit setting" submitLabel="Update setting" />
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
