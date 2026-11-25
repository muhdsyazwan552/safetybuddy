import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import SystemAdminLayout from '@/Layouts/SystemAdminLayout';
import { StatusBadge } from './companyUi';
import TableToolbar, { ToolbarSelect, matchesSearch } from '@/Components/shared/TableToolbar';

const money = value => `RM ${Number(value || 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

export default function SlotOrders({ title, slotOrders = [] }) {
  const { flash = {}, errors = {} } = usePage().props;
  const [slotSearch, setSlotSearch] = useState('');
  const [slotStatus, setSlotStatus] = useState('');
  const shownSlots = slotOrders.filter(order => (!slotStatus || order.status === slotStatus) && matchesSearch(slotSearch, order.order_no, order.company, order.company_code, order.type, order.amount));
  const pendingSlots = slotOrders.filter(order => order.status === 'pending').length;
  const decideSlot = (order, action) => {
    const verb = action === 'approve' ? 'Approve (payment received)' : 'Reject';
    if (window.confirm(`${verb} slot order ${order.order_no} from ${order.company}?`)) {
      router.post(route(`system.admin.slot-orders.${action}`, order.id), {}, { preserveScroll: true });
    }
  };

  return <><Head title={title} /><SystemAdminLayout title={title} description="Confirm payment for extra Inspector and Contractor slots bought by companies.">
    {flash.success && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{flash.success}</div>}
    {Object.entries(errors).map(([key, value]) => <p key={key} className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{value}</p>)}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 p-5 sm:p-6"><h2 className="text-lg font-bold text-ink-900">Slot orders</h2><p className="mt-1 text-sm text-ink-500">{pendingSlots} awaiting payment. Approve only after the payment is received; a receipt is emailed to the customer. Rejecting removes the slots.</p></div>
      <TableToolbar search={slotSearch} onSearch={setSlotSearch} placeholder="Search order no., company or slot…" count={shownSlots.length} onClear={(slotSearch || slotStatus) ? () => { setSlotSearch(''); setSlotStatus(''); } : null}><ToolbarSelect label="Status" value={slotStatus} onChange={setSlotStatus}><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></ToolbarSelect></TableToolbar>
      <div className="overflow-x-auto"><table className="min-w-[800px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-ink-400"><tr><th className="px-5 py-3">Order no.</th><th className="px-5 py-3">Company</th><th className="px-5 py-3">Slot</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Ordered</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
        <tbody className="divide-y divide-slate-100">{shownSlots.map(order => <tr key={order.id} className="hover:bg-slate-50/70"><td className="whitespace-nowrap px-5 py-4 font-bold text-ink-900">{order.order_no || `#${order.id}`}</td><td className="px-5 py-4"><p className="font-semibold text-ink-900">{order.company || '—'}</p><p className="mt-0.5 text-xs text-ink-400">{order.company_code}</p></td><td className="whitespace-nowrap px-5 py-4 text-ink-800">Extra {order.type} {order.quantity === 1 ? 'slot' : 'slots'} × {order.quantity}</td><td className="whitespace-nowrap px-5 py-4 font-semibold text-ink-800">{money(order.amount)}</td><td className="whitespace-nowrap px-5 py-4 text-ink-500">{order.created_at ? new Date(order.created_at.replace(' ', 'T')).toLocaleString('en-MY') : '—'}</td><td className="px-5 py-4"><StatusBadge status={order.status} /></td><td className="px-5 py-4 text-right">{order.status === 'pending' && <div className="flex justify-end gap-2"><button type="button" onClick={() => decideSlot(order, 'approve')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800">Approve</button><button type="button" onClick={() => decideSlot(order, 'reject')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50">Reject</button></div>}</td></tr>)}{!shownSlots.length && <tr><td colSpan="7" className="px-5 py-12 text-center text-ink-500">{slotOrders.length ? 'No slot orders match your search.' : 'No slot orders yet.'}</td></tr>}</tbody></table></div>
    </section>
  </SystemAdminLayout></>;
}
