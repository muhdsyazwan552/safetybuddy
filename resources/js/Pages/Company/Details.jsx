import React, { useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import {
    Building2, Hash, Mail, Phone, MapPin, FolderKanban, Users, ClipboardCheck, HardHat, Handshake,
    CheckCircle2, Save, Loader2, Undo2, CalendarDays, BadgeCheck, AlertCircle, PackageCheck,
} from 'lucide-react';
import AppLayout from '@/Pages/WSIS/Layout';
import { inputClass, labelClass, SectionCard } from '@/Components/inspector/kit';

function Field({ label, icon: Icon, error, children, hint }) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            <div className="relative">
                {Icon && <Icon className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-gray-400" />}
                {children}
            </div>
            {hint && !error && <p className="mt-1.5 ml-1 text-[11px] text-gray-400">{hint}</p>}
            {error && (
                <p className="mt-1.5 ml-1 flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" /> {error}
                </p>
            )}
        </div>
    );
}

const statusTone = (status) => {
    const k = String(status || '').toLowerCase();
    if (k === 'active') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (['expired', 'cancelled', 'inactive', 'suspended'].includes(k)) return 'bg-red-50 text-red-700 border-red-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
};

export default function Details({ company, stats = {}, subscriptions = [] }) {
    const { data, setData, put, processing, errors, isDirty, reset, recentlySuccessful } = useForm({
        name: company.name || '',
        registration_no: company.registration_no || '',
        email: company.email || '',
        contact: company.contact || '',
        address: company.address || '',
    });

    // profile completeness, updates live while typing
    const { pct, missing } = useMemo(() => {
        const fields = [
            ['name', 'Company name'],
            ['registration_no', 'Registration number'],
            ['email', 'Email'],
            ['contact', 'Phone'],
            ['address', 'Address'],
        ];
        const miss = fields.filter(([k]) => !String(data[k] || '').trim()).map(([, l]) => l);
        return { pct: Math.round(((fields.length - miss.length) / fields.length) * 100), missing: miss };
    }, [data]);

    const submit = (e) => {
        e.preventDefault();
        put('/company-details', { preserveScroll: true });
    };

    const statCards = [
        { label: 'Projects', value: stats.projects, sub: `${stats.active_projects ?? 0} active`, icon: FolderKanban },
        { label: 'Staff', value: stats.staff, icon: Users },
        { label: 'Subcontractors', value: stats.subcons, icon: Handshake },
        { label: 'Inspections', value: stats.inspections, icon: ClipboardCheck },
        { label: 'Toolbox talks', value: stats.toolbox_talks, icon: HardHat },
    ];

    return (
        <AppLayout title="Company Details">
            <Head title="Company Details" />

            <div className="mx-auto max-w-6xl space-y-5 pb-8">
                {/* Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg sm:p-7">
                    <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-500/20 blur-2xl" />
                    <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-brand-500 text-3xl font-extrabold text-ink-900 shadow-lg sm:h-20 sm:w-20 sm:text-4xl">
                                {(data.name || '?').charAt(0).toUpperCase()}
                            </span>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Company profile</p>
                                <h1 className="truncate text-xl font-extrabold sm:text-2xl">{data.name || 'Unnamed company'}</h1>
                                {company.code && <p className="mt-1 text-sm font-bold text-brand-400">{company.code}</p>}
                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-gray-300">
                                    {data.registration_no && <span className="inline-flex items-center gap-1"><Hash className="h-3.5 w-3.5 text-brand-400" />{data.registration_no}</span>}
                                    {company.status && (
                                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusTone(company.status)}`}>{company.status}</span>
                                    )}
                                    <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-brand-400" />Since {company.created_at}</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full shrink-0 rounded-2xl bg-white/10 p-4 sm:w-64">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-gray-300">Profile completeness</span>
                                <span className="text-brand-400">{pct}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15">
                                <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="mt-2 text-[11px] text-gray-400">
                                {missing.length === 0 ? 'All company details are filled in.' : `Missing: ${missing.join(', ')}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {statCards.map((c) => (
                        <div key={c.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{c.label}</span>
                                <c.icon className="h-4 w-4 text-gray-400" />
                            </div>
                            <p className="mt-2 text-2xl font-extrabold leading-none text-gray-900">{c.value ?? 0}</p>
                            {c.sub && <p className="mt-1 text-[11px] text-gray-400">{c.sub}</p>}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {/* Edit form */}
                    <form onSubmit={submit} className="lg:col-span-2">
                        <SectionCard title="Company information" icon={Building2}>
                            <div className="space-y-5">
                                <Field label="Company name *" icon={Building2} error={errors.name}>
                                    <input className={`${inputClass} pl-12`} value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                </Field>

                                <Field label="Registration number (SSM)" icon={Hash} error={errors.registration_no} hint="e.g. 201901012345 (1234567-A)">
                                    <input className={`${inputClass} pl-12`} value={data.registration_no} onChange={(e) => setData('registration_no', e.target.value)} />
                                </Field>

                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <Field label="Company phone" icon={Phone} error={errors.contact}>
                                        <input type="tel" inputMode="tel" className={`${inputClass} pl-12`} value={data.contact} onChange={(e) => setData('contact', e.target.value)} placeholder="+60 3-1234 5678" />
                                    </Field>
                                    <Field label="Company email" icon={Mail} error={errors.email}>
                                        <input type="email" className={`${inputClass} pl-12`} value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="info@company.com" />
                                    </Field>
                                </div>

                                <Field label="Address" icon={MapPin} error={errors.address}>
                                    <textarea rows={4} className={`${inputClass} pl-12`} value={data.address} onChange={(e) => setData('address', e.target.value)} placeholder="Street, city, postcode, state" />
                                </Field>
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                                <span className={`inline-flex items-center gap-1 text-sm font-bold text-emerald-600 transition-opacity ${recentlySuccessful ? 'opacity-100' : 'opacity-0'}`}>
                                    <CheckCircle2 className="h-4 w-4" /> Saved
                                </span>
                                <div className="flex gap-2">
                                    {isDirty && (
                                        <button type="button" onClick={() => reset()} className="inline-flex items-center gap-1.5 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 active:scale-95 transition">
                                            <Undo2 className="h-4 w-4" /> Undo
                                        </button>
                                    )}
                                    <button type="submit" disabled={processing || !isDirty} className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-ink-900 shadow-md active:scale-95 transition disabled:opacity-40">
                                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
                                    </button>
                                </div>
                            </div>
                        </SectionCard>
                    </form>

                    {/* Plan / subscriptions */}
                    <div>
                        <SectionCard title="Modules & plan" icon={PackageCheck}>
                            {subscriptions.length === 0 ? (
                                <p className="text-sm text-gray-400">No module subscriptions yet.</p>
                            ) : (
                                <ul className="-my-1 divide-y divide-gray-100">
                                    {subscriptions.map((s) => (
                                        <li key={s.id} className="py-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-extrabold text-gray-900">{s.module}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {s.start_date || '-'} → {s.end_date || '-'}
                                                    </p>
                                                </div>
                                                <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase ${s.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : statusTone(s.status)}`}>
                                                    {s.is_active ? 'Active' : s.status || 'Inactive'}
                                                </span>
                                            </div>
                                            {s.type && (
                                                <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400">
                                                    <BadgeCheck className="h-3 w-3" /> {s.type}
                                                </p>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </SectionCard>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
