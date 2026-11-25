import BackLink from '@/Components/shared/BackLink';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import SystemAdminLayout from '@/Layouts/SystemAdminLayout';

const input = 'mt-1 w-full rounded-xl border-slate-200 text-sm focus:border-brand-500 focus:ring-brand-500';
const Field = ({ label, hint, children }) => <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">{label}{children}{hint && <span className="mt-1 block text-xs font-normal normal-case tracking-normal text-ink-400">{hint}</span>}</label>;

export default function UserCreate({ title, roles, companies }) {
  const form = useForm({ name: '', email: '', phone: '', role_id: '2', company_id: '', password: '', password_confirmation: '' });
  const set = (key) => (event) => form.setData(key, event.target.value);
  const submit = (event) => { event.preventDefault(); form.post(route('system.admin.users.store')); };

  return <><Head title={title} /><SystemAdminLayout title={title} description="Add a user account, choose the role and link it to a company." width="max-w-4xl">
    <BackLink href={route('system.admin.users.index')} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-ink-900"><ArrowLeft size={17} /> Back</BackLink>
    <form onSubmit={submit} className="space-y-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div>
        <h2 className="text-lg font-bold text-ink-900">Account details</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="Full name"><input className={input} value={form.data.name} onChange={set('name')} required /></Field>
          <Field label="Email"><input type="email" className={input} value={form.data.email} onChange={set('email')} required /></Field>
          <Field label="Phone"><input className={input} value={form.data.phone} onChange={set('phone')} /></Field>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-6">
        <h2 className="font-bold text-ink-900">Role and company</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Role"><select className={input} value={form.data.role_id} onChange={set('role_id')} required>{roles.map((role) => <option key={role.id} value={role.id}>{role.display_name || role.name}</option>)}</select></Field>
          <Field label="Company (optional)" hint="Required for Manager, Supervisor and Inspector. The company's package seat limit applies."><select className={input} value={form.data.company_id} onChange={set('company_id')}><option value="">No company</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field>
        </div>
      </div>
      <div className="border-t border-slate-100 pt-6">
        <h2 className="font-bold text-ink-900">Password</h2>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Password" hint="At least 10 characters."><input type="password" minLength="10" className={input} value={form.data.password} onChange={set('password')} required /></Field>
          <Field label="Confirm password"><input type="password" minLength="10" className={input} value={form.data.password_confirmation} onChange={set('password_confirmation')} required /></Field>
        </div>
      </div>
      {Object.entries(form.errors).map(([key, error]) => <p key={key} className="text-xs font-medium text-red-700">{error}</p>)}
      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
        <Link href={route('system.admin.users.index')} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-ink-600 hover:bg-slate-50">Cancel</Link>
        <button disabled={form.processing} className="rounded-xl bg-ink-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-ink-800 disabled:opacity-50">{form.processing ? 'Creating…' : 'Create user'}</button>
      </div>
    </form>
  </SystemAdminLayout></>;
}
