import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, MailCheck } from 'lucide-react';
import NetBackground from '@/Components/shared/NetBackground';

export default function VerifyEmail({ email = '', status = null, deliveryFailed = false }) {
  const form = useForm({ email });

  const resend = (event) => {
    event.preventDefault();
    form.post('/email/verification-notification');
  };

  return <div className="min-h-screen bg-white text-ink-950 lg:grid lg:grid-cols-[40%_60%]">
    <Head title="Verify email · Safety Buddy" />
    <aside className="relative hidden min-h-screen overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
      <NetBackground />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(11,15,20,0.65)_0%,rgba(11,15,20,0)_60%)]" />
      <Link href="/" className="relative z-10 inline-flex items-center gap-3 self-start" aria-label="Safety Buddy home"><img src="/images/sbc-logo.png" alt="" className="h-11 w-11 rounded-full ring-2 ring-brand-400/60" /><span className="text-sm font-black tracking-[0.14em] text-brand-400">SAFETY BUDDY</span></Link>
      <div className="relative z-10 max-w-md pb-12"><p className="mb-5 text-xs font-bold uppercase tracking-[0.25em] text-brand-400">One quick check</p><h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">Confirm your email to get started.</h1><p className="mt-6 text-base leading-7 text-gray-200">Once your email is verified, sign in and choose your Safety Buddy package.</p></div>
      <p className="relative z-10 text-xs font-semibold uppercase tracking-[0.25em] text-brand-400/80">Control · Performance · Report</p>
    </aside>

    <main className="flex min-h-screen flex-col px-6 py-6 sm:px-10 lg:px-12 lg:py-10 xl:px-20">
      <Link href="/login" className="inline-flex items-center gap-2 self-start text-sm font-medium text-ink-500 hover:text-ink-950"><ArrowLeft className="h-4 w-4" /> Back to login</Link>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center py-12">
        <span className="mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-brand-900"><MailCheck className="h-8 w-8" /></span>
        <h2 className="text-3xl font-bold tracking-tight">Check your inbox</h2>
        <p className="mt-4 text-sm leading-6 text-ink-500">We sent a verification link to your email address. Open it to activate your account. The link expires after 60 minutes.</p>
        {status && <p role="status" className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{status}</p>}
        {deliveryFailed && !status && <p role="alert" className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">We could not send the email yet. Check your address and try sending a new link.</p>}

        <form onSubmit={resend} className="mt-8">
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-ink-700">Email address</label>
          <input id="email" type="email" autoComplete="email" required value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} className="block w-full rounded-md border-ink-100 px-3 py-2.5 text-sm focus:border-brand-500 focus:ring-brand-500" />
          {form.errors.email && <p role="alert" className="mt-1 text-xs text-rose-600">{form.errors.email}</p>}
          <button type="submit" disabled={form.processing} className="sb-create mt-4 rounded-md bg-brand-400 px-6 py-2.5 text-sm font-bold text-ink-950 hover:bg-brand-300 disabled:opacity-60">{form.processing ? 'Sending…' : 'Resend verification link'}</button>
        </form>
        <p className="mt-6 text-sm text-ink-500">Already verified? <Link href="/login" className="font-semibold text-ink-950 underline decoration-brand-400 underline-offset-2">Log in</Link></p>
      </div>
    </main>
  </div>;
}
