// resources/js/Pages/SubconPublic/Components/AddStaffModal.jsx
// Register: step 1 = read + tick every Safety Passport topic, step 2 = staff details (+ optional certification).
import React, { useEffect, useState } from 'react';
import { X, User, Mail, Phone, BriefcaseBusiness, Loader2, Save, UserPlus, AlertCircle, ShieldCheck, ChevronDown, ArrowRight, ArrowLeft, Check } from 'lucide-react';

const input =
    'w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-12 pr-4 text-base text-gray-900 placeholder-gray-400 ' +
    'focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/20 transition';

function Field({ label, icon: Icon, error, hint, children }) {
    return (
        <div>
            <label className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</label>
            <div className="relative">
                <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
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

/** Topic content: bullets are grouped into one list, same item types as the Safety Passport panel. */
function TopicContent({ items = [] }) {
    const out = [];
    let bullets = [];
    const flush = (k) => {
        if (bullets.length) out.push(<ul key={`b${k}`} className="mb-2 list-disc space-y-1 pl-5 text-sm text-gray-700">{bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>);
        bullets = [];
    };
    items.forEach((it, i) => {
        if (it.type === 'bullet') { bullets.push(it.content); return; }
        flush(i);
        if (it.type === 'subheading') out.push(<p key={i} className="mb-1.5 mt-3 text-sm font-extrabold text-gray-900 first:mt-0">{it.content}</p>);
        else if (it.type === 'highlight') out.push(<p key={i} className="mb-2 rounded-xl border border-brand-300 bg-brand-100 px-3.5 py-2.5 text-sm font-extrabold text-ink-900">{it.content}</p>);
        else out.push(<p key={i} className="mb-2 text-sm leading-relaxed text-gray-700">{it.content}</p>);
    });
    flush('end');
    return <>{out}</>;
}

export default function AddStaffModal({ isOpen, onClose, onSubmit, data, setData, errors, processing, isEditing, isLeader = false, passportTopics = [] }) {
    const [step, setStep] = useState(1);
    const [openId, setOpenId] = useState(null);
    const [read, setRead] = useState([]); // topics the worker has opened - only those can be ticked

    const ticked = data.passport_topics || [];
    const allIds = passportTopics.map((t) => t.id);
    const allTicked = allIds.length > 0 && allIds.every((id) => ticked.includes(id));
    const onStepOne = !isEditing && step === 1;

    useEffect(() => {
        if (isOpen) { setStep(1); setOpenId(null); setRead([]); }
    }, [isOpen]);

    // the server rejected the passport ticks: send the worker back to step 1
    useEffect(() => {
        if (errors?.passport_topics) setStep(1);
    }, [errors?.passport_topics]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const onKey = (e) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const toggleOpen = (id) => {
        setOpenId(openId === id ? null : id);
        setRead((r) => (r.includes(id) ? r : [...r, id]));
    };
    const toggleTick = (id) => setData('passport_topics', ticked.includes(id) ? ticked.filter((x) => x !== id) : [...ticked, id]);

    const submit = (e) => {
        e.preventDefault();
        if (onStepOne) {
            if (allTicked) setStep(2);
            return;
        }
        onSubmit();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <form onSubmit={submit} className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-brand-400">
                            {isEditing ? <Save className="h-5 w-5" /> : onStepOne ? <ShieldCheck className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                        </span>
                        <div>
                            <h3 className="text-base font-extrabold text-gray-900">{isEditing ? 'Edit staff member' : 'Register new staff'}</h3>
                            <p className="text-xs text-gray-500">
                                {isEditing ? 'Update the details below' : onStepOne ? 'Section 1 of 2 · Safety Passport' : 'Section 2 of 2 · Staff details'}
                            </p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600" aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {!isEditing && (
                    <div className="flex gap-1.5 px-5 pt-3">
                        {[1, 2].map((n) => <span key={n} className={`h-1.5 flex-1 rounded-full ${step >= n ? 'bg-brand-500' : 'bg-gray-200'}`} />)}
                    </div>
                )}

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    {onStepOne && (
                        <>
                            <p className="text-sm text-gray-600">
                                The worker must read every topic below, then tick to confirm they understand and agree. Open a topic to read it &mdash; the tick unlocks after you do.
                            </p>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Agreed {ticked.length}/{passportTopics.length}</p>
                            <ul className="space-y-2">
                                {passportTopics.map((t, n) => {
                                    const open = openId === t.id;
                                    const done = ticked.includes(t.id);
                                    return (
                                        <li key={t.id} className={`overflow-hidden rounded-2xl border-2 ${done ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200'}`}>
                                            <button type="button" onClick={() => toggleOpen(t.id)} className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
                                                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${done ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                    {done ? <Check className="h-4 w-4" strokeWidth={3} /> : n + 1}
                                                </span>
                                                <span className="flex-1 text-sm font-bold text-gray-900">{t.title}</span>
                                                <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
                                            </button>
                                            {open && (
                                                <div className="border-t border-gray-100 bg-white px-3.5 py-3">
                                                    <TopicContent items={t.items} />
                                                </div>
                                            )}
                                            <label className={`flex items-center gap-3 border-t border-gray-100 px-3.5 py-2.5 text-sm font-semibold ${read.includes(t.id) ? 'text-gray-800' : 'text-gray-400'}`}>
                                                <input
                                                    type="checkbox"
                                                    className="h-5 w-5 shrink-0 rounded border-gray-300"
                                                    disabled={!read.includes(t.id)}
                                                    checked={done}
                                                    onChange={() => toggleTick(t.id)}
                                                />
                                                {read.includes(t.id) ? 'I have read, understood and agree' : 'Open the topic to read it first'}
                                            </label>
                                        </li>
                                    );
                                })}
                                {passportTopics.length === 0 && <li className="rounded-2xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-400">No Safety Passport topics set up.</li>}
                            </ul>
                            {errors.passport_topics && <p className="text-xs font-medium text-red-500">{errors.passport_topics}</p>}
                        </>
                    )}

                    {!onStepOne && (
                        <>
                            <Field label="Full name *" icon={User} error={errors.name}>
                                <input className={input} value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Ahmad bin Ali" required autoFocus />
                            </Field>
                            <Field label="Email *" icon={Mail} error={errors.email}>
                                <input type="email" className={input} value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="name@company.com" required />
                            </Field>
                            <Field label="Phone number" icon={Phone} error={errors.contact} hint="Needed for a complete record">
                                <input type="tel" inputMode="tel" className={input} value={data.contact || ''} onChange={(e) => setData('contact', e.target.value)} placeholder="012-345 6789" />
                            </Field>
                            <Field label="Role / position" icon={BriefcaseBusiness} error={errors.role} hint="Needed for a complete record">
                                <input className={input} value={data.role || ''} onChange={(e) => setData('role', e.target.value)} placeholder="e.g. Supervisor, Welder, Safety Officer" />
                            </Field>

                            {!isEditing && (
                                <div className="space-y-2.5 rounded-2xl border border-gray-200 bg-gray-50 p-3.5">
                                    <p className="text-xs font-extrabold text-gray-700">Certification <span className="font-medium text-gray-400">(optional)</span></p>
                                    <input className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm" placeholder="Certificate name (e.g. Welding)" value={data.cert_title || ''} onChange={(e) => setData('cert_title', e.target.value)} />
                                    {errors.cert_title && <p className="text-xs font-medium text-red-500">{errors.cert_title}</p>}
                                    <input type="date" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm" value={data.cert_expiry || ''} onChange={(e) => setData('cert_expiry', e.target.value)} aria-label="Expiry date" />
                                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="block w-full text-xs" onChange={(e) => setData('cert_file', e.target.files[0] || null)} />
                                    {errors.cert_file && <p className="text-xs font-medium text-red-500">{errors.cert_file}</p>}
                                    <p className="text-[11px] text-gray-400">Status stays Pending until the Supervisor and Manager approve.</p>
                                </div>
                            )}

                            {isEditing && isLeader && (
                                <div>
                                    <label className="mb-1.5 ml-1 block text-[11px] font-bold uppercase tracking-wider text-gray-500">Status</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['active', 'inactive'].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setData('status', s)}
                                                className={`rounded-2xl border-2 py-3 text-sm font-bold capitalize transition ${data.status === s ? 'border-ink-900 bg-ink-900 text-brand-400' : 'border-gray-200 text-gray-500'}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                    {errors.status && <p className="mt-1.5 ml-1 text-xs font-medium text-red-500">{errors.status}</p>}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex gap-3 border-t border-gray-100 p-4">
                    {!isEditing && step === 2 ? (
                        <button type="button" onClick={() => setStep(1)} className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-700">
                            <ArrowLeft className="h-4 w-4" /> Back
                        </button>
                    ) : (
                        <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-700">Cancel</button>
                    )}
                    <button
                        type="submit"
                        disabled={processing || (onStepOne && !allTicked)}
                        title={onStepOne && !allTicked ? 'Read and tick every topic first' : undefined}
                        className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3 text-sm font-extrabold text-ink-900 shadow-md active:scale-95 transition disabled:opacity-50"
                    >
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : onStepOne ? <ArrowRight className="h-4 w-4" /> : isEditing ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        {onStepOne ? 'Next: staff details' : isEditing ? 'Save changes' : 'Register staff'}
                    </button>
                </div>
            </form>
        </div>
    );
}
