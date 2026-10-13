// resources/js/Pages/Inspector/ToolboxTalks.jsx
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, CalendarDays, Users, UserRound, CheckCircle2, XCircle, ChevronRight, Pencil, Trash2, Eye } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { ListHeader, Sheet, EmptyState, Pager, Field, inputClass, fmtDate, primaryBtn, ghostBtn } from '@/Components/inspector/kit';

export default function ToolboxTalks({ toolboxTalks, projects = [], filters = {}, user }) {
    const [sheet, setSheet] = useState(false);
    const [values, setValues] = useState(filters || {});
    const [toDelete, setToDelete] = useState(null);

    const rows = toolboxTalks?.data || [];
    const activeCount = Object.values(filters || {}).filter(Boolean).length;
    const conducted = (t) => t.conducted === 'yes';

    const go = (params) => router.get('/inspector/toolbox-talks', params, { preserveState: true, preserveScroll: true });

    const apply = () => {
        setSheet(false);
        go(Object.fromEntries(Object.entries(values).filter(([, v]) => v)));
    };
    const reset = () => {
        setValues({});
        setSheet(false);
        go({});
    };
    const confirmDelete = () =>
        router.delete(`/inspector/toolbox-talks/${toDelete.id}`, { preserveScroll: true, onFinish: () => setToDelete(null) });

    const topicsOf = (t) => (t.topics || []).map((x) => x.name || x.title).filter(Boolean);

    return (
        <InspectorLayout user={user}>
            <Head title="Toolbox Talks" />

            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <ListHeader
                    title="Toolbox Talks"
                    subtitle="Daily safety briefings"
                    count={toolboxTalks?.total}
                    onFilter={() => { setValues(filters || {}); setSheet(true); }}
                    filterCount={activeCount}
                    action={
                        <Link
                            href="/inspector/toolbox-talks/create"
                            className="inline-flex h-11 items-center gap-1.5 rounded-2xl bg-brand-500 px-4 text-sm font-extrabold text-ink-900 shadow-md active:scale-95 transition"
                        >
                            <Plus className="h-4 w-4" strokeWidth={3} /> New
                        </Link>
                    }
                />

                {rows.length === 0 ? (
                    <EmptyState
                        title="No toolbox talks found"
                        hint={activeCount ? 'Try clearing the filters.' : 'Record today\'s safety briefing.'}
                        action={
                            activeCount
                                ? <button onClick={reset} className="rounded-2xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-brand-400">Clear filters</button>
                                : <Link href="/inspector/toolbox-talks/create" className="rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-ink-900">New toolbox talk</Link>
                        }
                    />
                ) : (
                    <>
                        {/* Phone / tablet cards */}
                        <div className="space-y-3 md:hidden">
                            {rows.map((t) => (
                                <Link
                                    key={t.id}
                                    href={`/inspector/toolbox-talks/detail/${t.id}`}
                                    className="block rounded-3xl border border-gray-100 bg-white p-4 shadow-sm active:scale-[0.985] transition"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-[15px] font-bold text-gray-900">{t.project?.name || '-'}</p>
                                            <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-brand-800">
                                                <CalendarDays className="h-3.5 w-3.5" /> {fmtDate(t.inspection_date)}
                                            </p>
                                        </div>
                                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${conducted(t) ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                                            {conducted(t) ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                            {conducted(t) ? 'Conducted' : 'Skipped'}
                                        </span>
                                    </div>

                                    {conducted(t) && topicsOf(t).length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5">
                                            {topicsOf(t).slice(0, 3).map((name) => (
                                                <span key={name} className="rounded-lg bg-brand-100 px-2 py-1 text-[11px] font-semibold text-brand-900">{name}</span>
                                            ))}
                                            {topicsOf(t).length > 3 && <span className="rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-500">+{topicsOf(t).length - 3}</span>}
                                        </div>
                                    )}

                                    <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-600">
                                        <span className="flex items-center gap-1.5 truncate"><UserRound className="h-3.5 w-3.5 text-gray-400" />{t.company_staff?.name || '-'}</span>
                                        <span className="flex items-center gap-3">
                                            <span className="flex items-center gap-1 font-semibold"><Users className="h-3.5 w-3.5 text-gray-400" />{t.total_attended ?? 0}</span>
                                            <ChevronRight className="h-4 w-4 text-gray-300" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm md:block">
                            <table className="min-w-full divide-y divide-gray-100 text-sm">
                                <thead className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                    <tr>
                                        <th className="w-12 px-5 py-3">#</th>
                                        <th className="px-5 py-3">Project</th>
                                        <th className="px-5 py-3">Conducted by</th>
                                        <th className="px-5 py-3">Topics</th>
                                        <th className="px-5 py-3">Attendees</th>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.map((t, idx) => (
                                        <tr key={t.id} className="hover:bg-gray-50">
                                            <td className="px-5 py-3.5 text-gray-400">{(toolboxTalks.from ?? 1) + idx}</td>
                                            <td className="px-5 py-3.5 font-semibold text-gray-900">{t.project?.name || '-'}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{t.company_staff?.name || t.conducted || '-'}</td>
                                            <td className="max-w-xs truncate px-5 py-3.5 text-gray-600">{topicsOf(t).join(', ') || '-'}</td>
                                            <td className="px-5 py-3.5 text-gray-600">{t.total_attended ?? 0}</td>
                                            <td className="whitespace-nowrap px-5 py-3.5 text-gray-600">{fmtDate(t.inspection_date)}</td>
                                            <td className="px-5 py-3.5">
                                                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${conducted(t) ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                                                    {conducted(t) ? 'Conducted' : 'Skipped'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex justify-end gap-1.5">
                                                    <Link href={`/inspector/toolbox-talks/detail/${t.id}`} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100" title="View"><Eye className="h-4 w-4" /></Link>
                                                    <Link href={`/inspector/toolbox-talks/${t.id}/edit`} className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100" title="Edit"><Pencil className="h-4 w-4" /></Link>
                                                    <button onClick={() => setToDelete(t)} className="flex h-9 w-9 items-center justify-center rounded-xl text-red-500 hover:bg-red-50" title="Delete"><Trash2 className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <Pager data={toolboxTalks} />
                    </>
                )}
            </div>

            <Sheet
                open={sheet}
                onClose={() => setSheet(false)}
                title="Filter toolbox talks"
                footer={<div className="flex gap-3"><button onClick={reset} className={ghostBtn}>Reset</button><button onClick={apply} className={primaryBtn}>Apply filters</button></div>}
            >
                <div className="space-y-4 py-1">
                    <Field label="Project site">
                        <select className={inputClass} value={values.project_id || ''} onChange={(e) => setValues({ ...values, project_id: e.target.value })}>
                            <option value="">All projects</option>
                            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                        <Field label="From"><input type="date" className={inputClass} value={values.start_date || ''} onChange={(e) => setValues({ ...values, start_date: e.target.value })} /></Field>
                        <Field label="To"><input type="date" className={inputClass} value={values.end_date || ''} onChange={(e) => setValues({ ...values, end_date: e.target.value })} /></Field>
                    </div>
                </div>
            </Sheet>

            <Sheet
                open={!!toDelete}
                onClose={() => setToDelete(null)}
                title="Delete toolbox talk?"
                footer={
                    <div className="flex gap-3">
                        <button onClick={() => setToDelete(null)} className={ghostBtn}>Cancel</button>
                        <button onClick={confirmDelete} className="inline-flex flex-1 items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white active:scale-95 transition">Delete</button>
                    </div>
                }
            >
                <p className="py-2 text-sm text-gray-600">{toDelete?.project?.name} · {fmtDate(toDelete?.inspection_date)} will be removed permanently.</p>
            </Sheet>
        </InspectorLayout>
    );
}
