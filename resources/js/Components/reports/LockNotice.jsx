import React from 'react';
import { Lock, Info } from 'lucide-react';

/** Tells the reader whether the figures of a report can still change. */
export default function LockNotice({ status, kind = 'report' }) {
    if (status === 'approved') {
        return (
            <div className="mb-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                    <b>Complete.</b> Every section of this {kind} is complete and approved, so it was approved automatically.
                    {kind === 'daily report' && ' Its data and calculations are final; records added later will not be added to it.'}
                </p>
            </div>
        );
    }

    return (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
                <b>Not complete.</b> The figures update automatically while the records change. This {kind} becomes
                complete (and is approved automatically) once every section is complete and approved.
            </p>
        </div>
    );
}
