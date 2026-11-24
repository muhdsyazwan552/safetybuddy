import BackLink from '@/Components/shared/BackLink';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    User, Mail, Phone, ShieldCheck, KeyRound, Eye, EyeOff, Building2,
    LogOut, Loader2, Check, Save, AlertCircle, MapPin, Hash, PackageCheck, ChevronRight, ArrowLeft, Upload,
} from 'lucide-react';
import { confirmLogout } from '@/Helpers/logout';
import CompanyAvatar from '@/Components/CompanyAvatar';
import ReviewLayout from '@/Layouts/ReviewLayout';
import InspectorLayout from '@/Layouts/InspectorLayout';

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 ' +
    'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition';
const STATES = ['Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis', 'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'Kuala Lumpur', 'Labuan', 'Putrajaya'];
const labelClass = 'mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500';
const formatDate = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const formatMoney = (value) => value === null || value === undefined ? '—' : `RM ${Number(value).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Card({ icon: Icon, title, hint, children }) {
    return (
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5 sm:px-6">
                <Icon className="h-5 w-5 shrink-0 text-ink-900" />
                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    {hint && <p className="text-sm text-gray-500">{hint}</p>}
                </div>
            </div>
            <div className="p-5 sm:p-6">{children}</div>
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
        phone: user.phone || '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch('/profile', { preserveScroll: true });
    };

    return (
        <Card icon={User} title="Personal profile" hint="Your name and how we can reach you">
            <form onSubmit={submit} className="space-y-4">
                <Field label="Full name" error={errors.name} icon={User}>
                    <input className={`${inputClass} pl-12`} value={data.name} onChange={(e) => setData('name', e.target.value)} autoComplete="name" required />
                </Field>
                <Field label="Email address" icon={Mail}>
                    <input type="email" className={`${inputClass} pl-12 cursor-not-allowed select-none !bg-gray-100 !text-gray-400 opacity-60`} value={user.email || ''} readOnly disabled aria-readonly="true" />
                </Field>
                <p className="-mt-2 pl-1 text-xs text-gray-400">The email is your login and cannot be changed.</p>
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
    const logoForm = useForm({ logo: null });
    const logoInput = useRef(null);
    const logoPreview = useMemo(() => logoForm.data.logo ? URL.createObjectURL(logoForm.data.logo) : null, [logoForm.data.logo]);
    useEffect(() => () => { if (logoPreview) URL.revokeObjectURL(logoPreview); }, [logoPreview]);
    const { data, setData, put, processing, errors, recentlySuccessful, isDirty, reset } = useForm({
        name: company.name || '',
        registration_no: company.registration_no || '',
        email: company.email || '',
        contact: company.contact || '',
        address: company.address || '',
        city: company.city || '',
        postcode: company.postcode || '',
        state: company.state || '',
    });

    return <Card icon={Building2} title="Company profile" hint="Business information for your account">
        <form onSubmit={(event) => { event.preventDefault(); logoForm.post('/company-details/logo', { forceFormData: true, preserveScroll: true, onSuccess: () => { logoForm.reset('logo'); if (logoInput.current) logoInput.current.value = ''; } }); }} className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <CompanyAvatar name={company.name} logoUrl={logoPreview || company.logo_url} className="h-20 w-20 text-3xl shadow-sm" />
            <div className="min-w-0 flex-1">
                <label htmlFor="company-logo" className="block text-sm font-bold text-ink-950">Company logo</label>
                <p className="mt-0.5 text-xs text-gray-500">JPG, PNG or WebP, up to 2 MB. A square image works best.</p>
                <input ref={logoInput} id="company-logo" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => logoForm.setData('logo', event.target.files?.[0] || null)} className="mt-3 block w-full max-w-sm text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:font-semibold file:text-ink-950 file:shadow-sm hover:file:bg-brand-50" />
                {logoForm.errors.logo && <p className="mt-2 text-xs font-semibold text-red-600" role="alert">{logoForm.errors.logo}</p>}
            </div>
            <button type="submit" disabled={!logoForm.data.logo || logoForm.processing} className="inline-flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-ink-800 disabled:cursor-not-allowed disabled:opacity-40">{logoForm.processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{company.logo_url ? 'Replace logo' : 'Upload logo'}</button>
        </form>
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
                <textarea rows={3} className={`${inputClass} pl-12`} value={data.address} onChange={(event) => setData('address', event.target.value)} placeholder="Street / building" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
                <Field label="City" error={errors.city}><input className={inputClass} value={data.city} onChange={(event) => setData('city', event.target.value)} /></Field>
                <Field label="Postcode" error={errors.postcode}><input className={inputClass} value={data.postcode} onChange={(event) => setData('postcode', event.target.value)} inputMode="numeric" maxLength={10} /></Field>
                <Field label="State" error={errors.state}>
                    <select className={inputClass} value={data.state} onChange={(event) => setData('state', event.target.value)}>
                        <option value="">Select state</option>
                        {STATES.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                </Field>
            </div>
            <p className="-mt-2 pl-1 text-xs text-gray-400">A complete address lets us place your company on the Training Provider search by distance.</p>
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

function SubscriptionDetails({ subscription, accountType }) {
    const current = subscription?.currentPackage;
    const active = current?.status === 'active';
    // a company registered under a Training Provider does not see package prices: the provider pays for them
    const hideAmount = Boolean(accountType?.provider);
    const start = current?.start_date ? new Date(`${current.start_date}T00:00:00`).getTime() : null;
    const end = current?.end_date ? new Date(`${current.end_date}T00:00:00`).getTime() : null;
    const today = new Date().setHours(0, 0, 0, 0);
    const progress = start !== null && end !== null && end > start
        ? Math.max(0, Math.min(100, Math.round(((today - start) / (end - start)) * 100)))
        : 0;

    return <div className="space-y-5">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" aria-labelledby="membership-package-title">
            <div className="h-1 bg-brand-500" />
            {current ? <>
                <div className="p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div><p className="text-xs font-bold uppercase tracking-widest text-brand-800">{active ? 'Current membership' : 'Previous membership'}</p><h3 id="membership-package-title" className="mt-2 text-2xl font-bold text-ink-950">{current.package_name}</h3><p className="mt-1 text-sm text-gray-500">{current.module_name || 'Safety Buddy'} · {current.type === 'renew' ? 'Renewal' : 'Membership'}</p></div>
                        <div className="flex items-center gap-2"><span className="text-xs font-semibold text-gray-500">Subscription status</span><span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{active ? 'Active' : current.status || 'Inactive'}</span></div>
                    </div>
                    <div className={`mt-6 grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 ${hideAmount ? 'lg:grid-cols-3' : 'lg:grid-cols-4'}`}>
                        <div><p className="text-xs font-semibold text-gray-500">Started</p><p className="mt-1 text-sm font-bold text-ink-900">{formatDate(current.start_date)}</p></div>
                        <div><p className="text-xs font-semibold text-gray-500">Expires</p><p className="mt-1 text-sm font-bold text-ink-900">{formatDate(current.end_date)}</p></div>
                        {!hideAmount && <div><p className="text-xs font-semibold text-gray-500">Amount</p><p className="mt-1 text-sm font-bold text-ink-900">{formatMoney(current.amount)}</p></div>}
                        <div><p className="text-xs font-semibold text-gray-500">Time left</p><p className="mt-1 text-sm font-bold text-ink-900">{active && current.days_remaining !== null ? `${current.days_remaining} ${current.days_remaining === 1 ? 'day' : 'days'}` : '—'}</p></div>
                    </div>
                    <div className="mt-6 border-t border-gray-100 pt-5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-gray-500"><span>Subscription period</span><span>{progress}% elapsed</span></div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100" role="progressbar" aria-label="Subscription period elapsed" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-brand-500" style={{ width: `${progress}%` }} /></div>
                        <div className="mt-2 flex justify-between gap-3 text-xs text-gray-500"><span>{formatDate(current.start_date)}</span><span>{formatDate(current.end_date)}</span></div>
                    </div>
                    {accountType?.provider && <div className="mt-5 rounded-lg bg-brand-50 p-4 text-sm text-ink-800"><span className="font-bold">Under Training Provider:</span> {accountType.provider.name}</div>}
                </div>
            </> : <p className="p-6 text-sm text-gray-500">No package has been recorded for this company yet.</p>}
            <div className="divide-y divide-gray-100 border-t border-gray-100">
                <Link href={active ? '/manage-package#membership' : '/plans'} className="flex items-center justify-between px-5 py-4 text-sm font-semibold text-ink-950 hover:bg-gray-50 sm:px-6">{active ? 'Manage Slot' : 'View packages'} <ChevronRight className="h-4 w-4" /></Link>
                <Link href="/manage-package/payments" className="flex items-center justify-between px-5 py-4 text-sm font-semibold text-ink-950 hover:bg-gray-50 sm:px-6">Payment history <ChevronRight className="h-4 w-4" /></Link>
            </div>
        </section>

    </div>;
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
        <Card icon={KeyRound} title="Security" hint="Use a long, unique password">
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

/** "Stay signed in" switch: on by default for every role, saved straight away. */
function StaySignedInCard({ enabled }) {
    const [on, setOn] = useState(Boolean(enabled));
    const [saving, setSaving] = useState(false);

    const toggle = () => {
        const next = !on;
        setOn(next);
        router.patch('/settings/stay-signed-in', { stay_signed_in: next }, {
            preserveScroll: true,
            onStart: () => setSaving(true),
            onError: () => setOn(!next),
            onFinish: () => setSaving(false),
        });
    };

    return (
        <Card icon={ShieldCheck} title="Stay signed in" hint="Skip the login page when you open Safety Buddy on this device">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-600">
                    {on ? 'You stay signed in until you log out. Turn this off on a shared device.' : 'You will need to log in again after your session ends.'}
                </p>
                <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-label="Stay signed in"
                    onClick={toggle}
                    disabled={saving}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-60 ${on ? 'bg-brand-500' : 'bg-gray-300'}`}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${on ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </Card>
    );
}

/** Supervisor / Manager / Inspector: a simple one-column profile inside their own portal, same as the inspector app. */
function PortalProfile({ user, account, mustVerifyEmail, status, staySignedIn }) {
    const roleId = Number(user.role_id);
    const Layout = [3, 4].includes(roleId) ? ReviewLayout : InspectorLayout;
    const layoutProps = [3, 4].includes(roleId) ? { title: 'My profile' } : { user };
    const initial = (user.name || '?').charAt(0).toUpperCase();

    return (
        <Layout {...layoutProps}>
            <Head title="My profile" />
            <div className="mx-auto w-full max-w-2xl space-y-4 px-3 pb-12 pt-4 sm:px-4 sm:pt-6">
                <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-extrabold text-ink-950">{initial}</span>
                    <div className="min-w-0">
                        <p className="truncate text-lg font-extrabold text-ink-950">{user.name}</p>
                        <p className="truncate text-sm text-gray-500">{user.email}</p>
                        <p className="mt-1 inline-flex rounded-full bg-brand-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-900">{account.role || 'Staff'}</p>
                    </div>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Company</dt><dd className="mt-1 font-bold text-ink-950">{account.company || '—'}</dd></div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"><dt className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Member since</dt><dd className="mt-1 font-bold text-ink-950">{account.member_since || '—'}</dd></div>
                </dl>
                {mustVerifyEmail && !account.email_verified && (
                    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                        <span>Your email address is not verified.</span>
                        <Link href="/verify-email" className="rounded-xl bg-amber-500 px-4 py-2 text-center text-xs font-extrabold text-white">Verify email</Link>
                    </div>
                )}
                {status === 'verification-link-sent' && <p className="text-sm font-semibold text-emerald-600">A new verification link has been sent to your email.</p>}
                <ProfileForm user={user} />
                <PasswordForm />
                <StaySignedInCard enabled={staySignedIn} />
                <button onClick={() => confirmLogout()} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-extrabold text-red-600 active:scale-[0.99]">
                    <LogOut className="h-4 w-4" /> Log out
                </button>
            </div>
        </Layout>
    );
}

export default function Edit({ account = {}, company = null, accountType = null, subscription = null, mustVerifyEmail, status, staySignedIn = true }) {
    const { auth } = usePage().props;
    const user = auth.user;
    const roleId = Number(user.role_id);
    if ([3, 4, 7, 8].includes(roleId)) {
        return <PortalProfile user={user} account={account} mustVerifyEmail={mustVerifyEmail} status={status} staySignedIn={staySignedIn} />;
    }
    const dashboard = [3, 4].includes(roleId) ? '/review/dashboard' : [7, 8].includes(roleId) ? '/inspector/dashboard' : '/dashboard';
    const tabs = [
        ...(company ? [
            { id: 'membership', label: 'Membership', icon: PackageCheck },
        ] : []),
        { id: 'personal', label: 'Personal', icon: User },
        ...(company ? [{ id: 'company', label: 'Company', icon: Building2 }] : []),
        { id: 'security', label: 'Security', icon: KeyRound },
    ];
    const [activeTab, setActiveTab] = useState(() => {
        const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : '';
        const normalized = hash === 'subscription' ? 'membership' : hash;
        return tabs.some((tab) => tab.id === normalized) ? normalized : company ? 'membership' : 'personal';
    });

    useEffect(() => {
        const syncTab = () => {
            const hash = window.location.hash.slice(1) === 'subscription' ? 'membership' : window.location.hash.slice(1);
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
    const section = {
        membership: { title: 'Membership', description: 'Your package and payment details' },
        personal: { title: 'Personal', description: 'Your name and contact details' },
        company: { title: 'Company', description: 'Business information for your account' },
        security: { title: 'Security', description: 'Password and account access' },
    }[activeTab];

    return (
        <div className="min-h-screen bg-[#FAFAF9] text-ink-950">
            <Head title="Account settings" />
            <header className="border-b border-gray-200 bg-white shadow-sm">
                <div className="mx-auto flex w-full max-w-[1480px] items-center justify-between gap-4 px-4 py-3 sm:px-7 lg:px-10">
                    <Link href={dashboard} className="inline-flex min-w-0 items-center gap-3"><img src="/images/sbc-logo.png" alt="" className="h-10 w-10 shrink-0 rounded-full ring-1 ring-brand-400/60" /><span className="truncate text-sm font-black tracking-[.12em] text-ink-950 sm:text-base">SAFETY BUDDY</span></Link>
                    {company ? <CompanyAvatar name={company.name || user.name} logoUrl={company.logo_url} className="h-10 w-10 text-sm ring-1 ring-brand-400/60" /> : <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-ink-950">{initial}</span>}
                </div>
            </header>

            <div className="mx-auto grid w-full max-w-[1480px] gap-8 px-4 py-7 sm:px-7 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-12 lg:px-10 lg:py-10">
                <aside className="min-w-0 lg:sticky lg:top-8 lg:self-start" aria-label="Account navigation">
                    <nav role="tablist" aria-label="Account sections" className="flex gap-1 overflow-x-auto border-b border-gray-200 lg:flex-col lg:overflow-visible lg:border-0">
                        {tabs.map((tab) => <button key={tab.id} id={`tab-${tab.id}`} type="button" role="tab" aria-selected={activeTab === tab.id} aria-controls={`panel-${tab.id}`} onClick={() => selectTab(tab.id)} className={`flex shrink-0 items-center gap-3 border-b-[3px] px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-400 lg:w-full lg:rounded-lg lg:border-b-0 lg:border-l-[3px] ${activeTab === tab.id ? 'border-brand-500 bg-brand-50 text-ink-950' : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-ink-950'}`}><tab.icon className="h-5 w-5" />{tab.label}</button>)}
                    </nav>
                    <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-xl font-bold text-ink-950">{initial}</span>
                            <div className="min-w-0"><p className="truncate text-sm font-bold text-ink-950">{user.name}</p><p className="truncate text-xs text-gray-500">{user.email}</p></div>
                        </div>
                        <dl className="mt-4 space-y-2 border-t border-gray-100 pt-4 text-xs">
                            <div className="flex justify-between gap-2"><dt className="text-gray-500">Role</dt><dd className="text-right font-semibold text-ink-900">{account.role || user.role?.name || '—'}</dd></div>
                            {account.company && <div className="flex justify-between gap-2"><dt className="text-gray-500">Company</dt><dd className="text-right font-semibold text-ink-900">{account.company}</dd></div>}
                            <div className="flex justify-between gap-2"><dt className="text-gray-500">Member since</dt><dd className="text-right font-semibold text-ink-900">{account.member_since || '—'}</dd></div>
                            <div className="flex justify-between gap-2"><dt className="text-gray-500">Email</dt><dd className={`text-right font-semibold ${account.email_verified ? 'text-emerald-700' : 'text-amber-700'}`}>{account.email_verified ? 'Verified' : 'Not verified'}</dd></div>
                        </dl>
                    </div>
                </aside>

                <main className="min-w-0">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div><h1 className="text-3xl font-bold tracking-tight text-ink-950">{section.title}</h1><p className="mt-1 text-sm text-gray-600">{section.description}</p></div>
                        <BackLink href={dashboard} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-900 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"><ArrowLeft className="h-4 w-4" />Back</BackLink>
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

                <div className="min-w-0">
                        <div id="panel-personal" role="tabpanel" aria-labelledby="tab-personal" hidden={activeTab !== 'personal'} className="max-w-4xl">
                            <ProfileForm user={user} />
                        </div>
                        {company && <div id="panel-company" role="tabpanel" aria-labelledby="tab-company" hidden={activeTab !== 'company'} className="max-w-4xl space-y-5">
                            <CompanyForm company={company} />
                        </div>}
                        {company && <div id="panel-membership" role="tabpanel" aria-labelledby="tab-membership" hidden={activeTab !== 'membership'} className="max-w-5xl">
                            <SubscriptionDetails subscription={subscription} accountType={accountType} />
                        </div>}
                        <div id="panel-security" role="tabpanel" aria-labelledby="tab-security" hidden={activeTab !== 'security'} className="max-w-4xl space-y-5">
                            <PasswordForm />
                            <StaySignedInCard enabled={staySignedIn} />
                            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
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
                </main>
            </div>
        </div>
    );
}
