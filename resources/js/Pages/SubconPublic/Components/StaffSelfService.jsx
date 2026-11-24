// What a worker sees on the staff link: how to register, plus the Safety Passport topics (view only).
// The team and every person's details live on the leader link only.
import React, { useState } from 'react';
import { UserPlus, ChevronDown, ShieldCheck } from 'lucide-react';
import { TopicContent } from './AddStaffModal';

export default function StaffSelfService({ topics = [], onRegister }) {
    const [openId, setOpenId] = useState(null);

    return (
        <div className="space-y-4">
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-extrabold text-gray-900">Register New Staff / Mendaftar Pekerja Baru</h2>
                <div className="mt-3 space-y-2 text-sm italic leading-relaxed text-gray-600">
                    <p>To complete registration, open every Safety Passport topic and read all the rules. Tick each topic&rsquo;s box to confirm you understand it and agree to follow it.</p>
                    <p>Buka setiap topik Safety Passport dan baca semua peraturan. Untuk melengkapkan pendaftaran, tandakan setiap kotak sebagai pengesahan bahawa anda faham dan bersetuju untuk mematuhi peraturan tersebut.</p>
                </div>
                <button onClick={onRegister} className="sb-create mt-4 w-full justify-center sm:w-auto">
                    <UserPlus className="h-4 w-4" /> Register staff
                </button>
            </section>

            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 text-lg font-extrabold text-gray-900">
                        <ShieldCheck className="h-5 w-5 text-brand-700" /> Safety Passport
                    </h2>
                    <span className="text-xs font-semibold text-gray-400">{topics.length} topics</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">Read the rules before you register. / Baca peraturan sebelum mendaftar.</p>

                {topics.length === 0 ? (
                    <p className="mt-4 rounded-2xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">No Safety Passport topics set up.</p>
                ) : (
                    <ul className="mt-4 space-y-2">
                        {topics.map((t, n) => {
                            const open = openId === t.id;
                            return (
                                <li key={t.id} className="overflow-hidden rounded-2xl border-2 border-gray-200">
                                    <button type="button" onClick={() => setOpenId(open ? null : t.id)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-extrabold text-gray-600">{n + 1}</span>
                                        <span className="flex-1 text-sm font-bold text-gray-900">{t.title}</span>
                                        <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
                                    </button>
                                    {open && (
                                        <div className="border-t border-gray-100 bg-white px-3.5 py-3">
                                            <TopicContent items={t.items} />
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}
