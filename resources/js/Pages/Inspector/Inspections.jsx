// resources/js/Pages/Inspector/Inspections.jsx
import React, { useState } from 'react';
import VisitCard from '@/Components/shared/VisitCard';
import { Head, router } from '@inertiajs/react';
import { SlidersHorizontal } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import DateInput from '@/Components/shared/DateInput';
import {
    EVAL, EVAL_ORDER, Sheet, EmptyState, Pager, Field,
    inputClass, fmtDate, primaryBtn, ghostBtn,
} from '@/Components/inspector/kit';

// this page only lists findings: Non-Conformance and Client Complaint
const FINDING_ORDER = ['nonconformance', 'clientcomplaint'];

// shape one NC / CC record like a visit so the shared card can show it
const toCard = (i) => ({
    key: `insp-${i.id}`,
    project: i.project?.name,
    date: i.inspection_date ? String(i.inspection_date).slice(0, 10) : null,
    by: i.inspector?.name,
    status: i.status,
    talk: null,
    inspections: [{
        id: i.id,
        series_code: i.code,
        topic: i.topic?.name || i.topic?.title,
        location: i.location,
        subcon: i.subcon_company?.name,
        status: i.status,
        evaluation: i.evaluation,
        description: i.description,
        review_comment: i.review_comment,
        case: i.case,
    }],
});

export default function Inspections({ inspections, projects = [], subconCompanies = [], evaluations = [], filters = {}, me = null, user }) {
    const [openKey, setOpenKey] = useState(null); // one card open at a time
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
            <Head title="NC / CC" />

            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                {/* Evaluation quick filter chips + the filter button */}
                <div className="mb-4 flex items-center gap-2">
                <div className="-ml-4 flex min-w-0 flex-1 gap-2 overflow-x-auto pl-4 pb-1 sb-scroll sm:ml-0 sm:pl-0">
                    <button
                        onClick={() => { setValues({ ...filters, evaluation: '' }); go(Object.fromEntries(Object.entries({ ...filters, evaluation: '' }).filter(([, v]) => v))); }}
                        className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition ${!filters?.evaluation ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 bg-white text-gray-600'}`}
                    >
                        All
                    </button>
                    {FINDING_ORDER.map((k) => (
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
                    <button
                        onClick={() => { setValues(filters || {}); setSheet(true); }}
                        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 shadow-sm active:scale-95 transition"
                        aria-label="Filters"
                    >
                        <SlidersHorizontal className="h-5 w-5" />
                        {activeCount > 0 && (
                            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-ink-900">
                                {activeCount}
                            </span>
                        )}
                    </button>
                </div>

                {rows.length === 0 ? (
                    <EmptyState
                        title="No NC / CC found"
                        hint={activeCount ? 'Try clearing the filters.' : 'No non-conformance or client complaint has been recorded yet.'}
                        action={
                            activeCount
                                ? <button onClick={resetFilters} className="rounded-2xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-brand-400">Clear filters</button>
                                : null
                        }
                    />
                ) : (
                    <>
                        {/* Same card as the Toolbox talk & Inspection list: tap to open, then "View full details" */}
                        <div className="mx-auto max-w-2xl space-y-3">
                            {rows.map((i) => (
                                <VisitCard
                                    key={i.id}
                                    finding
                                    visit={toCard(i)}
                                    editable={me !== null && Number(i.inspection_by) === Number(me)}
                                    detailHref={i.case ? `/inspector/cases/${i.case.type}/${i.case.id}` : `/inspector/inspections/${i.id}`}
                                    open={openKey === i.id}
                                    onToggle={() => setOpenKey((k) => (k === i.id ? null : i.id))}
                                />
                            ))}
                        </div>

                        <Pager data={inspections} />
                    </>
                )}
            </div>

            {/* Filter sheet */}
            <Sheet
                open={sheet}
                onClose={() => setSheet(false)}
                title="Filter NC / CC"
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
                            <option value="">NC and CC</option>
                            {(evaluations.length ? evaluations : FINDING_ORDER).map((ev) => <option key={ev} value={ev}>{EVAL[ev]?.label || ev}</option>)}
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
                            <DateInput  className={inputClass} value={values.start_date || ''} onChange={(e) => setValues({ ...values, start_date: e.target.value })} />
                        </Field>
                        <Field label="To">
                            <DateInput  className={inputClass} value={values.end_date || ''} onChange={(e) => setValues({ ...values, end_date: e.target.value })} />
                        </Field>
                    </div>
                </div>
            </Sheet>

            {/* Delete confirm */}
            <Sheet
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                title="Delete this record?"
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
