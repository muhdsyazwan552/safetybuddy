import React from 'react';
import { Check, RotateCcw } from 'lucide-react';

export function caseState(record) {
    if (record?.state) return record.state;
    if (record?.status === 'closed') return 'closed';
    if (record?.return_reason) return 'returned';
    return record?.subcon_response ? 'responded' : 'open';
}

export default function ReviewProgress({ kind, status, record, className = '' }) {
    const caseWorkflow = kind === 'case';
    const visitWorkflow = kind === 'visit';
    const state = caseWorkflow ? caseState(record) : (status || (visitWorkflow ? 'pending_verification' : 'open')).toLowerCase().replace(/\s+/g, '');
    const approved = visitWorkflow ? state === 'approved' : state === 'closed';
    const reviewed = caseWorkflow ? approved : visitWorkflow ? ['verified', 'approved'].includes(state) : ['inprogress', 'closed'].includes(state);
    const returned = (caseWorkflow && state === 'returned') || (visitWorkflow && state === 'rejected');
    const steps = [
        { label: 'Submitted', who: caseWorkflow || visitWorkflow ? 'Inspector' : 'Reporter', done: true },
        { label: returned ? 'Returned' : 'Review', who: caseWorkflow ? 'Subcontractor and reviewer' : 'Supervisor', done: reviewed },
        { label: 'Approved', who: visitWorkflow ? 'Manager' : caseWorkflow ? 'Reviewer' : 'Supervisor', done: approved },
    ];
    const detail = caseWorkflow
        ? { open: 'Awaiting subcontractor reply', responded: 'Reply received; awaiting review', returned: 'Returned for another reply', closed: 'Approved and closed' }[state]
        : visitWorkflow
            ? { pending_verification: 'Awaiting supervisor review', verified: 'Reviewed by supervisor; awaiting manager approval', rejected: 'Returned to inspector for correction', approved: 'Approved by manager' }[state]
            : { open: 'Awaiting supervisor review', inprogress: 'Reviewed; awaiting supervisor approval', closed: 'Approved by supervisor' }[state];

    return (
        <section className={`rounded-2xl border border-gray-200 bg-white p-4 ${className}`} aria-label="Review progress">
            <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500">Review progress</p>
            <p className="mt-1 text-sm font-semibold text-gray-700">{detail || 'Awaiting review'}</p>
            <ol className="mt-4 grid grid-cols-3 gap-2">
                {steps.map((step, index) => {
                    const active = index === 1 ? !reviewed : index === 2 && reviewed && !approved;
                    const isReturned = returned && index === 1;
                    return (
                        <li key={index} aria-current={active ? 'step' : undefined} className="relative flex flex-col items-center text-center">
                            {index > 0 && <span className={`absolute right-1/2 top-4 h-0.5 w-full ${step.done ? 'bg-emerald-500' : 'bg-gray-200'}`} aria-hidden="true" />}
                            <span className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-extrabold ${
                                isReturned ? 'border-red-500 bg-red-500 text-white' : step.done ? 'border-emerald-600 bg-emerald-600 text-white' : active ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-400'
                            }`}>
                                {isReturned ? <RotateCcw className="h-4 w-4" /> : step.done ? <Check className="h-4 w-4" /> : index + 1}
                            </span>
                            <span className={`mt-2 text-xs font-bold ${isReturned ? 'text-red-700' : step.done ? 'text-emerald-700' : active ? 'text-blue-700' : 'text-gray-400'}`}>{step.label}</span>
                            <span className="text-[11px] leading-tight text-gray-500">{step.who}</span>
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

/** Compact Submitted -> Review (supervisor) -> Approved (manager) indicator for one inspection / talk in a list. */
export function ReviewSteps({ status, className = '' }) {
    const state = (status || 'pending_verification').toLowerCase();
    const returned = state === 'rejected';
    const reviewed = ['verified', 'approved'].includes(state);
    const approved = state === 'approved';
    const steps = [
        { label: 'Submit', done: true },
        { label: returned ? 'Returned' : 'Review', done: reviewed, bad: returned, active: !reviewed && !returned },
        { label: 'Approve', done: approved, active: reviewed && !approved },
    ];

    return (
        <ol className={`flex items-center gap-1 ${className}`} aria-label="Review progress">
            {steps.map((s, i) => (
                <li key={i} className="flex items-center gap-1">
                    {i > 0 && <span className={`h-0.5 w-3 ${s.done ? 'bg-emerald-500' : 'bg-gray-200'}`} aria-hidden="true" />}
                    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        s.bad ? 'bg-red-100 text-red-700' : s.done ? 'bg-emerald-100 text-emerald-700' : s.active ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' : 'bg-gray-100 text-gray-400'
                    }`}>
                        {s.bad ? <RotateCcw className="h-3 w-3" /> : s.done ? <Check className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                        {s.label}
                    </span>
                </li>
            ))}
        </ol>
    );
}
