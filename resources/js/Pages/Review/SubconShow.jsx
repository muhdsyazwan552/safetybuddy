import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ChevronLeft, Phone, Mail, MapPin } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import SubconDetail from '@/Components/shared/SubconDetail';

export default function SubconShow({ company, staff, machinery, cases, attendance, induction }) {
    return (
        <ReviewLayout title={company.name}>
            <Head title={`Subcon: ${company.name}`} />

            <div className="mx-auto max-w-5xl space-y-4 px-4 pb-10 pt-5 sm:px-6">
                <Link href="/review/subcons" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800">
                    <ChevronLeft className="h-4 w-4" /> Subcontractors
                </Link>

                <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <div className="flex items-center gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-extrabold text-ink-900">
                            {(company.name || '?').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Subcontractor</p>
                            <h1 className="truncate text-xl font-extrabold">{company.name}</h1>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${company.status === 'active' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-gray-300'}`}>
                            {company.status || 'inactive'}
                        </span>
                    </div>
                    <div className="mt-4 space-y-1.5 text-sm text-gray-300">
                        {company.contact && <a href={`tel:${company.contact}`} className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-400" />{company.contact}</a>}
                        {company.email && <a href={`mailto:${company.email}`} className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 text-brand-400" />{company.email}</a>}
                        {company.address && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />{company.address}</p>}
                    </div>
                </div>

                <SubconDetail staff={staff} machinery={machinery} cases={cases} attendance={attendance} induction={induction} />
            </div>
        </ReviewLayout>
    );
}
