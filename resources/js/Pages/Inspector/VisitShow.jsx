// One toolbox talk & inspection of the inspector. Same layout as the review portal (VisitDetail),
// plus what only the inspector needs: who recorded it and the edit / fix button on each card.
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, UserRound, Send, Loader2 } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import VisitDetail from '@/Components/shared/VisitDetail';

const EDITABLE = ['pending_verification', 'rejected'];

export default function VisitShow({ visit, me = null, user }) {
    // only the inspector who recorded an item may change it, and only before it is verified / approved
    const isMine = (x) => !!x && me !== null && Number(x.by_id) === Number(me);
    const canEdit = (x) => isMine(x) && EDITABLE.includes(x.status);
    const ownVisit = isMine(visit);
    const [sending, setSending] = useState(false);

    // everything the inspector recorded that the reviewer returned: it stays returned until it is sent back
    const returned = [visit.talk, ...(visit.inspections || [])].filter((x) => x && isMine(x) && x.status === 'rejected');
    const sendBack = () => {
        setSending(true);
        router.post(`/inspector/visits/${visit.key}/resubmit`, {}, { preserveScroll: true, onFinish: () => setSending(false) });
    };

    // the button sits on the card it changes: red "Fix" when the item was returned, dark "Edit" otherwise
    const editButton = (x, href, what) => {
        if (!canEdit(x)) return null;
        const returned = x.status === 'rejected';

        return (
            <Link
                href={href}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold text-white active:scale-95 ${returned ? 'bg-red-600 hover:bg-red-700' : 'bg-ink-900 hover:bg-ink-700'}`}
            >
                <Pencil className="h-3.5 w-3.5" /> {returned ? `Fix ${what}` : `Edit ${what}`}
            </Link>
        );
    };

    return (
        <InspectorLayout user={user}>
            <Head title="Toolbox talk & Inspection" />
            <VisitDetail
                visit={visit}
                backHref="/inspector/visits"
                backLabel="Back to toolbox talk & inspection"
                inspectionHref={(i) => `/inspector/inspections/${i.id}`}
                toolboxHref={(x) => `/inspector/toolbox-talks/${x.id}`}
                talkActions={(t) => editButton(t, `/inspector/toolbox-talks/${t.id}/edit`, 'toolbox talk')}
                inspectionActions={(i) => editButton(i, `/inspector/inspections/${i.id}/edit`, 'inspection')}
            >
                {returned.length > 0 && (
                    <section className="rounded-3xl border border-red-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-extrabold text-red-700">Returned by the reviewer ({returned.length})</p>
                        <p className="mt-1 text-sm text-gray-600">
                            Fix each returned part with its <b>Fix</b> button below. When you are done, send it back to the reviewer.
                        </p>
                        <button type="button" onClick={sendBack} disabled={sending}
                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white active:scale-95 disabled:opacity-60">
                            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send back to reviewer
                        </button>
                    </section>
                )}

                {!ownVisit && (
                    <p className="flex items-start gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600">
                        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <span>Recorded by <b className="text-gray-900">{visit.by || 'another inspector'}</b>. You can view it; only the items you recorded yourself can be edited.</span>
                    </p>
                )}
            </VisitDetail>
        </InspectorLayout>
    );
}
