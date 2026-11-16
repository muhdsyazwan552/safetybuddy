import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
  ArrowRight, ArrowUpRight, CalendarDays, Check, CheckCircle2, Clock3,
  ClipboardList, CreditCard, FileText, GraduationCap, History, Laptop, MonitorPlay, Package, Pencil, Phone, ShieldCheck, Trash2, Upload, Users,
} from 'lucide-react';
import { confirmLogout } from '@/Helpers/logout';
import OrderReview from '@/Components/OrderReview';

const common = [
  'All Safety Buddy modules and features',
  'Contractor Portal access',
  'Unlimited projects and contractor companies',
  'Unlimited inspections, toolbox talks and NC / CC records',
];

const money = value => value === null || value === undefined ? '—' : `RM ${Number(value).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const date = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const TABS = [
  { id: 'normal', label: 'Buy a plan', text: 'Pick an annual package for your company and pay Safety Buddy for it.' },
  { id: 'under', label: 'I have an activation code', text: 'Your Training Provider gave you a code. Enter it to activate your package. No payment needed.' },
  { id: 'provider', label: 'Register as Training Provider', text: 'Apply to deliver safety training and buy packages for the companies you train.' },
];


/** A company redeems an activation code its Training Provider bought for it: the package activates, no payment. */
function ActivationCodeForm() {
  const form = useForm({ code: '' });
  const submit = event => { event.preventDefault(); form.post('/plans/activation-code', { preserveScroll: true }); };

  return <form onSubmit={submit} className="mb-8 max-w-xl rounded-2xl border border-ink-100 bg-white p-6 shadow-sm">
    <label htmlFor="activation-code" className="text-sm font-black text-ink-950">Activation code</label>
    <p className="mt-1 text-sm text-ink-500">Your Training Provider bought a package for you? Enter the activation code to activate it. No payment needed.</p>
    <div className="mt-4 flex gap-3">
      <input id="activation-code" value={form.data.code} onChange={event => form.setData('code', event.target.value.toUpperCase())} placeholder="e.g. SBT-PK-4K9Q-2MXH-7WRD" autoComplete="off" className="min-w-0 flex-1 rounded-xl border border-ink-200 px-4 py-3 text-sm font-semibold uppercase" aria-invalid={!!form.errors.code} />
      <button disabled={form.processing || !form.data.code.trim()} className="rounded-xl bg-brand-400 px-5 py-3 text-sm font-black text-ink-950 transition hover:bg-brand-300 disabled:opacity-50">{form.processing ? 'Activating…' : 'Activate'}</button>
    </div>
    {form.errors.code && <p className="mt-2 text-sm text-rose-600" role="alert">{form.errors.code}</p>}
  </form>;
}

const TERMS = [
  'Training Provider must be a registered company or organisation with valid certification for the training courses offered.',
  'Trainer(s) must hold valid and relevant certificates. The Company reserves the right to verify the authenticity of the certificates.',
  'All information and documents submitted must be accurate and up to date.',
  'The Company will review the registration and documents submitted. Approval will take 3 – 4 working days.',
  'The Company reserves the right to request additional information or documents if required.',
  'Approved Training Providers must comply with all Safety Buddy terms of use, data privacy requirements and any applicable laws.',
  'The Company may suspend or revoke the Training Provider account if false information is provided or if any terms and conditions are breached.',
];

const fieldClass = 'w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm';
const emptyCert = { issuing_body: '', expiry_date: '', file: null };

const dateTime = value => value ? new Date(value).toLocaleString('en-MY', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—';

/** Read-only view of a submitted Training Provider application: where it is, what was sent, what happens next. */
function TrainingStatus({ application, plan, active = false }) {
  const approved = application.status === 'approved';
  const steps = [
    { label: 'Application submitted', state: 'done' },
    { label: 'Verification by our team', state: approved ? 'done' : 'current' },
    { label: 'Approved', state: approved ? 'done' : 'todo' },
    { label: 'Payment', state: active ? 'done' : approved ? 'current' : 'todo' },
    { label: 'Dashboard access', state: active ? 'done' : 'todo' },
  ];
  const price = `RM ${Number(plan?.price_yearly ?? 0).toLocaleString('en-MY')}`;
  const banner = active
    ? { tone: 'border-emerald-200 bg-emerald-50', icon: <CheckCircle2 className="h-6 w-6" />, iconTone: 'bg-emerald-500 text-white', title: 'You are an approved Training Provider', body: <>Your verification is complete and your package is active. Buy packages for new companies and see them on the <Link href="/training-provider/trainees" className="font-bold underline">Trainees</Link> page.</> }
    : approved
      ? { tone: 'border-emerald-200 bg-emerald-50', icon: <CheckCircle2 className="h-6 w-6" />, iconTone: 'bg-emerald-500 text-white', title: 'Verified — payment is the last step', body: <>Your documents were verified{application.reviewed_at ? ` on ${dateTime(application.reviewed_at)}` : ''}. Contact Ramzi at <a href="tel:+60168865619" className="font-bold underline">016-8865619</a> to arrange payment of <strong>{price}</strong>. Your dashboard opens once payment is confirmed, and your reference code is then generated automatically for you to share with new companies.</> }
      : { tone: 'border-brand-300 bg-brand-50', icon: <Clock3 className="h-6 w-6" />, iconTone: 'bg-brand-400 text-ink-950', title: 'Your data is being verified', body: <>We received your application on <strong>{dateTime(application.created_at)}</strong>. Our team is now checking your registration number and certificates. This takes <strong>3 – 4 working days</strong>. You cannot open the dashboard until verification is approved and payment is confirmed. You do not need to submit again.</> };

  return <div className="mt-6 space-y-6">
    <div className={`flex items-start gap-4 rounded-2xl border p-6 ${banner.tone}`} role="status"><span className={`rounded-full p-3 ${banner.iconTone}`}>{banner.icon}</span><div><p className="font-black text-ink-950">{banner.title}</p><p className="mt-1 text-sm leading-6 text-ink-700">{banner.body}</p></div></div>

    <ol className="rounded-2xl border border-ink-100 bg-white p-5 sm:flex sm:p-6" aria-label="Application progress">{steps.map((step, index) => {
      const last = index === steps.length - 1;
      const circle = step.state === 'done' ? 'bg-emerald-500 text-white' : step.state === 'current' ? 'bg-brand-400 text-ink-950 ring-4 ring-brand-100' : 'border-2 border-ink-200 bg-white text-ink-400';
      return <li key={step.label} aria-current={step.state === 'current' ? 'step' : undefined} className="relative flex gap-4 pb-6 last:pb-0 sm:flex-1 sm:flex-col sm:items-center sm:gap-0 sm:pb-0 sm:text-center">
        {!last && <>
          <span aria-hidden="true" className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 sm:hidden ${step.state === 'done' ? 'bg-emerald-400' : 'bg-ink-100'}`} />
          <span aria-hidden="true" className={`absolute left-1/2 top-[15px] hidden h-0.5 w-full sm:block ${step.state === 'done' ? 'bg-emerald-400' : 'bg-ink-100'}`} />
        </>}
        <span className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${circle}`}>{step.state === 'done' ? <Check className="h-4 w-4" strokeWidth={3} /> : step.state === 'current' ? <Clock3 className="h-4 w-4" /> : index + 1}</span>
        <span className="sm:mt-3 sm:px-2"><span className={`block text-sm font-bold leading-snug ${step.state === 'todo' ? 'text-ink-400' : 'text-ink-950'}`}>{step.label}</span><span className={`mt-0.5 block text-xs font-semibold ${step.state === 'done' ? 'text-emerald-700' : step.state === 'current' ? 'text-brand-800' : 'text-ink-400'}`}>{step.state === 'done' ? 'Done' : step.state === 'current' ? 'In progress' : 'Waiting'}</span></span>
      </li>;
    })}</ol>

    <section className="rounded-2xl border border-ink-100 bg-white p-6" aria-labelledby="submitted-title">
      <h3 id="submitted-title" className="text-lg font-black text-ink-950">Data you submitted</h3>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
        <div><dt className="text-xs font-bold uppercase tracking-wider text-ink-400">Registration number</dt><dd className="mt-1 font-semibold">{application.registration_no}</dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-wider text-ink-400">Registration document</dt><dd className="mt-1 break-all font-semibold">{String(application.registration_document ?? '').split('/').pop() || '—'}</dd></div>
        <div><dt className="text-xs font-bold uppercase tracking-wider text-ink-400">Submitted</dt><dd className="mt-1 font-semibold">{dateTime(application.created_at)}</dd></div>
      </dl>
      <div className="mt-5 overflow-x-auto rounded-xl border border-ink-100"><table className="w-full min-w-[480px] text-left text-sm"><thead className="bg-ink-50 text-xs font-bold uppercase tracking-wider text-ink-500"><tr><th className="px-4 py-3">Issuing body</th><th className="px-4 py-3">Expiry date</th><th className="px-4 py-3">Document</th></tr></thead><tbody className="divide-y divide-ink-100">{(application.certificates ?? []).map(certificate => <tr key={certificate.id}><td className="px-4 py-3 font-semibold">{certificate.issuing_body}</td><td className="whitespace-nowrap px-4 py-3">{date(String(certificate.expiry_date).slice(0, 10))}</td><td className="px-4 py-3 text-brand-800">{certificate.file_name}</td></tr>)}</tbody></table></div>
      {!active && <p className="mt-4 text-xs text-ink-500">Need to correct something? Call Ramzi at <a href="tel:+60168865619" className="font-semibold underline">016-8865619</a>. {approved ? '' : 'You can submit a new application only if this one is rejected.'}</p>}
    </section>
  </div>;
}

/** Selling side of the Training Provider tab: what the package is, why take it, what is in it and how it works. */
function TrainingProviderPitch({ plan }) {
  const price = Number(plan?.price_yearly ?? 0).toLocaleString('en-MY');
  const why = [
    { icon: MonitorPlay, title: 'Use the actual system', text: 'Show and demonstrate real features and workflows.' },
    { icon: GraduationCap, title: 'Deliver practical training', text: 'Explain safety inspection and reporting with live examples.' },
    { icon: Users, title: 'Bring your trainees on board', text: 'Buy packages for the companies you train and share activation codes.' },
  ];
  const included = [
    'Access to Safety Buddy for training use',
    'All Safety Buddy modules and features',
    'Listed in Find My Training Provider once verified',
    'Buy packages for your trainees and share activation codes',
    'System access throughout the active subscription',
  ];
  const steps = [
    { icon: ClipboardList, title: 'Register company', text: 'Submit your registration number and training certificates.' },
    { icon: ShieldCheck, title: 'Verification', text: 'Our team checks your details in 3 – 4 working days.' },
    { icon: CreditCard, title: 'Subscribe', text: `Arrange payment of RM ${price} per year.` },
    { icon: Laptop, title: 'Access & train', text: 'Open your dashboard and start training.' },
  ];

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-ink-950 via-ink-900 to-ink-800 p-6 text-white shadow-xl sm:p-9">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-brand-400/20" /><div className="pointer-events-none absolute -right-2 -top-12 h-44 w-44 rounded-full border border-brand-400/20" />
      <span className="relative inline-flex items-center gap-2 rounded-full bg-brand-400 px-4 py-1.5 text-xs font-black uppercase tracking-wider text-ink-950"><GraduationCap className="h-4 w-4" /> Training Provider package</span>
      <h2 className="relative mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Safety Buddy <span className="text-brand-400">Training Access</span></h2>
      <p className="relative mt-3 max-w-lg text-sm leading-6 text-white/70">Subscribe to the actual Safety Buddy system for training, demonstration and practical learning, then bring the companies you train onto it.</p>
      <div className="relative mt-7 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-white/10 pt-6">
        <p className="text-4xl font-black tracking-tight text-brand-400 sm:text-5xl">RM {price}<span className="ml-1 text-base font-medium text-white/60">/ year</span></p>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-white/80">
          <li className="inline-flex items-center gap-2"><Laptop className="h-4 w-4 text-brand-400" /> Training access</li>
          <li className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand-400" /> 12-month subscription</li>
          <li className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-brand-400" /> Verified provider</li>
        </ul>
      </div>
    </section>

    <div className="grid gap-6 md:grid-cols-1">
      <section aria-labelledby="tp-why">
        <h3 id="tp-why" className="border-l-4 border-brand-400 pl-3 text-lg font-black text-ink-950">Why subscribe?</h3>
        <ul className="mt-4 space-y-3">{why.map(({ icon: Icon, title, text }) => <li key={title} className="flex items-start gap-3 rounded-2xl bg-gradient-to-br from-white to-gray-100 p-4 shadow-md shadow-gray-300/60 ring-1 ring-gray-200"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-900 text-brand-400 shadow-md shadow-gray-400"><Icon className="h-5 w-5" /></span><span><strong className="block text-sm text-ink-950">{title}</strong><span className="text-sm text-ink-500">{text}</span></span></li>)}</ul>
      </section>
      <section aria-labelledby="tp-included">
        <h3 id="tp-included" className="border-l-4 border-brand-400 pl-3 text-lg font-black text-ink-950">What’s included</h3>
        <ul className="mt-4 divide-y divide-ink-100 overflow-hidden rounded-2xl bg-gradient-to-br from-white to-gray-50 text-sm shadow-md shadow-gray-300/60 ring-1 ring-gray-200">{included.map(item => <li key={item} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-brand-50"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-900 text-brand-400 shadow-md shadow-gray-400"><Check className="h-4 w-4" strokeWidth={3} /></span><span className="font-medium text-ink-900">{item}</span></li>)}</ul>
      </section>
    </div>

    <section aria-labelledby="tp-how">
      <h3 id="tp-how" className="border-l-4 border-brand-400 pl-3 text-lg font-black text-ink-950">How it works</h3>
      <ol className="mt-4 space-y-5">{steps.map(({ icon: Icon, title, text }, index) => <li key={title} className="relative flex items-start gap-4 rounded-2xl bg-gradient-to-br from-white to-gray-100 p-4 shadow-md shadow-gray-300/60 ring-1 ring-gray-200">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-900 text-brand-400 shadow-md shadow-gray-400"><Icon className="h-5 w-5" /><span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-400 text-[11px] font-black text-ink-950 ring-2 ring-white">{index + 1}</span></span>
        <span className="min-w-0"><strong className="block text-sm text-ink-950">{title}</strong><span className="mt-0.5 block text-sm leading-5 text-ink-500">{text}</span></span>
        {index < steps.length - 1 && <span aria-hidden="true" className="absolute -bottom-5 left-[37px] flex h-5 w-1 flex-col items-center justify-between"><span className="h-full w-0.5 rounded-full bg-gradient-to-b from-brand-400 to-brand-400/40" /></span>}
      </li>)}</ol>
    </section>
  </div>;
}

function TrainingProviderApply({ application, plan, canPurchase, hasActiveSafety }) {
  const form = useForm({ registration_no: '', registration_document: null, terms: false });
  const [certificates, setCertificates] = useState([]);
  const [draft, setDraft] = useState(emptyCert);
  const [editing, setEditing] = useState(null);
  const [draftError, setDraftError] = useState('');
  const todayIso = new Date().toISOString().slice(0, 10);

  const status = application?.status;
  const certErrors = Object.entries(form.errors).filter(([key]) => key.startsWith('certificates')).map(([, message]) => message);

  const saveCertificate = () => {
    if (!draft.issuing_body.trim() || !draft.expiry_date || !draft.file) { setDraftError('Enter the issuing body, expiry date and choose the certificate file.'); return; }
    if (draft.expiry_date <= todayIso) { setDraftError('A certificate must not be expired.'); return; }
    setDraftError('');
    setCertificates(rows => editing === null ? [...rows, draft] : rows.map((row, index) => index === editing ? draft : row));
    setDraft(emptyCert);
    setEditing(null);
  };
  const editCertificate = index => { setDraft(certificates[index]); setEditing(index); setDraftError(''); };
  const removeCertificate = index => { setCertificates(rows => rows.filter((_, i) => i !== index)); if (editing === index) { setDraft(emptyCert); setEditing(null); } };

  const submit = event => {
    event.preventDefault();
    form.transform(data => ({ ...data, terms: data.terms ? 1 : '', certificates }));
    form.post('/plans/training-provider', { forceFormData: true, preserveScroll: true });
  };

  const intro = <p className="max-w-2xl text-sm leading-6 text-ink-500">Register as a Training Provider to deliver safety training in projects using Safety Buddy. Choose your package and complete your organisation details for verification.</p>;

  if (hasActiveSafety && status === 'approved') return <div>{intro}<TrainingStatus application={application} plan={plan} active /></div>;

  if (status === 'pending') return <div>{intro}<TrainingStatus application={application} plan={plan} /></div>;

  if (status === 'approved') return <div>{intro}<TrainingStatus application={application} plan={plan} /></div>;

  return <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-xl shadow-gray-300/50 sm:p-8">
    <h2 className="text-2xl font-black tracking-tight text-ink-950">Register as Training Provider</h2>
    {intro}
    {status === 'rejected' && <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"><strong>Your previous application was not approved.</strong>{application.rejection_reason && <> Reason: {application.rejection_reason}</>} You can correct the details and submit again.</div>}
    <div className="mt-6 flex items-start gap-4 rounded-2xl bg-amber-50 p-5"><span className="rounded-full bg-brand-400 p-3 text-ink-950"><Clock3 className="h-6 w-6" /></span><div><p className="font-black text-ink-950">Verification period: 3 – 4 working days</p><p className="mt-1 text-sm text-ink-700">Your registration and submitted documents will be reviewed by our team. You will be notified once your Training Provider account is approved.</p></div></div>
    <form onSubmit={submit} className="mt-8 space-y-8">
      <div>
        <label htmlFor="registration-no" className="text-sm font-bold text-ink-950">Registration number <span className="text-rose-600">*</span></label>
        <input id="registration-no" value={form.data.registration_no} onChange={event => form.setData('registration_no', event.target.value)} placeholder="e.g. 123456-A" className={`${fieldClass} mt-2`} />
        {form.errors.registration_no && <p className="mt-2 text-sm text-rose-600">{form.errors.registration_no}</p>}
        <label htmlFor="registration-document" className="mt-4 flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 border-dashed border-ink-200 bg-white p-6 text-center text-sm text-ink-500 hover:border-brand-400">
          <Upload className="h-6 w-6 text-ink-400" />
          <span><strong className="text-ink-900">Click to upload</strong> or drag and drop</span>
          <span className="text-xs">PNG, JPG or SVG (Max. 2 MB)</span>
          {form.data.registration_document && <span className="mt-1 font-semibold text-brand-800">{form.data.registration_document.name}</span>}
        </label>
        <input id="registration-document" type="file" accept=".png,.jpg,.jpeg,.svg" className="sr-only" onChange={event => form.setData('registration_document', event.target.files[0] ?? null)} />
        {form.errors.registration_document && <p className="mt-2 text-sm text-rose-600">{form.errors.registration_document}</p>}
      </div>

      <div>
        <h3 className="text-lg font-black text-ink-950">Training Certificate <span className="text-rose-600">*</span></h3>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-ink-50 text-xs font-bold uppercase tracking-wider text-ink-500"><tr><th className="px-4 py-3">Issuing body</th><th className="px-4 py-3">Expiry date</th><th className="px-4 py-3">Document</th><th className="px-4 py-3">Action</th></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {certificates.map((row, index) => <tr key={index}><td className="px-4 py-3 font-semibold">{row.issuing_body}</td><td className="whitespace-nowrap px-4 py-3">{date(row.expiry_date)}</td><td className="px-4 py-3 text-brand-800">{row.file.name}</td><td className="px-4 py-3"><div className="flex gap-3"><button type="button" onClick={() => editCertificate(index)} aria-label="Edit certificate" className="text-ink-500 hover:text-ink-950"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => removeCertificate(index)} aria-label="Remove certificate" className="text-rose-500 hover:text-rose-700"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}
              {!certificates.length && <tr><td colSpan="4" className="px-4 py-6 text-center text-ink-400">No certificates added yet.</td></tr>}
            </tbody></table>
        </div>
        <div className="mt-4 grid gap-3 rounded-2xl bg-ink-50 p-4 sm:grid-cols-2">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-500">Issuing body<input value={draft.issuing_body} onChange={event => setDraft({ ...draft, issuing_body: event.target.value })} className={`${fieldClass} mt-1 normal-case tracking-normal`} /></label>
          <label className="text-xs font-bold uppercase tracking-wider text-ink-500">Expiry date<input type="date" min={todayIso} value={draft.expiry_date} onChange={event => setDraft({ ...draft, expiry_date: event.target.value })} className={`${fieldClass} mt-1 normal-case tracking-normal`} /></label>
          <label className="text-xs font-bold uppercase tracking-wider text-ink-500 sm:col-span-2">Certificate file (PDF, PNG or JPG, max. 5 MB)<input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={event => setDraft({ ...draft, file: event.target.files[0] ?? null })} className={`${fieldClass} mt-1 normal-case tracking-normal`} /></label>
          <div className="flex items-center gap-3 sm:col-span-2"><button type="button" onClick={saveCertificate} className="rounded-xl bg-ink-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-ink-800">{editing === null ? 'Add certificate' : 'Update certificate'}</button>{editing !== null && <button type="button" onClick={() => { setDraft(emptyCert); setEditing(null); }} className="text-sm font-semibold text-ink-500">Cancel</button>}{draftError && <p className="text-sm text-rose-600" role="alert">{draftError}</p>}</div>
        </div>
        {certErrors.map(message => <p key={message} className="mt-2 text-sm text-rose-600">{message}</p>)}
      </div>

      <div className="rounded-2xl bg-sky-50 p-5"><div className="flex gap-4"><FileText className="mt-1 h-6 w-6 shrink-0 text-ink-400" /><ol className="list-decimal space-y-1 pl-5 text-xs leading-5 text-ink-600">{TERMS.map(term => <li key={term}>{term}</li>)}</ol></div></div>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.data.terms} onChange={event => form.setData('terms', event.target.checked)} className="h-5 w-5 rounded border-ink-300" /> I have read and agree to the above terms and conditions. <span className="text-rose-600">*</span></label>
          <button disabled={!canPurchase || !form.data.terms || form.processing} className="inline-flex items-center gap-2 rounded-xl bg-brand-400 px-6 py-3 font-black text-ink-950 transition hover:bg-brand-300 disabled:cursor-not-allowed disabled:opacity-50">{form.processing ? 'Submitting…' : 'Submit for verification'} <ArrowRight className="h-4 w-4" /></button>
        </div>
        {form.errors.terms && <p className="mt-2 text-sm text-rose-600">{form.errors.terms}</p>}
        {!canPurchase && <p className="mt-2 text-sm text-ink-500">Only your company admin can submit this application.</p>}
      </div>
    </form>
  </div>;
}

function PlanCard({ plan, pending, hasActiveSafety, canPurchase, referenceCode = null, hideAction = false, actionLabel = null, dense = false }) {
  const form = useForm({ plan_id: plan.id });
  form.transform(data => ({ ...data, reference_code: referenceCode || '' }));
  const [reviewing, setReviewing] = useState(false);
  const popular = plan.code === 'ENTERPRISE';
  const isRenewal = /renew/i.test(actionLabel || '');
  const seats = [
    { count: 1, label: 'Admin' },
    { count: plan.manager_limit, label: 'Manager' },
    { count: plan.supervisor_limit, label: 'Supervisor' },
    { count: plan.inspector_limit, label: 'Inspector' },
    { count: plan.contractor_limit ?? 1, label: 'Contractor Representative' },
  ];
  const features = [
    plan.daily_pdf_limit === null ? 'Unlimited Daily Report PDFs' : `${plan.daily_pdf_limit} Daily Report PDFs per month (shared)`,
    plan.monthly_pdf_limit === null ? 'Unlimited Monthly Report PDFs' : `${plan.monthly_pdf_limit} Monthly Report PDFs per month (shared)`,
    ...common,
  ];

  return <article className={`relative flex h-full flex-col rounded-[24px] p-6 transition sm:p-7 hover:-translate-y-1.5 ${popular ? 'bg-ink-900 text-white shadow-2xl ring-1 ring-brand-500/40' : 'bg-white shadow-sm ring-1 ring-gray-200'}`}>
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-2xl font-medium tracking-tight">{plan.name}</h3>
      {popular && <span className="shrink-0 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-ink-900">Most popular</span>}
    </div>
    <p className={`mt-1 text-sm ${popular ? 'text-gray-400' : 'text-gray-500'}`}>Annual package</p>
    <p className="mt-6 text-4xl font-medium tracking-[-0.06em] sm:text-5xl">{Number(plan.price_yearly) === 0 ? 'Free' : <>RM {Number(plan.price_yearly).toLocaleString('en-MY')}</>}{Number(plan.price_yearly) > 0 && <span className={`ml-1 text-base font-normal tracking-normal ${popular ? 'text-gray-400' : 'text-gray-500'}`}>/ year</span>}</p>
    {!hideAction && <form onSubmit={event => { event.preventDefault(); setReviewing(true); }} className="mt-6">
      {reviewing && <OrderReview
        title={isRenewal ? 'Review your renewal' : 'Review your subscription request'}
        details={[
          { label: 'Order type', value: isRenewal ? 'Renewal of Safety Buddy package' : 'New Safety Buddy package' },
          { label: 'Package', value: plan.name },
          { label: 'Billing', value: 'Annual package, 1 year' },
          { label: 'User accounts included', value: seats.map(seat => `${seat.count} ${seat.count === 1 ? seat.label : `${seat.label}s`}`).join(' · ') },
          ...(referenceCode ? [{ label: 'Reference code', value: referenceCode }] : []),
        ]}
        lines={[{ name: plan.name, note: 'Annual package', qty: 1, unit: Number(plan.price_yearly) }]}
        notes={['Your request is sent to us for approval.', 'Contact Ramzi at 016-8865619 to arrange payment.', 'Your package starts once payment is confirmed.']}
        confirmLabel="Confirm request" processing={form.processing} error={form.errors.plan_id || form.errors.reference_code}
        onConfirm={() => form.post('/plans/request', { onSuccess: () => setReviewing(false) })} onBack={() => setReviewing(false)} />}
      <button disabled={!canPurchase || pending || hasActiveSafety} className={`group flex w-full items-center justify-between rounded-full py-2 pl-5 pr-2 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 ${popular ? 'bg-brand-500 text-ink-900 hover:bg-brand-400' : 'bg-gray-100 text-ink-900 hover:bg-gray-200'}`}>
        <span>{!canPurchase ? 'Contact your company admin' : hasActiveSafety ? 'Current subscription active' : pending ? 'Request pending' : actionLabel || 'Review request'}</span><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-900 text-brand-400 transition group-hover:rotate-45"><ArrowUpRight className="h-4 w-4" /></span>
      </button>
      {form.errors.plan_id && <p className="mt-2 text-sm text-rose-500">{form.errors.plan_id}</p>}
      {form.errors.reference_code && <p className="mt-2 text-sm text-rose-500">{form.errors.reference_code}</p>}
    </form>}
    <p className={`mt-8 text-[11px] font-bold uppercase tracking-widest ${popular ? 'text-brand-400' : 'text-brand-700'}`}>Included user accounts</p>
    <div className={`mt-3 grid gap-2 ${dense ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2' : 'grid-cols-1 min-[380px]:grid-cols-2'}`}>{seats.map((seat, index) => <div key={seat.label} className={`flex min-w-0 items-center gap-3 rounded-2xl px-3.5 py-3 ${seats.length % 2 === 1 && index === seats.length - 1 ? (dense ? 'sm:col-span-2 lg:col-span-1 xl:col-span-2' : 'min-[380px]:col-span-2') : ''} ${popular ? 'bg-gradient-to-br from-white/15 to-white/5 ring-1 ring-white/15 shadow-lg shadow-black/30' : 'bg-gradient-to-br from-white to-gray-100 ring-1 ring-gray-200 shadow-md shadow-gray-300/60'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base font-bold shadow-md ${popular ? 'bg-brand-500 text-ink-900 shadow-black/40' : 'bg-ink-900 text-brand-400 shadow-gray-400'}`}>{seat.count}</span><span className="text-sm font-medium leading-tight">{seat.count === 1 ? seat.label : `${seat.label}s`}</span></div>)}</div>
    <p className={`mt-8 text-[11px] font-bold uppercase tracking-widest ${popular ? 'text-brand-400' : 'text-brand-700'}`}>What’s included</p>
    <ul className="mt-3 flex-1 space-y-3 text-sm">{features.map(feature => <li key={feature} className="flex items-start gap-2.5"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${popular ? 'text-brand-400' : 'text-brand-700'}`} strokeWidth={3} /><span>{feature}</span></li>)}</ul>
  </article>;
}

function CurrentPackage({ currentPackage, dashboard, hideAmount = false }) {
  if (!currentPackage) return <section className="rounded-[28px] border border-dashed border-ink-200 bg-white p-7 sm:p-9">
    <div className="flex items-start gap-4"><span className="rounded-2xl bg-brand-100 p-3 text-ink-950"><Package className="h-6 w-6" /></span><div><h2 className="text-xl font-black text-ink-950">No Safety Buddy package yet</h2><p className="mt-2 text-sm text-ink-500">Choose a package below to start your Safety Buddy subscription.</p></div></div>
  </section>;

  const active = currentPackage.status === 'active';
  return <section className="relative overflow-hidden rounded-[28px] bg-ink-950 p-7 text-white sm:p-9">
    <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full border border-brand-400/20" /><div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border border-brand-400/20" />
    <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
      <div>
        <p className="text-xs font-black uppercase tracking-[.22em] text-brand-300">{active ? 'Current package' : 'Previous package'}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3"><h2 className="text-3xl font-black sm:text-4xl">{currentPackage.package_name}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? 'bg-emerald-400/15 text-emerald-300' : 'bg-orange-400/15 text-orange-200'}`}>{active ? 'Active' : 'Expired'}</span></div>
        <p className="mt-3 text-sm text-white/55">{currentPackage.module_name || 'Safety Buddy'} · {currentPackage.type === 'renew' ? 'Renewal' : 'Annual subscription'}</p>
        <div className={`mt-7 grid gap-5 ${hideAmount ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
          <div><p className="text-xs uppercase tracking-wider text-white/45">Started</p><p className="mt-1 font-bold">{date(currentPackage.start_date)}</p></div>
          <div><p className="text-xs uppercase tracking-wider text-white/45">Expiry date</p><p className="mt-1 font-bold text-brand-300">{date(currentPackage.end_date)}</p></div>
          {!hideAmount && <div><p className="text-xs uppercase tracking-wider text-white/45">Package amount</p><p className="mt-1 font-bold">{money(currentPackage.amount)}</p></div>}
        </div>
      </div>
      <div className="flex flex-col items-start gap-3 lg:items-end">
        {active && currentPackage.days_remaining !== null && <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/65"><CalendarDays className="h-4 w-4 text-brand-300" />{currentPackage.days_remaining <= 1 ? 'Expires today' : `${currentPackage.days_remaining} days remaining`}</span>}
        <Link href={active ? dashboard : '#available-plans'} className="inline-flex items-center gap-2 rounded-full bg-brand-400 px-5 py-3 text-sm font-black text-ink-950 transition hover:bg-brand-300">{active ? 'Go to dashboard' : 'Renew package'} <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  </section>;
}

function InspectorAddon({ seats, canPurchase }) {
  const form = useForm({ quantity: 1 });
  const qty = Math.max(0, Number(form.data.quantity) || 0);
  const total = qty * seats.price;
  const limit = seats.included + seats.extra;
  const [reviewing, setReviewing] = useState(false);

  return <section className="mt-10 rounded-[28px] border border-brand-300 bg-white p-7 shadow-sm sm:p-9" aria-labelledby="addon-title">
    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-xl">
        <p className="text-xs font-black uppercase tracking-[.2em] text-brand-800">Optional add-on · any package</p>
        <h2 id="addon-title" className="mt-2 text-2xl font-black">Extra Inspectors</h2>
        <p className="mt-2 text-sm text-ink-500">Your package includes {seats.included} Inspector{seats.included === 1 ? '' : 's'}. Need more? Add Inspector seats for <strong className="text-ink-900">RM {seats.price} per user</strong>, paid once. The seats are available straight away and stay with your company when you renew.</p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl bg-ink-50 p-3"><p className="text-2xl font-black">{seats.included}</p><p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Included</p></div>
          <div className="rounded-2xl bg-ink-50 p-3"><p className="text-2xl font-black">{seats.extra}</p><p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Extra bought</p></div>
          <div className="rounded-2xl bg-ink-50 p-3"><p className="text-2xl font-black">{seats.used}<span className="text-base text-ink-400"> / {limit}</span></p><p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">In use</p></div>
        </div>
      </div>
      {canPurchase ? <form onSubmit={event => { event.preventDefault(); if (qty >= 1) setReviewing(true); }} className="w-full shrink-0 rounded-2xl bg-ink-950 p-6 text-white lg:w-80">
        {reviewing && <OrderReview
          title="Review your extra Inspectors"
          details={[
            { label: 'Order type', value: 'Extra Inspector slots (add-on)' },
            { label: 'Inspectors to add', value: qty },
            { label: 'Inspector slots now', value: `${limit} (${seats.included} included + ${seats.extra} extra) · ${seats.used} in use` },
            { label: 'Inspector slots after', value: limit + qty },
            { label: 'Payment', value: 'Paid once, not yearly' },
          ]}
          lines={[{ name: 'Extra Inspector slot', note: 'One-time add-on', qty, unit: seats.price }]}
          notes={['The slots are added to your company as soon as you confirm.', 'They stay with your company when the package renews.']}
          confirmLabel={`Confirm ${qty === 1 ? 'Inspector' : 'Inspectors'}`} processing={form.processing} error={form.errors.quantity}
          onConfirm={() => form.post('/plans/inspector-addon', { preserveScroll: true, onSuccess: () => { form.reset(); setReviewing(false); } })} onBack={() => setReviewing(false)} />}
        <label htmlFor="addon-qty" className="text-xs font-bold uppercase tracking-wider text-white/60">Extra Inspectors</label>
        <input id="addon-qty" type="number" min="1" max="50" value={form.data.quantity} onChange={event => form.setData('quantity', event.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-lg font-bold text-white" />
        <p className="mt-4 flex items-baseline justify-between"><span className="text-sm text-white/60">{qty} × RM {seats.price}</span><span className="text-2xl font-black text-brand-300">RM {total.toLocaleString('en-MY')}</span></p>
        <button disabled={qty < 1} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-400 px-5 py-3 font-black text-ink-950 transition hover:bg-brand-300 disabled:opacity-50">Review Inspectors <ArrowRight className="h-4 w-4" /></button>
        {form.errors.quantity && <p className="mt-2 text-sm text-rose-300">{form.errors.quantity}</p>}
      </form> : <p className="rounded-2xl bg-ink-50 p-5 text-sm text-ink-500 lg:w-80">Only your company admin can buy extra Inspectors.</p>}
    </div>
    {seats.purchases.length > 0 && <div className="mt-6 border-t border-ink-100 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-ink-400">Add-on purchases</p><ul className="mt-2 divide-y divide-ink-100 text-sm">{seats.purchases.map(p => <li key={p.id} className="flex justify-between py-2"><span>{date(p.date)} · {p.quantity} Inspector{p.quantity > 1 ? 's' : ''}</span><strong>{money(p.total_amount)}</strong></li>)}</ul></div>}
  </section>;
}

function SubscriptionHistory({ history, hideAmount = false }) {
  if (!history.length) return null;
  return <section className="mt-10" aria-labelledby="history-title">
    <div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-brand-100 p-2.5 text-ink-950"><History className="h-5 w-5" /></span><div><h2 id="history-title" className="text-xl font-black text-ink-950">Subscription history</h2><p className="text-sm text-ink-500">All subscription periods recorded for your company.</p></div></div>
    <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white shadow-sm"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-ink-50 text-xs font-bold uppercase tracking-wider text-ink-400"><tr><th className="px-5 py-4">Package / module</th><th className="px-5 py-4">Started</th><th className="px-5 py-4">Expires</th>{!hideAmount && <th className="px-5 py-4">Amount</th>}<th className="px-5 py-4">Status</th></tr></thead><tbody className="divide-y divide-ink-100">{history.map(item => <tr key={item.id}><td className="px-5 py-4"><strong className="block text-ink-900">{item.package_name}</strong><span className="text-xs text-ink-400">{item.type === 'renew' ? 'Renewal' : 'New subscription'}{item.module_name && item.module_name !== item.package_name ? ` · ${item.module_name}` : ''}</span></td><td className="whitespace-nowrap px-5 py-4 text-ink-600">{date(item.start_date)}</td><td className="whitespace-nowrap px-5 py-4 font-semibold text-ink-900">{date(item.end_date)}</td>{!hideAmount && <td className="whitespace-nowrap px-5 py-4 text-ink-600">{money(item.amount)}{!item.payment_recorded && <span className="block text-xs text-ink-400">Payment record unavailable</span>}</td>}<td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${item.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'}`}>{item.status === 'active' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}{item.status === 'active' ? 'Active' : 'Expired'}</span></td></tr>)}</tbody></table></div>
  </section>;
}

export default function Plans({ plans = [], hasPurchased = false, hasActiveSafety = false, canPurchase = true, currentPackage = null, subscriptionHistory = [], latestRequest = null, inspectorSeats = null, trainingApplication = null, linkedProvider = null }) {
  const { flash = {}, auth } = usePage().props;
  const pending = latestRequest?.status === 'pending';
  const expired = hasPurchased && !hasActiveSafety;
  const [showExpiryModal, setShowExpiryModal] = useState(expired);
  // a company registered under a Training Provider uses the Contractor Training Provider package only
  const underProvider = Boolean(linkedProvider);
  // one path at a time: a new company picks how it wants to start, and only that section is shown
  const [tab, setTab] = useState(underProvider ? 'under' : trainingApplication ? 'provider' : hasPurchased ? 'normal' : null);
  const contractorPlans = plans.filter(plan => plan.audience === 'contractor_provider');
  const normalPlans = underProvider ? contractorPlans : plans.filter(plan => (plan.audience ?? 'normal') === 'normal');
  const providerPlans = plans.filter(plan => plan.audience === 'training_provider');
  const tabPlans = tab === 'provider' ? providerPlans : tab === 'under' ? contractorPlans : normalPlans;
  const firstName = (auth?.user?.name ?? '').trim().split(/\s+/)[0];
  const dashboard = [3, 4].includes(auth?.user?.role_id) ? '/review/dashboard' : [7, 8].includes(auth?.user?.role_id) ? '/inspector/dashboard' : '/dashboard';

  return <><Head title={hasPurchased ? 'Manage packages · Safety Buddy' : 'Safety Buddy packages'} /><main className="min-h-screen bg-[#F8F8F5] text-ink-950">
    <header className="border-b border-white/10 bg-ink-950"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8"><Link href="/" className="inline-flex min-w-0 items-center gap-3 text-white"><img src="/images/sbc-logo.png" alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-brand-400/50" /><span className="text-sm font-black tracking-[.12em] sm:text-base">SAFETY BUDDY</span></Link><nav aria-label="Account" className="flex shrink-0 items-center gap-3 text-sm font-semibold sm:gap-5">{hasActiveSafety && <Link href={dashboard} className="text-brand-300 transition hover:text-brand-100">Dashboard</Link>}<button type="button" onClick={() => confirmLogout()} className="text-white/70 transition hover:text-white">Log out</button></nav></div></header>
    <section className="relative overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-ink-800 text-white">
      <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border border-brand-400/20" /><div className="pointer-events-none absolute -right-2 -top-12 h-44 w-44 rounded-full border border-brand-400/20" /><div className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-brand-400/5 blur-2xl" />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">

          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{hasPurchased ? 'Welcome back' : 'Welcome to Safety Buddy'}{firstName && <>, <span className="text-brand-400">{firstName}</span></>}!</h1>
          <p className="mt-2 text-sm leading-6 text-white/70">{hasPurchased
            ? 'Your company’s package has ended. This page is where you renew it: choose a package below and we will guide you through the payment.'
            : 'Your company does not have a package yet, and you need one to start using Safety Buddy. This page is where you get started: choose how you would like to begin, then review your order and activate your package.'}</p>
        </div>
      </div>
      <div className="h-1 bg-brand-400" />
    </section>
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      {flash.success && <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{flash.success}</div>}
      {pending && <div className="mt-7 flex items-start gap-3 rounded-xl border border-brand-300 bg-brand-50 p-4 text-sm text-ink-800"><Clock3 className="mt-0.5 h-5 w-5 shrink-0" /><div><strong>{latestRequest.plan?.name} request pending.</strong> Contact Ramzi at <a href="tel:+60168865619" className="font-bold underline">016-8865619</a> to arrange payment. Access begins after payment is verified.</div></div>}
      {latestRequest?.status === 'rejected' && <div className="mt-7 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">Your previous request was not approved. You can choose a package again.</div>}

      {hasPurchased && <div className="mt-9"><CurrentPackage currentPackage={currentPackage} dashboard={dashboard} hideAmount={Boolean(linkedProvider)} />{canPurchase && <Link href={route('manage.package.payments')} className="mt-4 inline-flex text-sm font-bold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4">View payment history</Link>}{inspectorSeats && <InspectorAddon seats={inspectorSeats} canPurchase={canPurchase} />}<SubscriptionHistory history={subscriptionHistory} hideAmount={Boolean(linkedProvider)} /></div>}

      <section id="available-plans" className={hasPurchased ? 'mt-14 scroll-mt-8' : 'scroll-mt-8'}><div className="mb-7"><p className="text-xs font-black uppercase tracking-[.2em] text-brand-800">Find your fit</p><h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{tab === null ? 'How do you want to start?' : hasPurchased ? 'Available packages' : 'Choose a package'}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-ink-500">{tab === null ? 'Choose one option below. You only see the steps for the option you pick.' : 'Compare what’s included, then request the package that fits your team.'}</p>{hasActiveSafety && <p className="mt-2 text-sm text-ink-500">Your current package is active. Contact Ramzi if you would like to change it before expiry.</p>}</div>
        {tab === null
          ? <div className="grid gap-4 lg:grid-cols-3">
            {TABS.map(item => <button key={item.id} type="button" onClick={() => setTab(item.id)} className="group flex flex-col rounded-2xl border border-ink-100 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-brand-400 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">
              <span className="text-lg font-black text-ink-950">{item.label}</span>
              <span className="mt-2 flex-1 text-sm leading-6 text-ink-500">{item.text}</span>
              <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-ink-950">Continue <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </button>)}
          </div>
          : <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-100 bg-white px-5 py-3 shadow-sm">
            <p className="text-sm text-ink-500">You chose: <strong className="text-ink-950">{TABS.find(item => item.id === tab)?.label}</strong></p>
            {!(underProvider || trainingApplication) && <button type="button" onClick={() => setTab(null)} className="text-sm font-bold text-ink-950 underline decoration-brand-500 decoration-2 underline-offset-4">Change option</button>}
          </div>}
        {tab !== null && <div role="tabpanel" id="plans-panel">
          {tab === 'under' && !hasActiveSafety && <ActivationCodeForm />}
          {tab === 'under' && (linkedProvider
            ? <div className="mb-8 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><p>Your company is registered under <strong>{linkedProvider.name}</strong>{linkedProvider.linked_at ? <> since {date(linkedProvider.linked_at)}</> : null}. Choose a package below.</p></div>
            : null)}
          {tab === 'provider' ? (trainingApplication && trainingApplication.status !== 'rejected'
            ? <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <TrainingProviderApply application={trainingApplication} plan={providerPlans[0]} canPurchase={canPurchase} hasActiveSafety={hasActiveSafety} />
              {providerPlans[0] && <PlanCard plan={providerPlans[0]} pending={pending} hasActiveSafety={hasActiveSafety} canPurchase={canPurchase} hideAction />}
            </div>
            : <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
              <div className="min-w-0"><TrainingProviderPitch plan={providerPlans[0]} /></div>
              <div className="min-w-0"><TrainingProviderApply application={trainingApplication} plan={providerPlans[0]} canPurchase={canPurchase} hasActiveSafety={hasActiveSafety} /></div>
            </div>)
            : tab === 'under' && !linkedProvider ? null : tabPlans.length
              ? <div className={`mx-auto grid gap-5 ${tabPlans.length === 1 ? 'max-w-md' : 'max-w-6xl md:grid-cols-2 lg:grid-cols-3'}`}>{tabPlans.map((plan, index) => <div key={plan.id} className={tabPlans.length % 2 === 1 && index === tabPlans.length - 1 ? 'md:col-span-2 md:mx-auto md:w-[calc(50%-0.625rem)] lg:col-span-1 lg:w-full' : ''}><PlanCard plan={plan} pending={pending} hasActiveSafety={hasActiveSafety} canPurchase={canPurchase} dense={tabPlans.length > 1} /></div>)}</div>
              : <p className="rounded-2xl border border-dashed border-ink-200 bg-white p-6 text-sm text-ink-500">No packages available here yet.</p>}
        </div>}
      </section>
      <div className="mt-9 rounded-2xl border border-ink-100 bg-white p-6 text-sm text-ink-500"><p><strong className="text-ink-900">Additional User Options</strong> (applicable to all packages): Additional Inspector RM1,000 / year per inspector · Subcontractor (Contractor Representative) RM1,500 / year per representative.</p></div>
      <p className="mt-7 flex items-center justify-center gap-2 text-sm text-ink-400"><Phone className="h-4 w-4" /> Questions? Ramzi <a href="tel:+60168865619" className="font-semibold text-brand-800">016-8865619</a></p>
    </div>
  </main>
    {showExpiryModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/75 p-5" role="presentation">
      <div role="alertdialog" aria-modal="true" aria-labelledby="expiry-title" aria-describedby="expiry-description" className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 text-ink-950 shadow-2xl sm:p-9">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-700"><CalendarDays className="h-6 w-6" /></span>
        <h2 id="expiry-title" className="mt-5 text-2xl font-black">Subscription expired</h2>
        <p id="expiry-description" className="mt-3 text-sm leading-6 text-ink-500">Payment must be confirmed before you can use Safety Buddy again. {canPurchase ? 'Choose a package below and contact Ramzi to arrange payment.' : 'Contact your company admin to renew the package and arrange payment.'}</p>
        {pending && <p className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-ink-800">Your renewal request is pending. Contact Ramzi at <a href="tel:+60168865619" className="font-bold underline">016-8865619</a> to arrange payment.</p>}
        <div className="mt-7 flex flex-wrap gap-3">{canPurchase && !pending && <button type="button" onClick={() => { setShowExpiryModal(false); document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-full bg-brand-400 px-5 py-3 text-sm font-black text-ink-950">Choose a package</button>}<a href="tel:+60168865619" className="rounded-full border border-ink-200 px-5 py-3 text-sm font-bold">Call Ramzi</a><button type="button" onClick={() => setShowExpiryModal(false)} className="rounded-full border border-ink-200 px-5 py-3 text-sm font-bold">View package details</button></div>
      </div>
    </div>}
  </>;
}
