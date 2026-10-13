// resources/js/Pages/Inspector/SubconCompanies.jsx
import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Search, Phone, Mail, Users, ChevronRight } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { ListHeader, EmptyState, Pager } from '@/Components/inspector/kit';

export default function SubconCompanies({ companies, filters = {}, user }) {
    const [search, setSearch] = useState(filters.search || '');
    const rows = companies?.data || [];

    const submit = (e) => {
        e.preventDefault();
        router.get('/inspector/subcon-companies', search ? { search } : {}, { preserveState: true });
    };

    return (
        <InspectorLayout user={user}>
            <Head title="Subcontractors" />

            <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                <ListHeader title="Subcontractors" subtitle="Companies you can inspect" count={companies?.total} />

                <form onSubmit={submit} className="relative mb-4">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search company name…"
                        className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-base shadow-sm focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20"
                    />
                </form>

                {rows.length === 0 ? (
                    <EmptyState title="No subcontractors found" />
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {rows.map((c) => (
                                <Link
                                    key={c.id}
                                    href={`/inspector/subcon-companies/${c.id}`}
                                    className="block rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md active:scale-[0.985]"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-lg font-extrabold text-brand-400">
                                            {(c.name || '?').charAt(0).toUpperCase()}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[15px] font-extrabold text-gray-900">{c.name}</p>
                                            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                                                {c.status || 'n/a'}
                                            </span>
                                        </div>
                                        <ChevronRight className="h-5 w-5 shrink-0 text-gray-300" />
                                    </div>
                                    <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                                        {c.contact && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" />{c.contact}</p>}
                                        {c.email && <p className="flex items-center gap-2 truncate"><Mail className="h-3.5 w-3.5 text-gray-400" />{c.email}</p>}
                                        <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-gray-400" />{c.subcon_staff_count ?? 0} staff</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <Pager data={companies} />
                    </>
                )}
            </div>
        </InspectorLayout>
    );
}
