import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Pencil, Printer, Trash2, CalendarDays, Users, UserRound, CheckCircle2, XCircle, ListChecks, Image as ImageIcon, X } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { SectionCard, InfoRow, Sheet, ActionBar, fmtDate, storageUrl, darkBtn, ghostBtn } from '@/Components/inspector/kit';

export default function ShowToolboxTalk({ toolboxTalk, user }) {
    const [lightbox, setLightbox] = useState(null);
    const [confirm, setConfirm] = useState(false);

    const isConducted = toolboxTalk.conducted === 'yes';
    const staffName = toolboxTalk.company_staff?.name || toolboxTalk.companyStaff?.name || toolboxTalk.conducted_by;
    const photos = [
        toolboxTalk.img_group && { src: storageUrl(toolboxTalk.img_group), label: 'Group photo' },
        toolboxTalk.img_attendance && { src: storageUrl(toolboxTalk.img_attendance), label: 'Attendance sheet' },
    ].filter(Boolean);

    return (
        <InspectorLayout user={user}>
            <Head title={`Talk: ${toolboxTalk.project?.name || 'Details'}`} />

            {lightbox && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
                    <button className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white" aria-label="Close">
                        <X className="h-6 w-6" />
                    </button>
                    <img src={lightbox} alt="Preview" className="max-h-full max-w-full rounded-2xl object-contain" />
                </div>
            )}

            <div className="mx-auto max-w-3xl space-y-4 px-4 pb-32 pt-5 sm:px-6 lg:pb-24">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Toolbox talk #{toolboxTalk.id}</p>
                            <h1 className="mt-1 text-xl font-extrabold leading-tight">{toolboxTalk.project?.name || '-'}</h1>
                        </div>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase ${isConducted ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            {isConducted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                            {isConducted ? 'Conducted' : 'Not conducted'}
                        </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-white/10 p-3">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300"><CalendarDays className="h-3.5 w-3.5 text-brand-400" /> Date</p>
                            <p className="mt-1 text-sm font-bold">{fmtDate(toolboxTalk.inspection_date, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-3">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-300"><Users className="h-3.5 w-3.5 text-brand-400" /> Attendance</p>
                            <p className="mt-1 text-sm font-bold">{toolboxTalk.total_attended ?? 0} participants</p>
                        </div>
                    </div>
                </div>

                <SectionCard title="Details" icon={UserRound}>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <InfoRow label="Project">{toolboxTalk.project?.name}</InfoRow>
                        <InfoRow label="Conducted by">{staffName}</InfoRow>
                    </div>
                </SectionCard>

                {isConducted && (toolboxTalk.topics || []).length > 0 && (
                    <SectionCard title="Topics discussed" icon={ListChecks}>
                        <div className="flex flex-wrap gap-2">
                            {toolboxTalk.topics.map((t) => (
                                <span key={t.id} className="rounded-xl border border-brand-300 bg-brand-100 px-3 py-2 text-xs font-bold text-brand-900">
                                    {t.name || t.title}
                                </span>
                            ))}
                        </div>
                    </SectionCard>
                )}

                {photos.length > 0 && (
                    <SectionCard title="Site photos" icon={ImageIcon}>
                        <div className="grid grid-cols-2 gap-3">
                            {photos.map((p) => (
                                <div key={p.src}>
                                    <button onClick={() => setLightbox(p.src)} className="aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 active:scale-[0.98] transition">
                                        <img src={p.src} alt={p.label} className="h-full w-full object-cover" />
                                    </button>
                                    <p className="mt-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">{p.label}</p>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                )}
            </div>

            <ActionBar>
                <Link href={`/inspector/toolbox-talks/${toolboxTalk.id}/edit`} className={darkBtn}>
                    <Pencil className="h-4 w-4" /> Edit
                </Link>
                <button onClick={() => window.print()} className={ghostBtn}>
                    <Printer className="h-4 w-4" /> Print
                </button>
                <button
                    onClick={() => setConfirm(true)}
                    className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 active:scale-95 transition"
                    aria-label="Delete"
                >
                    <Trash2 className="h-5 w-5" />
                </button>
            </ActionBar>

            <Sheet
                open={confirm}
                onClose={() => setConfirm(false)}
                title="Delete this toolbox talk?"
                footer={
                    <div className="flex gap-3">
                        <button onClick={() => setConfirm(false)} className={ghostBtn}>Cancel</button>
                        <button
                            onClick={() => router.delete(`/inspector/toolbox-talks/${toolboxTalk.id}`)}
                            className="inline-flex flex-1 items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-bold text-white active:scale-95 transition"
                        >
                            Delete
                        </button>
                    </div>
                }
            >
                <p className="py-2 text-sm text-gray-600">This cannot be undone.</p>
            </Sheet>
        </InspectorLayout>
    );
}
