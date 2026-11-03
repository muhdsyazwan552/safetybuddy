import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import SystemAdminLayout from '@/Layouts/SystemAdminLayout';
import { StatusBadge } from './companyUi';
import { AdminTablePagination, useAdminTablePagination } from './adminTablePagination';

const money = value => `RM ${Number(value || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

export default function TrainingProviderOrders({ title, orders = [] }) {
  const pagination = useAdminTablePagination(orders);

  return <><Head title={title} /><SystemAdminLayout title={title} description="Training Providers purchase activation codes for companies registered under them.">
    <Link href="/admin/training-providers" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-600 hover:text-ink-900"><ArrowLeft size={17} /> Training Providers</Link>
    <div className="rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm text-brand-900"><strong>How it works:</strong> A Training Provider buys a package for companies under it. Each purchased package creates one activation code. After payment is confirmed, the Training Provider shares a code with a linked company. That company redeems it to activate its Safety Buddy subscription.</div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5 sm:p-6"><h2 className="text-lg font-bold text-ink-900">Activation code orders</h2><p className="mt-1 text-sm text-ink-500">Open an order to review payment, codes, and the companies that activated them.</p></div>
      <div className="overflow-x-auto"><table className="min-w-[960px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-ink-400"><tr><th className="px-5 py-3">#</th><th className="px-5 py-3">Training Provider</th><th className="px-5 py-3">Order reference</th><th className="px-5 py-3">Package</th><th className="px-5 py-3">Codes</th><th className="px-5 py-3">Order total</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Details</th></tr></thead><tbody className="divide-y divide-slate-100">{pagination.rows.map((order, index) => <tr key={order.batch_ref} className="hover:bg-slate-50/70"><td className="px-5 py-4 text-ink-400">{pagination.from + index}</td><td className="px-5 py-4 font-semibold text-ink-900">{order.provider || 'Unknown provider'}</td><td className="px-5 py-4"><p className="font-medium text-ink-700">{order.batch_ref}</p><p className="text-xs text-ink-400">{order.created_at || '—'}</p></td><td className="px-5 py-4 text-ink-600">{order.package || '—'}</td><td className="px-5 py-4 text-ink-600"><p className="font-semibold">{order.quantity} purchased</p><p className="text-xs text-ink-400">{order.available} available · {order.used} used</p></td><td className="px-5 py-4 font-semibold text-ink-800">{money(order.total)}</td><td className="px-5 py-4"><StatusBadge status={order.status} /></td><td className="px-5 py-4 text-right"><Link href={route('system.admin.training-providers.orders.show', order.batch_ref)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-brand-50">View details <ArrowRight size={14} /></Link></td></tr>)}{!orders.length && <tr><td colSpan="8" className="px-5 py-12 text-center text-ink-500">No activation code orders yet.</td></tr>}</tbody></table></div><AdminTablePagination pagination={pagination} />
    </section>
  </SystemAdminLayout></>;
}
