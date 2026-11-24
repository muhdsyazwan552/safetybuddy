// One toolbox talk & inspection of the inspector. Same layout as the review portal (VisitDetail),
// plus what only the inspector needs: who recorded it and the edit / fix button on each card.
import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { UserRound, Send, Loader2 } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import VisitDetail from '@/Components/shared/VisitDetail';
import EditDeleteIcons from '@/Components/shared/EditDeleteIcons';

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

    // icon buttons sit on the card they change: red pencil when the item was returned, grey otherwise
    const actions = (x, base, what, note) => (canEdit(x) ? (
        <EditDeleteIcons editHref={`${base}/${x.id}/edit`} deleteUrl={`${base}/${x.id}`} what={what} note={note} returned={x.status === 'rejected'} />
    ) : null);

    return (
        <InspectorLayout user={user}>
            <Head title="Toolbox talk & Inspection" />
            <VisitDetail
                visit={visit}
                backHref="/inspector/visits"
                inspectionHref={(i) => `/inspector/inspections/${i.id}`}
                toolboxHref={(x) => `/inspector/toolbox-talks/${x.id}`}
                talkActions={(t) => actions(t, '/inspector/toolbox-talks', 'toolbox talk', 'The toolbox talk record will be removed. Its inspections stay.')}
                inspectionActions={(i) => actions(i, '/inspector/inspections', 'inspection', 'The inspection and its non-conformance / client complaint record will be removed.')}
            >
                {returned.length > 0 && (
                    <section className="rounded-3xl border border-red-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-extrabold text-red-700">Returned by the reviewer ({returned.length})</p>
                        <p className="mt-1 text-sm text-gray-600">
                            Fix each returned part with its red <b>pencil</b> button below. When you are done, send it back to the reviewer.
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
