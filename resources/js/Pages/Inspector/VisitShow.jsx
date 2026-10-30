// One toolbox talk & inspection of the inspector. Same layout as the review portal (VisitDetail),
// plus what only the inspector needs: who recorded it, what to fix and the edit buttons.
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Pencil, UserRound, AlertTriangle } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import VisitDetail from '@/Components/shared/VisitDetail';

const EDITABLE = ['pending_verification', 'rejected'];

export default function VisitShow({ visit, me = null, user }) {
    const t = visit.talk;
    // only the inspector who recorded an item may change it, and only before it is verified / approved
    const isMine = (x) => !!x && me !== null && Number(x.by_id) === Number(me);
    const canEdit = (x) => isMine(x) && EDITABLE.includes(x.status);
    const ownVisit = isMine(visit);
    const inspections = visit.inspections || [];

    const editableItems = [
        ...(t && canEdit(t) ? [{ key: 'talk', label: 'Edit toolbox talk', href: `/inspector/toolbox-talks/${t.id}/edit` }] : []),
        ...inspections.flatMap((i, index) => canEdit(i) ? [{
            key: `inspection-${i.id}`, label: `Edit inspection ${index + 1}`, href: `/inspector/inspections/${i.id}/edit`,
        }] : []),
    ];

    const returned = [
        ...(t && t.status === 'rejected' && isMine(t) ? [{ key: 'talk', label: 'Toolbox talk', reason: t.review_comment, edit: `/inspector/toolbox-talks/${t.id}/edit` }] : []),
        ...inspections.filter((i) => i.status === 'rejected' && isMine(i)).map((i) => ({
            key: `i${i.id}`, label: i.topic || 'Inspection', reason: i.review_comment, edit: `/inspector/inspections/${i.id}/edit`,
        })),
    ];

    return (
        <InspectorLayout user={user}>
            <Head title="Toolbox talk & Inspection" />
            <VisitDetail
                visit={visit}
                backHref="/inspector/visits"
                backLabel="Back to toolbox talk & inspection"
                inspectionHref={(i) => `/inspector/inspections/${i.id}`}
                toolboxHref={(x) => `/inspector/toolbox-talks/${x.id}`}
            >
                {!ownVisit && (
                    <p className="flex items-start gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <span>Recorded by <b className="text-gray-900">{visit.by || 'another inspector'}</b>. You can view it; only the items you recorded yourself can be edited.</span>
                    </p>
                )}

                {returned.length > 0 && (
                    <section className="rounded-3xl border border-red-200 bg-white p-4 shadow-sm">
                        <p className="flex items-center gap-2 text-sm font-extrabold text-red-700"><AlertTriangle className="h-4 w-4" /> Needs fixing ({returned.length})</p>
                        <ul className="mt-3 space-y-2">
                            {returned.map((r) => (
                                <li key={r.key} className="flex items-start gap-3 rounded-2xl bg-red-50 p-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900">{r.label}</p>
                                        <p className="mt-0.5 text-sm text-red-700">{r.reason || 'No reason given.'}</p>
                                    </div>
                                    <Link href={r.edit} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white active:scale-95">
                                        <Pencil className="h-3.5 w-3.5" /> Fix
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {editableItems.length > 0 && (
                    <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-md shadow-gray-200/60">
                        <h2 className="text-sm font-extrabold text-gray-900">Edit toolbox talk & inspection</h2>
                        <p className="mt-1 text-xs text-gray-500">Choose the part you want to update.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {editableItems.map((item) => (
                                <Link key={item.key} href={item.href} className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-3 py-2 text-xs font-bold text-white hover:bg-ink-700">
                                    <Pencil className="h-3.5 w-3.5" /> {item.label}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </VisitDetail>
        </InspectorLayout>
    );
}
