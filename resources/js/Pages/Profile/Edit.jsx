import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    User, Mail, Phone, ShieldCheck, KeyRound, Eye, EyeOff, Building2, CalendarDays, BadgeCheck,
    LogOut, Loader2, Check, Save, AlertCircle,
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

export default function Edit({ account = {}, mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth.user;
    // every role gets the shell of its own portal: Manager / Supervisor -> review, Inspector -> inspector, others -> admin
    const roleId = Number(user.role_id);
    const isReviewer = [3, 4].includes(roleId);
    const isInspector = !isReviewer && INSPECTOR_ROLES.includes(roleId);
    const Layout = isReviewer ? ReviewLayout : isInspector ? InspectorLayout : AdminLayout;
    const layoutProps = isReviewer ? { title: 'My profile' } : isInspector ? { user } : { title: 'Settings' };

    const initial = (user.name || '?').charAt(0).toUpperCase();

    const details = [
        { icon: BadgeCheck, label: 'Role', value: account.role || user.role?.name || '-' },
        { icon: Building2, label: 'Company', value: account.company || user.company?.name || '-' },
        { icon: CalendarDays, label: 'Member since', value: account.member_since || '-' },
        { icon: ShieldCheck, label: 'Email', value: account.email_verified ? 'Verified' : 'Not verified', ok: account.email_verified },
    ];

    return (
        <Layout {...layoutProps}>
            <Head title="Settings" />

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
                        <Link href="/email/verification-notification" method="post" as="button" className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-white">
                            Resend verification
                        </Link>
                    </div>
                )}
                {status === 'verification-link-sent' && (
                    <p className="mb-5 text-sm font-semibold text-emerald-600">A new verification link has been sent to your email.</p>
                )}

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    <ProfileForm user={user} />
                    <PasswordForm />
                </div>

                {/* Session */}
                <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-sm font-extrabold text-gray-900">Sign out</h2>
                        <p className="text-xs text-gray-500">End your session on this device.</p>
                    </div>
                    <button
                        onClick={() => confirmLogout()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-extrabold text-red-600 active:scale-95 transition"
                    >
                        <LogOut className="h-4 w-4" /> Log out
                    </button>
                </div>
            </div>
        </Layout>
    );
}
