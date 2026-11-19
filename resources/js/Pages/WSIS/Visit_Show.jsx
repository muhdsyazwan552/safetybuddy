// Site visit detail for the company admin: toolbox talk first, then the inspections.
import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import AppLayout from '@/Pages/WSIS/Layout';
import VisitDetail from '@/Components/shared/VisitDetail';
import { showAlert } from '@/Helpers/alert';

const editBtn = 'inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-ink-700';
const deleteBtn = 'inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-100';

export default function Visit_Show({ visit }) {
    // the server redirects back to the toolbox talk & inspection list after a delete
    const remove = async (url, what, note) => {
        const ok = await showAlert.confirmDelete(note, `Delete this ${what}?`);
        if (ok) router.delete(url);
    };

    return (
        <AppLayout title="Toolbox talk & Inspection">
            <Head title="Toolbox talk & Inspection" />
            <VisitDetail
                visit={visit}
                backHref="/inspection"
                backLabel="Back to toolbox talk & inspection"
                inspectionHref={(i) => `/inspections/${i.id}`}
                talkActions={(t) => (
                    <>
                        {t.status !== 'approved' && (
                            <Link href={`/site-visits/toolbox-talks/${t.id}/edit`} className={editBtn}><Pencil className="h-3.5 w-3.5" /> Edit toolbox talk</Link>
                        )}
                        <button type="button" className={deleteBtn}
                            onClick={() => remove(`/site-visits/toolbox-talks/${t.id}`, 'toolbox talk', 'The toolbox talk record will be permanently removed. Its inspections stay.')}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                    </>
                )}
                inspectionActions={(i) => (
                    <>
                        {i.status !== 'approved' && (
                            <Link href={`/site-visits/inspections/${i.id}/edit`} className={editBtn}><Pencil className="h-3.5 w-3.5" /> Edit inspection</Link>
                        )}
                        <button type="button" className={deleteBtn}
                            onClick={() => remove(`/site-visits/inspections/${i.id}`, 'inspection', 'The inspection together with its non-conformance / client complaint record will be permanently removed.')}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                    </>
                )}
            />
        </AppLayout>
    );
}
