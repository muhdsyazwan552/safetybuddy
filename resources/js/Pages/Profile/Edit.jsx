import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    User, Mail, Phone, ShieldCheck, KeyRound, Eye, EyeOff, Building2, CalendarDays, BadgeCheck,
    LogOut, Loader2, Check, Save, AlertCircle, MapPin, Hash, PackageCheck, Clock3, ArrowRight,
} from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import AdminLayout from '@/Pages/WSIS/Layout';
import ReviewLayout from '@/Layouts/ReviewLayout';
import { confirmLogout } from '@/Helpers/logout';

const INSPECTOR_ROLES = [4, 7, 8];

const inputClass =
    'w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900 placeholder-gray-400 ' +
    'focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20 transition';
const labelClass = 'mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500';
const formatDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatMoney = (value) => value === null || value === undefined ? '—' : `RM ${Number(value).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Card({ icon: Icon, title, hint, children }) {
    return (
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-brand-400">
                    <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                    <h2 className="text-sm font-extrabold text-gray-900">{title}</h2>
                    {hint && <p className="truncate text-xs text-gray-500">{hint}</p>}
                </div>
            </div>
            <div className="p-5">{children}</div>
        </section>
    );
}

function Field({ label, error, icon: Icon, children }) {
    return (
        <div>
            <label className={labelClass}>{label}</label>
            <div className="relative">
                {Icon && <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />}
                {children}
            </div>
            {error && (
                <p className="mt-1.5 ml-1 flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" /> {error}
                </p>
            )}
        </div>
    );
}

function Saved({ show }) {
    return (
        <span className={`inline-flex items-center gap-1 text-sm font-bold text-emerald-600 transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`}>
            <Check className="h-4 w-4" /> Saved
        </span>
    );
}

// 0–4 score, purely client-side so it updates while typing
function strength(pw) {
    let s = 0;
    if (pw.length >= 8) s += 1;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1;
    if (/\d/.test(pw)) s += 1;
    if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s += 1;
    return s;
}
const STRENGTH = [
    { label: 'Too short', color: 'bg-gray-200', text: 'text-gray-400' },
    { label: 'Weak', color: 'bg-red-500', text: 'text-red-500' },
    { label: 'Fair', color: 'bg-orange-500', text: 'text-orange-500' },
    { label: 'Good', color: 'bg-amber-400', text: 'text-amber-600' },
    { label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-600' },
];

function ProfileForm({ user }) {
    const { data, setData, patch, processing, errors, recentlySuccessful, isDirty, reset } = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch('/profile', { preserveScroll: true });
    };

    return (
        <Card icon={User} title="Profile information" hint="Your name and how we can reach you">
            <form onSubmit={submit} className="space-y-4">
                <Field label="Full name" error={errors.name} icon={User}>
                    <input className={`${inputClass} pl-12`} value={data.name} onChange={(e) => setData('name', e.target.value)} autoComplete="name" required />
                </Field>
                <Field label="Email address" error={errors.email} icon={Mail}>
                    <input type="email" className={`${inputClass} pl-12`} value={data.email} onChange={(e) => setData('email', e.target.value)} autoComplete="email" required />
                </Field>
                <Field label="Phone" error={errors.phone} icon={Phone}>
                    <input type="tel" inputMode="tel" className={`${inputClass} pl-12`} value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="+60 12-345 6789" autoComplete="tel" />
                </Field>

                <div className="flex items-center justify-between gap-3 pt-1">
                    <Saved show={recentlySuccessful} />
                    <div className="ml-auto flex gap-2">
                        {isDirty && (
                            <button type="button" onClick={() => reset()} className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600 active:scale-95 transition">
                                Undo
                            </button>
                        )}
                        <button type="submit" disabled={processing || !isDirty} className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-ink-900 shadow-md active:scale-95 transition disabled:opacity-40">
                            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
                        </button>
                    </div>
                </div>
            </form>
            {/* live preview data for the hero is lifted via the shared form state below */}
        </Card>
    );
}

function CompanyForm({ company }) {
    const { data, setData, put, processing, errors, recentlySuccessful, isDirty, reset } = useForm({
        name: company.name || '',
        registration_no: company.registration_no || '',
        email: company.email || '',
        contact: company.contact || '',
        address: company.address || '',
    });

    return <Card icon={Building2} title="Company details" hint="Business information for your account">
        <form onSubmit={(event) => { event.preventDefault(); put('/company-details', { preserveScroll: true }); }} className="space-y-4">
            <p className="text-sm text-gray-600">Company code: <span className="font-bold text-ink-900">{company.code || '—'}</span></p>
            <Field label="Company name" error={errors.name} icon={Building2}>
                <input className={`${inputClass} pl-12`} value={data.name} onChange={(event) => setData('name', event.target.value)} required />
            </Field>
            <Field label="Registration number (SSM)" error={errors.registration_no} icon={Hash}>
                <input className={`${inputClass} pl-12`} value={data.registration_no} onChange={(event) => setData('registration_no', event.target.value)} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company phone" error={errors.contact} icon={Phone}>
                    <input type="tel" className={`${inputClass} pl-12`} value={data.contact} onChange={(event) => setData('contact', event.target.value)} />
                </Field>
                <Field label="Company email" error={errors.email} icon={Mail}>
                    <input type="email" className={`${inputClass} pl-12`} value={data.email} onChange={(event) => setData('email', event.target.value)} />
                </Field>
            </div>
            <Field label="Company address" error={errors.address} icon={MapPin}>
                <textarea rows={4} className={`${inputClass} pl-12`} value={data.address} onChange={(event) => setData('address', event.target.value)} placeholder="Street, city, postcode, state" />
            </Field>
            <div className="flex items-center justify-between gap-3 pt-1">
                <Saved show={recentlySuccessful} />
                <div className="ml-auto flex gap-2">
                    {isDirty && <button type="button" onClick={() => reset()} className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-600">Undo</button>}
                    <button type="submit" disabled={processing || !isDirty} className="inline-flex items-center gap-2 rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-extrabold text-ink-900 shadow-md disabled:opacity-40">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save company
                    </button>
                </div>
            </div>
        </form>
    </Card>;
}

function SubscriptionDetails({ subscription }) {
    const current = subscription?.currentPackage;
    const history = subscription?.history || [];
    const active = current?.status === 'active';

    return <Card icon={PackageCheck} title="Subscription details" hint="Current package and payment history">
        {current ? <div className="rounded-2xl bg-ink-950 p-5 text-white sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">{active ? 'Current package' : 'Previous package'}</p>
                    <h3 className="mt-2 text-xl font-extrabold">{current.package_name}</h3>
                    <p className="mt-1 text-xs text-gray-300">{current.module_name || 'Safety Buddy'} · {current.type === 'renew' ? 'Renewal' : 'Subscription'}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? 'bg-emerald-400/20 text-emerald-300' : 'bg-orange-400/20 text-orange-200'}`}>{active ? 'Active' : current.status || 'Inactive'}</span>
            </div>
            <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-4">
                <div><p className="text-xs text-gray-400">Started</p><p className="mt-1 text-sm font-bold">{formatDate(current.start_date)}</p></div>
                <div><p className="text-xs text-gray-400">Expires</p><p className="mt-1 text-sm font-bold">{formatDate(current.end_date)}</p></div>
                <div><p className="text-xs text-gray-400">Amount</p><p className="mt-1 text-sm font-bold">{formatMoney(current.amount)}</p></div>
                <div><p className="text-xs text-gray-400">Time left</p><p className="mt-1 text-sm font-bold">{active && current.days_remaining !== null ? `${current.days_remaining} days` : '—'}</p></div>
            </div>
        </div> : <p className="rounded-2xl bg-gray-50 p-5 text-sm text-gray-500">No package has been recorded for this company yet.</p>}

        {history.length > 0 && <div className="mt-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-gray-900"><Clock3 className="h-4 w-4" /> Subscription history</h3>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="min-w-[640px] w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-4 py-3">Package</th><th className="px-4 py-3">Period</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">{history.map((item) => <tr key={item.id}>
                        <td className="px-4 py-3 font-bold text-gray-900">{item.package_name}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(item.start_date)} – {formatDate(item.end_date)}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatMoney(item.amount)}</td>
                        <td className="px-4 py-3 capitalize text-gray-700">{item.status}</td>
                    </tr>)}</tbody>
                </table>
            </div>
        </div>}
        <Link href="/plans" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-ink-900 hover:text-brand-700">Manage package <ArrowRight className="h-4 w-4" /></Link>
    </Card>;
}

function PasswordForm() {
    const [show, setShow] = useState(false);
    const { data, setData, put, processing, errors, reset, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const score = useMemo(() => strength(data.password), [data.password]);
    const meta = STRENGTH[data.password ? score : 0];
    const mismatch = data.password_confirmation && data.password !== data.password_confirmation;

    const submit = (e) => {
        e.preventDefault();
        put('/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) reset('password', 'password_confirmation');
                if (errs.current_password) reset('current_password');
            },
        });
    };

    const eye = (
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-gray-400" aria-label="Show or hide passwords">
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
    );

    return (
        <Card icon={KeyRound} title="Password & security" hint="Use a long, unique password">
            <form onSubmit={submit} className="space-y-4">
                <Field label="Current password" error={errors.current_password} icon={KeyRound}>
                    <input type={show ? 'text' : 'password'} className={`${inputClass} pl-12 pr-12`} value={data.current_password} onChange={(e) => setData('current_password', e.target.value)} autoComplete="current-password" />
                    {eye}
                </Field>

                <Field label="New password" error={errors.password} icon={ShieldCheck}>
                    <input type={show ? 'text' : 'password'} className={`${inputClass} pl-12`} value={data.password} onChange={(e) => setData('password', e.target.value)} autoComplete="new-password" />
                </Field>

                {data.password && (
                    <div>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4].map((n) => (
                                <span key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${score >= n ? meta.color : 'bg-gray-200'}`} />
                            ))}
                        </div>
                        <p className={`mt-1.5 text-xs font-bold ${meta.text}`}>{meta.label}</p>
                    </div>
                )}

                <Field label="Confirm new password" error={mismatch ? 'Passwords do not match' : errors.password_confirmation} icon={ShieldCheck}>
                    <input type={show ? 'text' : 'password'} className={`${inputClass} pl-12`} value={data.password_confirmation} onChange={(e) => setData('password_confirmation', e.target.value)} autoComplete="new-password" />
                </Field>

                <div className="flex items-center justify-between pt-1">
                    <Saved show={recentlySuccessful} />
                    <button
                        type="submit"
                        disabled={processing || !data.current_password || !data.password || mismatch}
                        className="ml-auto inline-flex items-center gap-2 rounded-2xl bg-ink-900 px-5 py-2.5 text-sm font-extrabold text-brand-400 shadow-md active:scale-95 transition disabled:opacity-40"
                    >
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Update password
                    </button>
                </div>
            </form>
        </Card>
    );
}

export default function Edit({ account = {}, company = null, subscription = null, mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth.user;
    // every role gets the shell of its own portal: Manager / Supervisor -> review, Inspector -> inspector, others -> admin
    const roleId = Number(user.role_id);
    const isReviewer = [3, 4].includes(roleId);
    const isInspector = !isReviewer && INSPECTOR_ROLES.includes(roleId);
    const Layout = isReviewer ? ReviewLayout : isInspector ? InspectorLayout : AdminLayout;
    const layoutProps = isReviewer ? { title: 'My profile' } : isInspector ? { user } : { title: company ? 'Profile & company' : 'Settings' };
    const tabs = [
        { id: 'personal', label: 'Personal', icon: User },
        ...(company ? [
            { id: 'company', label: 'Company', icon: Building2 },
            { id: 'subscription', label: 'Subscription', icon: PackageCheck },
        ] : []),
        { id: 'security', label: 'Security', icon: KeyRound },
    ];
    const [activeTab, setActiveTab] = useState(() => {
        const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
        return tabs.some((tab) => tab.id === hash) ? hash : 'personal';
    });

    useEffect(() => {
        const syncTab = () => {
            const hash = window.location.hash.slice(1);
            if (tabs.some((tab) => tab.id === hash)) setActiveTab(hash);
        };
        window.addEventListener('hashchange', syncTab);
        return () => window.removeEventListener('hashchange', syncTab);
    }, [company]);

    const selectTab = (tab) => {
        setActiveTab(tab);
        window.history.replaceState(null, '', `#${tab}`);
    };

    const initial = (user.name || '?').charAt(0).toUpperCase();

    const details = [
        { icon: BadgeCheck, label: 'Role', value: account.role || user.role?.name || '-' },
        { icon: Building2, label: 'Company', value: account.company || user.company?.name || '-' },
        { icon: CalendarDays, label: 'Member since', value: account.member_since || '-' },
        { icon: ShieldCheck, label: 'Email', value: account.email_verified ? 'Verified' : 'Not verified', ok: account.email_verified },
    ];

    return (
        <Layout {...layoutProps}>
            <Head title={company ? 'Profile & company' : 'Settings'} />

            <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
                {/* Hero */}
                <div className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg sm:p-7">
                    <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-500/20 blur-2xl" />
                    <div className="relative flex items-center gap-4 sm:gap-5">
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-brand-500 text-3xl font-extrabold text-ink-900 shadow-lg sm:h-20 sm:w-20 sm:text-4xl">
                            {initial}
                        </span>
                        <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">My account</p>
                            <h1 className="truncate text-xl font-extrabold sm:text-2xl">{user.name}</h1>
                            <p className="truncate text-sm text-gray-300">{user.email}</p>
                            {account.role && (
                                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-brand-400">
                                    <BadgeCheck className="h-3.5 w-3.5" /> {account.role}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Account facts */}
                <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {details.map((d) => (
                        <div key={d.label} className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
                            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                                <d.icon className="h-3.5 w-3.5" /> {d.label}
                            </p>
                            <p className={`mt-1 truncate text-sm font-extrabold ${d.ok === false ? 'text-amber-600' : d.ok ? 'text-emerald-600' : 'text-gray-900'}`}>{d.value}</p>
                        </div>
                    ))}
                </div>

                {mustVerifyEmail && !account.email_verified && (
                    <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                        <span>Your email address is not verified.</span>
                        <Link href="/verify-email" className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-white">
                            Verify email
                        </Link>
                    </div>
                )}
                {status === 'verification-link-sent' && (
                    <p className="mb-5 text-sm font-semibold text-emerald-600">A new verification link has been sent to your email.</p>
                )}

                <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
                    <nav aria-label="Profile sections" role="tablist" className="flex gap-2 overflow-x-auto rounded-3xl border border-gray-100 bg-white p-2 shadow-sm lg:sticky lg:top-4 lg:flex-col lg:overflow-visible">
                        {tabs.map((tab) => <button
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === tab.id}
                            aria-controls={`panel-${tab.id}`}
                            onClick={() => selectTab(tab.id)}
                            className={`flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition lg:w-full ${activeTab === tab.id ? 'bg-ink-950 text-brand-400 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                        >
                            <tab.icon className="h-4 w-4" /> {tab.label}
                        </button>)}
                    </nav>

                    <div className="min-w-0">
                        <div id="panel-personal" role="tabpanel" aria-labelledby="tab-personal" hidden={activeTab !== 'personal'} className="max-w-3xl">
                            <ProfileForm user={user} />
                        </div>
                        {company && <div id="panel-company" role="tabpanel" aria-labelledby="tab-company" hidden={activeTab !== 'company'} className="max-w-3xl">
                            <CompanyForm company={company} />
                        </div>}
                        {company && <div id="panel-subscription" role="tabpanel" aria-labelledby="tab-subscription" hidden={activeTab !== 'subscription'}>
                            <SubscriptionDetails subscription={subscription} />
                        </div>}
                        <div id="panel-security" role="tabpanel" aria-labelledby="tab-security" hidden={activeTab !== 'security'} className="max-w-3xl space-y-5">
                            <PasswordForm />
                            <div className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-sm font-extrabold text-gray-900">Sign out</h2>
                                    <p className="text-xs text-gray-500">End your session on this device.</p>
                                </div>
                                <button onClick={() => confirmLogout()} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-extrabold text-red-600 active:scale-95 transition">
                                    <LogOut className="h-4 w-4" /> Log out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
