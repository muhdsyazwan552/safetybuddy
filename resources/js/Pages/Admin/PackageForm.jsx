import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import SystemAdminLayout from '@/Layouts/SystemAdminLayout';

const input = 'mt-1 w-full rounded-xl border-slate-200 text-sm focus:border-brand-500 focus:ring-brand-500';
const Field = ({ label, children }) => <label className="block text-xs font-semibold uppercase tracking-wider text-ink-500">{label}{children}</label>;

export default function PackageForm({ title, package: item }) {
  const form = useForm({ code: item?.code || '', name: item?.name || '', description: item?.description || '', price: item?.price ?? '', is_active: item?.is_active || 'Y' });
  const submit = event => { event.preventDefault(); if (item) form.put(route('system.admin.packages.update', item.id)); else form.post(route('system.admin.packages.store')); };

  return <><Head title={title} /><SystemAdminLayout title={title} description={item ? `Update ${item.name} in the package catalogue.` : 'Add a package for company subscriptions.'} width="max-w-3xl">
    <Link href="/admin/packages" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-ink-900"><ArrowLeft size={17} /> Packages</Link>
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><div className="grid gap-5 sm:grid-cols-2"><Field label="Package code"><input className={`${input} ${item ? 'bg-slate-50 text-ink-500' : ''}`} value={form.data.code} onChange={e => form.setData('code', e.target.value.toUpperCase())} readOnly={Boolean(item)} required maxLength={50} />{item && <span className="mt-1 block text-xs font-normal normal-case tracking-normal text-ink-400">The code stays fixed after creation.</span>}</Field><Field label="Package name"><input className={input} value={form.data.name} onChange={e => form.setData('name', e.target.value)} required maxLength={255} /></Field></div><Field label="Description"><textarea rows="4" className={input} value={form.data.description} onChange={e => form.setData('description', e.target.value)} maxLength={1000} /></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Price (RM)"><input type="number" min="0" step="0.01" className={input} value={form.data.price} onChange={e => form.setData('price', e.target.value)} required /></Field><Field label="Availability"><select className={input} value={form.data.is_active} onChange={e => form.setData('is_active', e.target.value)}><option value="Y">Active</option><option value="N">Inactive</option></select></Field></div>{Object.entries(form.errors).map(([key, error]) => <p key={key} className="text-xs text-red-700">{error}</p>)}<div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Link href="/admin/packages" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-ink-600 hover:bg-slate-50">Cancel</Link><button disabled={form.processing} className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-50">{form.processing ? 'Saving…' : item ? 'Save package' : 'Create package'}</button></div></form>
  </SystemAdminLayout></>;
}
