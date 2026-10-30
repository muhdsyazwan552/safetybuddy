import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Users, AlertTriangle, Truck, CalendarCheck, ChevronRight } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import { subconStatus } from '@/Components/inspector/kit';

export default function Subcons({ companies = [], filters = {} }) {
    const [q, setQ] = useState(filters.q || '');

    const search = (e) => {
        e.preventDefault();
        router.get('/review/subcons', q ? { q } : {}, { preserveState: true, preserveScroll: true });
    };

    return (
        <ReviewLayout title="Subcontractors">
            <Head title="Subcontractors" />

            <div className="mx-auto max-w-5xl space-y-4 px-4 pb-10 pt-5 sm:px-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-900">Subcontractors</h1>
                        <p className="text-sm text-gray-500">{companies.length} compan{companies.length === 1 ? 'y' : 'ies'}: staff, attendance, NC / CC, induction and machinery</p>
                    </div>
                    <form onSubmit={search} className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search company..."
                            className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm"
                        />
                    </form>
                </div>

                {companies.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">No subcontractor found.</div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {companies.map((c) => {
                            const st = subconStatus(c.status);
                            return (
                            <Link
                                key={c.id}
                                href={`/review/subcons/${c.id}`}
                                className={`group block min-w-0 overflow-hidden rounded-3xl border p-5 active:scale-[0.99] ${st.tone.card}`}
                            >
                                <div className="flex items-start gap-3">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-lg font-extrabold text-ink-900">
                                        {(c.name || '?').charAt(0).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 break-words text-sm font-bold leading-snug text-gray-900">{c.name}</p>
                                        <p className="mt-1.5 text-xs text-gray-500">Status : <span className={`font-extrabold uppercase tracking-wide ${st.text}`}>{st.label}</span></p>
                                        <p className="mt-0.5 truncate text-xs text-gray-500">{c.contact || c.email || ''}</p>
                                    </div>
                                    <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-gray-300 group-hover:text-gray-500" />
                                </div>
                                <div className="mt-4 grid grid-cols-4 gap-1.5 text-center sm:gap-2">
                                    <Stat icon={Users} label="Staff" value={c.staff} />
                                    <Stat icon={CalendarCheck} label="Today" value={c.present_today} />
                                    <Stat icon={AlertTriangle} label="NC/CC" value={c.open_cases} danger={c.open_cases > 0} />
                                    <Stat icon={Truck} label="Machine" value={c.machinery} />
                                </div>
                            </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </ReviewLayout>
    );
}

function Stat({ icon: Icon, label, value, danger = false }) {
    return (
        <div className={`min-w-0 rounded-xl px-1 py-2 ${danger ? 'bg-red-50' : 'bg-gray-50'}`}>
            <Icon className={`mx-auto h-4 w-4 ${danger ? 'text-red-500' : 'text-gray-400'}`} />
            <p className={`mt-0.5 text-base font-extrabold ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
            <p className="truncate text-[10px] font-semibold uppercase text-gray-500">{label}</p>
        </div>
    );
}
