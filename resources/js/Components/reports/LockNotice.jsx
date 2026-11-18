import React from 'react';
import { Lock, Info } from 'lucide-react';

/** Tells the reader whether the figures of a report can still change. */
export default function LockNotice({ status, kind = 'report' }) {
    if (status === 'approved') {
        return (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                    <b>Approved and locked.</b> The data and calculations of this {kind} are final. They cannot be changed,
                    and inspections or records added later will not be added to it.
                </p>
            </div>
        );
    }

    return (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
                <b>Not approved yet.</b> The figures update automatically while the records change. Once this {kind} is
                approved, its data and calculations are locked: they cannot be changed or added to.
            </p>
        </div>
    );
}
