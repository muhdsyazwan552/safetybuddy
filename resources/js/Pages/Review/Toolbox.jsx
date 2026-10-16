import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { CalendarDays, Users, Check, X } from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';

const TABS = [['all', 'All'], ['yes', 'Conducted'], ['no', 'Not conducted']];

export default function Toolbox({ talks = [] }) {
    const [tab, setTab] = useState('all');
    const list = talks.filter((t) => tab === 'all' || (tab === 'yes' ? t.conducted : !t.conducted));

    return (
        <ReviewLayout title="Toolbox talks">
            <Head title="Toolbox talks" />
            <div className="mx-auto max-w-3xl space-y-4 px-4 pb-10 pt-5">
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
                    {TABS.map(([k, label]) => (
                        <button key={k} onClick={() => setTab(k)} className={`shrink-0 rounded-full border-2 px-4 py-1.5 text-xs font-bold ${tab === k ? 'border-ink-900 bg-ink-900 text-white' : 'border-gray-200 bg-white text-gray-600'}`}>
                            {label}
                        </button>
                    ))}
                </div>

                {list.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-sm text-gray-500">No toolbox talks.</p>}

                {list.map((t) => (
                    <div key={t.id} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
                        <div className="flex items-start justify-between gap-3 p-4">
                            <div className="min-w-0">
                                <p className="truncate text-[15px] font-bold text-gray-900">{t.project || '-'}</p>
                                <p className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                    <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{t.date}</span>
                                    <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" />{t.attended} present</span>
                                    <span>By {t.by || '-'}</span>
                                </p>
                            </div>
                            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${t.conducted ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
                                {t.conducted ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                {t.conducted ? 'Conducted' : 'Not conducted'}
                            </span>
                        </div>

                        {t.conducted && t.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 border-t border-gray-100 px-4 py-3">
                                {t.categories.map((c) => <span key={c} className="rounded-full bg-brand-100 px-2.5 py-1 text-[11px] font-bold text-brand-900">{c}</span>)}
                            </div>
                        )}

                        {!t.conducted && t.sp_sampled !== null && (
                            <div className="grid grid-cols-3 gap-2 border-t border-gray-100 bg-gray-50 p-4 text-center">
                                <div><p className="text-lg font-extrabold text-gray-900">{t.sp_sampled}</p><p className="text-[11px] text-gray-500">Sampled</p></div>
                                <div><p className="text-lg font-extrabold text-gray-900">{t.sp_not_registered}</p><p className="text-[11px] text-gray-500">Not registered</p></div>
                                <div><p className={`text-lg font-extrabold ${t.sp_compliance >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>{t.sp_compliance ?? '-'}%</p><p className="text-[11px] text-gray-500">SP compliance</p></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </ReviewLayout>
    );
}
