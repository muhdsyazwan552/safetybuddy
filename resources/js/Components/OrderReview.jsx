import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Check } from 'lucide-react';

const rm = value => `RM ${Number(value).toLocaleString('en-MY')}`;

/**
 * Full-screen review page shown before an order is submitted, so the user can check every detail first.
 * Rendered in a portal so it covers the page even when opened from inside a transformed card.
 *
 * details: [{ label, value }]  what is being ordered
 * lines:   [{ name, note?, qty, unit }]  priced rows; amount is qty × unit
 * notes:   [string]  what happens after submitting
 */
export default function OrderReview({ title = 'Review your order', subtitle = 'Check the details below. Nothing is sent until you confirm.', details = [], lines = [], notes = [], confirmLabel = 'Confirm & submit', processing = false, error = null, onConfirm, onBack }) {
  const total = lines.reduce((sum, line) => sum + line.qty * line.unit, 0);

  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape' && !processing) onBack(); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
  }, [onBack, processing]);

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-gray-50" role="dialog" aria-modal="true" aria-labelledby="order-review-title">
      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:py-12">
        <button type="button" onClick={onBack} disabled={processing} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900 disabled:opacity-50"><ArrowLeft className="h-4 w-4"/>Back to edit</button>
        <h1 id="order-review-title" className="mt-4 text-3xl font-black tracking-tight text-gray-900">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{subtitle}</p>

        <section className="mt-8 rounded-2xl bg-white ring-1 ring-gray-200">
          <h2 className="border-b border-gray-100 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Order details</h2>
          <dl className="divide-y divide-gray-100">
            {details.map(item => <div key={item.label} className="grid gap-1 px-6 py-3.5 sm:grid-cols-[200px_1fr] sm:gap-4">
              <dt className="text-sm text-gray-500">{item.label}</dt>
              <dd className="text-sm font-semibold text-gray-900">{item.value}</dd>
            </div>)}
          </dl>
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
          <h2 className="border-b border-gray-100 px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500">Price</h2>
          <div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-gray-400"><tr><th className="px-6 py-3 font-bold">Item</th><th className="px-3 py-3 text-right font-bold">Qty</th><th className="px-3 py-3 text-right font-bold">Unit price</th><th className="px-6 py-3 text-right font-bold">Amount</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {lines.map(line => <tr key={line.name}>
                <td className="px-6 py-3.5"><span className="font-semibold text-gray-900">{line.name}</span>{line.note && <span className="block text-xs text-gray-500">{line.note}</span>}</td>
                <td className="px-3 py-3.5 text-right">{line.qty}</td>
                <td className="whitespace-nowrap px-3 py-3.5 text-right">{rm(line.unit)}</td>
                <td className="whitespace-nowrap px-6 py-3.5 text-right font-semibold">{rm(line.qty * line.unit)}</td>
              </tr>)}
            </tbody>
            <tfoot><tr className="border-t-2 border-gray-200"><td colSpan="3" className="px-6 py-4 text-right text-sm font-bold text-gray-700">Total to pay</td><td className="whitespace-nowrap px-6 py-4 text-right text-xl font-black text-gray-900">{rm(total)}</td></tr></tfoot>
          </table></div>
        </section>

        {notes.length > 0 && <section className="mt-5 rounded-2xl bg-amber-50 p-6 ring-1 ring-amber-200">
          <h2 className="text-xs font-bold uppercase tracking-widest text-amber-900">What happens next</h2>
          <ul className="mt-3 space-y-2 text-sm text-amber-900/90">{notes.map(note => <li key={note} className="flex items-start gap-2.5"><Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={3}/>{note}</li>)}</ul>
        </section>}

        {error && <p className="mt-5 rounded-xl bg-rose-50 p-4 text-sm font-semibold text-rose-700 ring-1 ring-rose-200" role="alert">{error}</p>}

        <div className="mt-8 flex flex-wrap items-center justify-end gap-3">
          <button type="button" onClick={onBack} disabled={processing} className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">Back to edit</button>
          <button type="button" onClick={onConfirm} disabled={processing} className="rounded-xl bg-red-600 px-8 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:opacity-50">{processing ? 'Sending…' : confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
