// A toolbox talk of the inspector: the same page as the manager's, plus edit / delete for its owner.
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { Sheet, ActionBar, darkBtn, ghostBtn } from '@/Components/inspector/kit';
import { ToolboxDetail } from '@/Pages/Review/ToolboxShow';

export default function ShowToolboxTalk({ talk, user, can_edit = false }) {
    const [confirm, setConfirm] = useState(false);

    return (
        <InspectorLayout user={user}>
            <Head title={`Toolbox talk ${talk.series_code || ''}`.trim()} />
            <ToolboxDetail talk={talk} backHref={`/inspector/visits/talk-${talk.id}`} />
            {can_edit && <div className="h-24" />}

            <ActionBar>
                {can_edit && (
                    <Link href={`/inspector/toolbox-talks/${talk.id}/edit`} className={darkBtn}>
                        <Pencil className="h-4 w-4" /> Edit
                    </Link>
                )}
                {can_edit && (
                    <button
                        onClick={() => setConfirm(true)}
                        className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 active:scale-95 transition"
                        aria-label="Delete"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                )}
            </ActionBar>

            <Sheet
                open={confirm}
                onClose={() => setConfirm(false)}
                title="Delete this toolbox talk?"
                footer={
                    <div className="flex gap-3">
                        <button onClick={() => setConfirm(false)} className={ghostBtn}>Cancel</button>
                        <button
                            onClick={() => router.delete(`/inspector/toolbox-talks/${talk.id}`)}
                            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white active:scale-95 transition"
                        >
                            Delete
                        </button>
                    </div>
                }
            >
                <p className="py-2 text-sm text-gray-600">This cannot be undone.</p>
            </Sheet>
        </InspectorLayout>
    );
}