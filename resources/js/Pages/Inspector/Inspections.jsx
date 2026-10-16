// resources/js/Pages/Inspector/Inspections.jsx
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, MapPin, CalendarDays, Building2, ChevronRight, Pencil, Trash2, Eye } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import {
    EVAL, EVAL_ORDER, EvalBadge, StatusBadge, ListHeader, Sheet, EmptyState, Pager, Field,
    inputClass, fmtDate, primaryBtn, ghostBtn,
} from '@/Components/inspector/kit';

export default function Inspections({ inspections, projects = [], subconCompanies = [], evaluations = [], filters = {}, user }) {
    const [sheet, setSheet] = useState(false);
    const [values, setValues] = useState(filters || {});
    const [toDelete, setToDelete] = useState(null);

    const rows = inspections?.data || [];
    const activeCount = Object.values(filters || {}).filter(Boolean).length;

    const go = (params) =>
        router.get('/inspector/inspections', params, { preserveState: true, preserveScroll: true });

    const applyFilters = () => {
        const clean = Object.fromEntries(Object.entries(values).filter(([, v]) => v));
        setSheet(false);
        go(clean);
    };

    const resetFilters = () => {
        setValues({});
        setSheet(false);
        go({});
    };

    const quickEval = (ev) => {
        const next = { ...filters };
        if (next.evaluation === ev) delete next.evaluation; else next.evaluation = ev;
        setValues(next);
        go(Object.fromEntries(Object.entries(next).filter(([, v]) => v)));
    };

    const confirmDelete = () => {
        router.delete(`/inspector/inspections/${toDelete.id}`, { preserveScroll: true, onFinish: () => setToDelete(null) });
    };

    return (
        <InspectorLayout user={user}>
            <Head title="Inspections" />

            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <ListHeader
                    title="Inspections"
                    subtitle="Site inspection records"
                    count={inspections?.total}
                    onFilter={() => { setValues(filters || {}); setSheet(true); }}
                    filterCount={activeCount}
                    action={
                        <Link
                            href="/inspector/inspections/create"
                            className="sb-create"
                        >
                            <Plus className="h-4 w-4" strokeWidth={3} /> New
                        </Link>
                    }
                />

                {/* Evaluation quick filter chips */}
                <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 sb-scroll sm:mx-0 sm:px-0">
                    <button
                        onClick={() => { setValues({ ...filters, evaluation: '' }); go(Object.fromEntries(Object.entries({ ...filters, evaluation: '' }).filter(([, v]) => v))); }}
                        className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${!filters?.evaluation ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-600'}`}
                    >
                        All
                    </button>
                    {EVAL_ORDER.map((k) => (
                        <button
                            key={k}
                            onClick={() => quickEval(k)}
                            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition ${filters?.evaluation === k ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-600'}`}
                        >
                            <span className="h-2 w-2 rounded-full" style={{ background: EVAL[k].color }} />
                            {EVAL[k].label}
                        </button>
                    ))}
                </div>

                {rows.length === 0 ? (
                    <EmptyState
                        title="No inspections found"
                        hint={activeCount ? 'Try clearing the filters.' : 'Tap + to record your first inspection.'}
                        action={
                            activeCount
                                ? <button onClick={resetFilters} className="rounded-2xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-brand-400">Clear filters</button>
                                : <Link href="/inspector/inspections/create" className="rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-ink-900">New inspection</Link>
                        }
                    />
                ) : (
                    <>
                        {/* Phone / tablet: card list */}
                        <div className="space-y-3 md:hidden">
                            {rows.map((i) => (
                                <Link
                                    key={i.id}
                                    href={`/inspector/inspections/${i.id}`}
                                    className="relative block overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 pl-5 shadow-sm active:scale-[0.985] transition"
                                >
                                    <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: EVAL[i.evaluation]?.color || '#9ca3af' }} />
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-[15px] font-bold text-gray-900">{i.project?.name || '-'}</p>
                                            <p className="mt-0.5 truncate text-xs text-gray-500">{i.topic?.name || i.topic?.title || '-'}</p>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-1.5">
                                            <EvalBadge value={i.evaluation} />
                                            <StatusBadge value={i.status} />
                                        </div>
                                    </div>

                                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-600">
                                        <span className="flex items-center gap-1.5 truncate"><Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />{i.subcon_company?.name || '-'}</span>
                                        <span className="flex items-center gap-1.5 truncate"><CalendarDays className="h-3.5 w-3.5 shrink-0 text-gray-400" />{fmtDate(i.inspection_date)}</span>
                                        <span className="col-span-2 flex items-center gap-1.5 truncate"><MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />{i.location || '-'}</span>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                                        <span className="text-[11px] text-gray-400">By {i.inspector?.name || '-'}</span>
                                        <ChevronRight className="h-4 w-4 text-gray-300" />
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Desktop: table */}
                        <div className="hidden overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm md:block">
                            <table className="min-w-full divide-y divide-gray-100 text-sm">
                                <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    <tr>
                                        <th className="w-12 px-5 py-3">#</th>
                                        <th className="px-5 py-3">Project</th>
                                        <th className="px-5 py-3">Subcon</th>
                                        <th className="px-5 py-3">Topic</th>
                                        <th className="px-5 py-3">Evaluation</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3">Location</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.map((i, idx) => (
                                        <tr key={i.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3.5 text-gray-400">{(inspections.from ?? 1) + idx}</td>
                                            <td className="px-5 py-3.5 font-semibold text-gray-900">{i.project?.name || '-'}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{i.subcon_company?.name || '-'}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{i.topic?.name || i.topic?.title || '-'}</td>
                                            <td className="px-5 py-3.5"><EvalBadge value={i.evaluation} /></td>
                                            <td className="px-5 py-3.5"><StatusBadge value={i.status} /></td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{fmtDate(i.inspection_date)}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{i.location || '-'}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end gap-1.5">
                                                    <Link href={`/inspector/inspections/${i.id}`} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100" title="View"><Eye className="h-4 w-4" /></Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pager data={inspections} />
                    </>
                )}
            </div>

            {/* Filter sheet */}
            <Sheet
                open={sheet}
                onClose={() => setSheet(false)}
                title="Filter inspections"
                footer={
                    <div className="flex gap-3">
                        <button onClick={resetFilters} className={ghostBtn}>Reset</button>
                        <button onClick={applyFilters} className={primaryBtn}>Apply filters</button>
                    </div>
                }
            >
                <div className="space-y-4 py-1">
                    <Field label="Evaluation">
                        <select className={inputClass} value={values.evaluation || ''} onChange={(e) => setValues({ ...values, evaluation: e.target.value })}>
                            <option value="">All evaluations</option>
                            {(evaluations.length ? evaluations : EVAL_ORDER).map((ev) => <option key={ev} value={ev}>{EVAL[ev]?.label || ev}</option>)}
                        </select>
                    </Field>
                    <Field label="Project site">
                        <select className={inputClass} value={values.project_id || ''} onChange={(e) => setValues({ ...values, project_id: e.target.value })}>
                            <option value="">All projects</option>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </Field>
                    <Field label="Subcon company">
                        <select className={inputClass} value={values.subcon_company_id || ''} onChange={(e) => setValues({ ...values, subcon_company_id: e.target.value })}>
                            <option value="">All companies</option>
                            {subconCompanies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="From">
                            <input type="date" className={inputClass} value={values.start_date || ''} onChange={(e) => setValues({ ...values, start_date: e.target.value })} />
                        </Field>
                        <Field label="To">
                            <input type="date" className={inputClass} value={values.end_date || ''} onChange={(e) => setValues({ ...values, end_date: e.target.value })} />
                        </Field>
                    </div>
                </div>
            </Sheet>

            {/* Delete confirm */}
            <Sheet
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                title="Delete inspection?"
                footer={
                    <div className="flex gap-3">
                        <button onClick={() => setToDelete(null)} className={ghostBtn}>Cancel</button>
                        <button onClick={confirmDelete} className="inline-flex flex-1 items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white active:scale-95 transition">Delete</button>
                    </div>
                }
            >
                <p className="py-2 text-sm text-gray-600">
                    {toDelete?.project?.name} · {fmtDate(toDelete?.inspection_date)} will be removed permanently.
                </p>
            </Sheet>
        </InspectorLayout>
    );
}
