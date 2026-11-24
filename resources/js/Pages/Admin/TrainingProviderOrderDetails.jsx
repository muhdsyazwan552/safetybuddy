import BackLink from '@/Components/shared/BackLink';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Building2, CreditCard, KeyRound } from 'lucide-react';
import SystemAdminLayout, { AdminStatCard } from '@/Layouts/SystemAdminLayout';
import { Detail, StatusBadge } from './companyUi';
import { AdminTablePagination, useAdminTablePagination } from './adminTablePagination';

const money = value => `RM ${Number(value || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

export default function TrainingProviderOrderDetails({ title, order }) {
  const { flash = {}, errors = {} } = usePage().props;
  const pagination = useAdminTablePagination(order.codes || []);
  const confirm = () => {
    if (window.confirm(`Confirm payment of ${money(order.total)} from ${order.provider} for ${order.quantity} × ${order.package}? This releases all activation codes to the Training Provider.`)) {
      router.post(route('system.admin.package-orders.approve', order.batch_ref), {}, { preserveScroll: true });
    }
  };
  const reject = () => {
    if (window.confirm(`Reject activation code order ${order.batch_ref} from ${order.provider}?`)) {
      router.post(route('system.admin.package-orders.reject', order.batch_ref), {}, { preserveScroll: true });
    }
  };

  return <><Head title={title} /><SystemAdminLayout title={title} description="Review a Training Provider package purchase and the linked companies that activated its codes.">
    <BackLink href={route('system.admin.training-providers.orders')} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-ink-900"><ArrowLeft size={17} /> Back</BackLink>
    {flash.success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{flash.success}</div>}
    {Object.entries(errors).map(([key, value]) => <p key={key} className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{value}</p>)}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Activation code order</p><h2 className="mt-1 text-xl font-bold text-ink-900">{order.batch_ref}</h2><p className="mt-1 text-sm text-ink-500">Placed {order.created_at || 'date unknown'}</p></div><StatusBadge status={order.status} /></div><dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4"><Detail label="Training Provider"><Link href={`/admin/training-providers/${order.provider_id}/companies`} className="inline-flex items-center gap-1 hover:underline"><Building2 size={14} /> {order.provider || `Company #${order.provider_id}`}</Link></Detail><Detail label="Provider code">{order.provider_code}</Detail><Detail label="Reference code">{order.provider_reference_code}</Detail><Detail label="Provider contact">{order.provider_email}{order.provider_contact ? ` · ${order.provider_contact}` : ''}</Detail><Detail label="Package">{order.package}</Detail><Detail label="Package code">{order.package_code}</Detail><Detail label="Quantity">{order.quantity} activation codes</Detail><Detail label="Unit price">{money(order.unit_price)}</Detail><Detail label="Order total">{money(order.total)}</Detail><Detail label="Payment confirmed">{order.paid_at}</Detail></dl></section>
    <div className="grid gap-4 sm:grid-cols-3"><AdminStatCard label="Purchased codes" value={order.quantity} /><AdminStatCard label="Available codes" value={order.available} /><AdminStatCard label="Redeemed codes" value={order.used} /></div>
    {order.status === 'pending' && <section className="rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="font-bold text-brand-900">Payment review</h3><p className="mt-1 text-sm text-brand-800">Confirm payment before the Training Provider can use these codes for linked companies.</p></div><div className="flex gap-2"><button type="button" onClick={confirm} className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800">Confirm payment</button><button type="button" onClick={reject} className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Reject order</button></div></div></section>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6"><CreditCard size={20} className="text-brand-700" /><div><h3 className="font-bold text-ink-900">Activation codes</h3><p className="mt-1 text-xs text-ink-500">Each code activates one Safety Buddy subscription for a company under this Training Provider. Codes appear after payment confirmation.</p></div></div><div className="overflow-x-auto"><table className="min-w-[800px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-ink-400"><tr><th className="px-5 py-3">#</th><th className="px-5 py-3">Code</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Linked company</th><th className="px-5 py-3">Activated</th><th className="px-5 py-3">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{pagination.rows.map((code, index) => <tr key={code.id}><td className="px-5 py-4 text-ink-400">{pagination.from + index}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-2 font-mono font-semibold text-ink-900"><KeyRound size={15} className="text-brand-700" /> {code.code || 'Released after payment'}</span></td><td className="px-5 py-4"><StatusBadge status={code.status} /></td><td className="px-5 py-4">{code.used_by_company_id ? <><p className="font-semibold text-ink-900">{code.used_by_company || `Company #${code.used_by_company_id}`}</p><p className="text-xs text-ink-400">{code.used_by_company_code || '—'}{code.used_by_company_email ? ` · ${code.used_by_company_email}` : ''}</p></> : <span className="text-ink-400">Not redeemed</span>}</td><td className="px-5 py-4 text-ink-500">{code.used_at || '—'}</td><td className="px-5 py-4">{code.used_by_company_id && <Link href={`/admin/companies/${code.used_by_company_id}?tab=subscriptions`} className="font-semibold text-brand-800 hover:underline">View company →</Link>}</td></tr>)}</tbody></table></div><AdminTablePagination pagination={pagination} /></section>
  </SystemAdminLayout></>;
}
