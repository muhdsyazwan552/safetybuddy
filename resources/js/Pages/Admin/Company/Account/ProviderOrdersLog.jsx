import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { FileText, MessageCircle } from 'lucide-react';
import TableToolbar, { ToolbarSelect, matchesSearch } from '@/Components/shared/TableToolbar';

const rm = value => `RM ${Number(value).toLocaleString('en-MY')}`;
const STATUS = {
  pending: { label: 'Waiting for payment', tone: 'bg-amber-50 text-amber-800', row: 'border-l-4 border-l-amber-400' },
  paid: { label: 'Paid', tone: 'bg-emerald-50 text-emerald-700', row: 'border-l-4 border-l-emerald-500 bg-emerald-50/50' },
  rejected: { label: 'Not approved', tone: 'bg-rose-50 text-rose-700', row: 'border-l-4 border-l-gray-300 bg-gray-100 text-gray-500' },
};

const itemText = (order, renewal) => renewal
  ? `Renew ${order.package} for ${order.participant}`
  : `${order.quantity} × ${order.package} (1 year) for new participant${order.quantity === 1 ? '' : 's'}`;

const waLink = (order, renewal) => `https://wa.me/60168865619?text=${encodeURIComponent(`Hello Safety Buddy, I would like to make payment for my order.\nOrder number: ${order.batch_ref}\nItem: ${itemText(order, renewal)}\nAmount: ${rm(order.total)}`)}`;

/** Order log shown under each order form: order number, status, Pay by WhatsApp while unpaid, receipt once paid. */
export default function ProviderOrdersLog({ orders = [], renewal = false, title = 'Order log' }) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const rows = orders.filter(order => (!status || order.status === status) && matchesSearch(search, order.batch_ref, order.package, order.participant, order.total, STATUS[order.status]?.label));

  return <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm" aria-labelledby="order-log-title">
    <div className="border-b border-gray-100 px-5 py-4">
      <h2 id="order-log-title" className="font-bold text-ink-950">{title}</h2>
      <p className="mt-1 text-xs text-gray-500">Every order with its order number and status. For an unpaid order, tap Pay by WhatsApp to send us the order details. Once paid, the receipt is ready to open.</p>
    </div>
    <TableToolbar search={search} onSearch={setSearch} placeholder={renewal ? 'Search order no. or participant…' : 'Search order no. or package…'} count={rows.length} noun="order" onClear={(search || status) ? () => { setSearch(''); setStatus(''); } : null}>
      <ToolbarSelect label="Status" value={status} onChange={setStatus}>
        <option value="">All statuses</option>
        <option value="pending">Waiting for payment</option>
        <option value="paid">Paid</option>
        <option value="rejected">Not approved</option>
      </ToolbarSelect>
    </TableToolbar>
    {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left text-sm">
      <thead className="bg-ink-950 text-xs font-bold uppercase tracking-wider text-brand-400"><tr>
        <th className="px-5 py-3">Date</th><th className="px-5 py-3">Order no.</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Total</th><th className="px-5 py-3 text-right">Action</th>
      </tr></thead>
      <tbody>{rows.map(order => {
        const state = STATUS[order.status];
        return <tr key={order.batch_ref} className={`border-b border-gray-100 align-top ${state.row}`}>
          <td className="whitespace-nowrap px-5 py-4">{order.date}</td>
          <td className="whitespace-nowrap px-5 py-4 font-bold">{order.batch_ref}</td>
          <td className="px-5 py-4 font-semibold">{itemText(order, renewal)}</td>
          <td className="whitespace-nowrap px-5 py-4"><span className={`rounded-full px-3 py-1 text-xs font-bold ${state.tone}`}>{state.label}</span></td>
          <td className="whitespace-nowrap px-5 py-4 text-right font-bold">{rm(order.total)}</td>
          <td className="whitespace-nowrap px-5 py-4 text-right"><span className="inline-flex items-center gap-2">
            {order.status === 'pending' && <a href={waLink(order, renewal)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-brand-400 px-3 py-1.5 text-xs font-black text-ink-950 hover:bg-brand-300"><MessageCircle className="h-3.5 w-3.5" /> Pay by WhatsApp</a>}
            {order.payment_id && <a href={`/manage-package/payments/${order.payment_id}/receipt`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-900 hover:border-brand-400 hover:bg-brand-50"><FileText className="h-3.5 w-3.5" /> {order.receipt_no}</a>}
            <Link href={`/training-provider/packages/orders/${order.batch_ref}`} className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-ink-900 hover:border-brand-400">Details</Link>
          </span></td>
        </tr>;
      })}</tbody>
    </table></div> : <p className="px-5 py-10 text-center text-sm text-gray-500">{orders.length ? 'No orders match your search.' : 'No orders yet.'}</p>}
  </section>;
}
