// resources/js/Pages/Inspector/SubconCompanyDetails.jsx
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Phone, Mail, MapPin, Users, ClipboardCheck, AlertTriangle, FolderKanban } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { SectionCard } from '@/Components/inspector/kit';
import { statusMeta } from '@/Components/inspector/projectUtils';
import SubconDetail from '@/Components/shared/SubconDetail';

export default function SubconCompanyDetails({ company, inspections = [], stats = {}, user, staff = [], machinery = [], cases = [], attendance = [], induction }) {
    const projects = company.projects || [];

    return (
        <InspectorLayout user={user}>
            <Head title={`Subcon: ${company.name}`} />

            <div className="mx-auto max-w-5xl space-y-4 px-4 pb-10 pt-5 sm:px-6">
                <div className="rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <div className="flex items-center gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-extrabold text-ink-900">
                            {(company.name || '?').charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Subcontractor</p>
                            <h1 className="truncate text-xl font-extrabold">{company.name}</h1>
                        </div>
                    </div>
                    <div className="mt-4 space-y-1.5 text-sm text-gray-300">
                        {company.contact && <a href={`tel:${company.contact}`} className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-400" />{company.contact}</a>}
                        {company.email && <a href={`mailto:${company.email}`} className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 text-brand-400" />{company.email}</a>}
                        {company.address && <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />{company.address}</p>}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                        { label: 'Staff', value: stats.total_staff ?? 0, icon: Users },
                        { label: 'Projects', value: stats.active_projects ?? 0, icon: FolderKanban },
                        { label: 'Inspections', value: stats.total_inspections ?? 0, icon: ClipboardCheck },
                        { label: 'NC', value: stats.nonconformance_count ?? 0, icon: AlertTriangle, danger: (stats.nonconformance_count ?? 0) > 0 },
                    ].map((s) => (
                        <div key={s.label} className={`rounded-2xl border p-3.5 shadow-sm ${s.danger ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-white'}`}>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{s.label}</span>
                                <s.icon className={`h-4 w-4 ${s.danger ? 'text-red-500' : 'text-gray-400'}`} />
                            </div>
                            <p className={`mt-1.5 text-2xl font-extrabold ${s.danger ? 'text-red-600' : 'text-gray-900'}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                <SubconDetail staff={staff} machinery={machinery} cases={cases} attendance={attendance} induction={induction} />

                {projects.length > 0 && (
                    <SectionCard title={`Projects (${projects.length})`} icon={FolderKanban}>
                        <div className="flex flex-wrap gap-2">
                            {projects.map((p) => (
                                <Link key={p.id} href={`/inspector/projects/${p.id}`} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700">
                                    {p.name} <span className="ml-1 text-gray-400">· {statusMeta(p.status).label}</span>
                                </Link>
                            ))}
                        </div>
                    </SectionCard>
                )}
            </div>
        </InspectorLayout>
    );
}
