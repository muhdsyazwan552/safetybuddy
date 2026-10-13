// resources/js/Pages/SubconPublic/Components/AddStaffModal.jsx
import React, { useEffect } from 'react';
import { X, User, Mail, Phone, BriefcaseBusiness, Loader2, Save, UserPlus, AlertCircle } from 'lucide-react';

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

export default function AddStaffModal({ isOpen, onClose, onSubmit, data, setData, errors, processing, isEditing, isLeader = false }) {
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

    const submit = (e) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-black/60" onClick={onClose} />
            <form onSubmit={submit} className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-w-md sm:rounded-3xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-brand-400">
                            {isEditing ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                        </span>
                        <div>
                            <h3 className="text-base font-extrabold text-gray-900">{isEditing ? 'Edit staff member' : 'Register new staff'}</h3>
                            <p className="text-xs text-gray-500">{isEditing ? 'Update the details below' : 'Fill in all fields so the record is complete'}</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600" aria-label="Close">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto p-5">
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
                </div>

                <div className="flex gap-3 border-t border-gray-100 p-4">
                    <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-gray-200 py-3 text-sm font-bold text-gray-700">Cancel</button>
                    <button type="submit" disabled={processing} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3 text-sm font-extrabold text-ink-900 shadow-md active:scale-95 transition disabled:opacity-50">
                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : isEditing ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        {isEditing ? 'Save changes' : 'Register staff'}
                    </button>
                </div>
            </form>
        </div>
    );
}
