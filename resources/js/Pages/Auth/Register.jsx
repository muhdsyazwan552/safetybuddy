import { useState } from 'react';
import axios from 'axios';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import NetBackground from '@/Components/shared/NetBackground';

const fields = [
  { name: 'name', label: 'Company name', type: 'text', autoComplete: 'organization', placeholder: 'Company name' },
  { name: 'phone', label: 'Contact number', type: 'tel', autoComplete: 'tel', placeholder: '+60 12 345 6789' },
  { name: 'email', label: 'Work email', type: 'email', autoComplete: 'email', placeholder: 'name@company.com' },
  { name: 'address', label: 'Company address', type: 'text', autoComplete: 'street-address', placeholder: 'Street, city and postcode' },
];

const errorText = (error) => Array.isArray(error) ? error[0] : error;

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', password: '', password_confirmation: '', terms: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const update = (name, value) => {
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setErrors({});
    setSubmitting(true);

    try {
      const response = await axios.post('/register', form);
      window.location.href = response.data.redirect || '/login';
    } catch (error) {
      setErrors(error.response?.status === 422 ? error.response.data.errors : { general: 'Registration could not be completed. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="min-h-screen bg-white text-ink-950 lg:grid lg:grid-cols-[40%_60%]">
    <Head title="Create account · Safety Buddy" />

    <aside className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
      <NetBackground />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,15,20,0.65)_0%,rgba(11,15,20,0)_60%)]" />
      <Link href="/" className="relative z-10 inline-flex items-center gap-3 self-start" aria-label="Safety Buddy home">
        <img src="/images/sbc-logo.png" alt="" className="h-11 w-11 rounded-full object-cover ring-2 ring-brand-400/60" />
        <span className="text-sm font-black tracking-[0.14em] text-brand-400">SAFETY BUDDY</span>
      </Link>
      <div className="relative z-10 max-w-md pb-12">
        <p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-brand-400">Welcome aboard</p>
        <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">A few steps away from a safer workplace.</h1>
        <p className="mt-6 max-w-sm text-base leading-7 text-gray-200">Create your company account and bring your safety work together in one place.</p>
      </div>
      <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.25em] text-brand-400/80">Control · Performance · Report</p>
    </aside>

    <main className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-12 lg:py-10 xl:px-20">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition hover:text-ink-950"><ArrowLeft className="h-4 w-4" /> Back to home</Link>
        <Link href="/" className="lg:hidden" aria-label="Safety Buddy home"><img src="/images/sbc-logo.png" alt="" className="h-10 w-10 rounded-full" /></Link>
      </div>

      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12 sm:py-16">
        <div className="mb-8">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-800">Safety Buddy</p>
          <h2 className="text-3xl font-bold tracking-tight text-ink-950">Register</h2>
          <h3 className="mt-7 text-sm font-bold text-ink-950">Manage all your safety work efficiently</h3>
          <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">Set up your company account to choose a package and get started after payment is confirmed.</p>
        </div>

        <form onSubmit={submit}>
          {errors.general && <p role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{errors.general}</p>}

          <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
            {fields.map(({ name, label, type, autoComplete, placeholder }) => <div key={name} className={name === 'address' ? 'sm:col-span-2' : undefined}>
              <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-ink-700">{label}</label>
              {name === 'address'
                ? <textarea id={name} name={name} autoComplete={autoComplete} placeholder={placeholder} required rows={3} value={form[name]} aria-invalid={Boolean(errors[name])} onChange={(event) => update(name, event.target.value)} className={`block min-h-28 w-full resize-y rounded-md border bg-white px-3 py-2.5 text-sm text-ink-950 placeholder:text-ink-300 focus:border-brand-500 focus:ring-brand-500 ${errors[name] ? 'border-rose-300' : 'border-ink-100'}`} />
                : <input id={name} name={name} type={type} autoComplete={autoComplete} placeholder={placeholder} required value={form[name]} aria-invalid={Boolean(errors[name])} onChange={(event) => update(name, event.target.value)} className={`block w-full rounded-md border bg-white px-3 py-2.5 text-sm text-ink-950 placeholder:text-ink-300 focus:border-brand-500 focus:ring-brand-500 ${errors[name] ? 'border-rose-300' : 'border-ink-100'}`} />}
              {errors[name] && <p role="alert" className="mt-1 text-xs text-rose-600">{errorText(errors[name])}</p>}
            </div>)}
            {['password', 'password_confirmation'].map((name) => <div key={name}>
              <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-ink-700">{name === 'password' ? 'Password' : 'Confirm password'}</label>
              <div className="relative">
                <input id={name} name={name} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder={name === 'password' ? 'At least 8 characters' : 'Repeat your password'} required minLength={name === 'password' ? 8 : undefined} value={form[name]} aria-invalid={Boolean(errors[name])} onChange={(event) => update(name, event.target.value)} className={`block w-full rounded-md border bg-white px-3 py-2.5 pr-10 text-sm text-ink-950 placeholder:text-ink-300 focus:border-brand-500 focus:ring-brand-500 ${errors[name] ? 'border-rose-300' : 'border-ink-100'}`} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide passwords' : 'Show passwords'} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 transition hover:text-ink-950">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
              {errors[name] && <p role="alert" className="mt-1 text-xs text-rose-600">{errorText(errors[name])}</p>}
            </div>)}
          </div>

          <div className="mt-6 flex items-start gap-2.5">
            <input id="terms" type="checkbox" required checked={form.terms} onChange={(event) => update('terms', event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-500 focus:ring-brand-500" />
            <div><label htmlFor="terms" className="text-xs leading-5 text-ink-500">I agree to the <Link href="/terms" className="font-semibold text-ink-950 underline decoration-brand-400 underline-offset-2">Terms of Service</Link> and <Link href="/privacy" className="font-semibold text-ink-950 underline decoration-brand-400 underline-offset-2">Privacy Policy</Link>.</label>
              {errors.terms && <p role="alert" className="mt-1 text-xs text-rose-600">{errorText(errors.terms)}</p>}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="sb-create mt-7 inline-flex items-center justify-center gap-2 rounded-md bg-brand-400 px-7 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{submitting ? 'Creating account…' : 'Create account'} {!submitting && <ArrowRight className="h-4 w-4" />}</button>
        </form>

        <p className="mt-5 text-sm text-ink-500">Already have an account? <Link href="/login" className="font-semibold text-ink-950 underline decoration-brand-400 underline-offset-2">Log in</Link></p>
      </div>
    </main>
  </div>;
}
