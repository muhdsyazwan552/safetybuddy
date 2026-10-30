import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { CalendarDays, Users, Clock, ChevronDown, Building2 } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { EmptyState } from '@/Components/inspector/kit';
import PdfButton from '@/Components/shared/PdfButton';
import SeriesCode from '@/Components/shared/SeriesCode';

function SubconRow({ subcon }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink-900 text-brand-400"><Building2 className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1">
                    <SeriesCode code={subcon.series_code} className="block" />
                    <span className="block truncate text-[15px] font-bold text-gray-900">{subcon.name}</span>
                    <span className="mt-0.5 flex gap-3 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{subcon.workers} worker(s)</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{subcon.manhours} h</span>
                    </span>
                </span>
                <ChevronDown className={`h-5 w-5 text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <ul className="divide-y divide-gray-100 border-t border-gray-100 bg-gray-50">
                    {subcon.staff.map((s) => (
                        <li key={s.id} className="px-4 py-2.5 text-sm">
                            <span className="font-semibold text-gray-800">{s.name}</span>
                            {s.role && <span className="ml-2 text-xs text-gray-400">{s.role}</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function Attendance({ date, groups = [], user }) {
    const total = groups.reduce((n, g) => n + g.subcons.reduce((m, s) => m + s.workers, 0), 0);
    const hours = groups.reduce((n, g) => n + g.subcons.reduce((m, s) => m + s.manhours, 0), 0);

    const go = (d) => router.get('/inspector/attendance', { date: d }, { preserveState: true, replace: true });

    return (
        <InspectorLayout user={user}>
            <Head title="Attendance" />
            <div className="mx-auto max-w-2xl space-y-4 px-4 pb-24 pt-5 sm:px-6">
                <div className="flex justify-end"><PdfButton href={`/pdf/attendance?date=${date}`} label="Attendance PDF" /></div>
                <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-md shadow-gray-200/60">
                    <label className="block">
                        <span className="mb-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                            <CalendarDays className="h-4 w-4" /> Date
                        </span>
                        <input
                            type="date"
                            value={date}
                            max={new Date().toISOString().slice(0, 10)}
                            onChange={(e) => e.target.value && go(e.target.value)}
                            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base"
                        />
                    </label>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-ink-900 p-3 text-white">
                            <p className="text-2xl font-extrabold text-brand-400">{total}</p>
                            <p className="text-xs text-gray-300">Workers on site</p>
                        </div>
                        <div className="rounded-2xl bg-ink-900 p-3 text-white">
                            <p className="text-2xl font-extrabold text-brand-400">{hours}</p>
                            <p className="text-xs text-gray-300">Manhours</p>
                        </div>
                    </div>
                </div>

                {groups.length === 0 && <EmptyState title="No projects" hint="You are not assigned to any project yet." />}

                {groups.map((g) => (
                    <section key={g.project_id} className="space-y-2">
                        <h2 className="px-1 text-sm font-extrabold text-gray-900">{g.project}</h2>
                        {g.subcons.length === 0 ? (
                            <p className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-5 text-center text-sm text-gray-500">
                                No attendance submitted for this day.
                            </p>
                        ) : (
                            g.subcons.map((s) => <SubconRow key={s.series_code || s.name} subcon={s} />)
                        )}
                    </section>
                ))}
            </div>
        </InspectorLayout>
    );
}
