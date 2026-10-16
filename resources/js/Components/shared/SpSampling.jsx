import React from 'react';

/**
 * Safety Passport (SP) sampling – only for a toolbox talk that was NOT conducted.
 *   total workers sampled   = number of staff ticked as present (automatic, read only)
 *   workers not registered  = typed by the inspector
 *   compliant workers       = sampled - not registered           (read only)
 *   SP compliance %         = (sampled - not registered) / sampled x 100
 */
export function spPercent(sampled, notRegistered) {
    const s = Number(sampled);
    const n = Number(notRegistered || 0);
    if (!s || s <= 0) return null;
    return Math.round((((s - n) / s) * 100) * 100) / 100;
}

export default function SpSampling({ sampled = 0, notRegistered = '', onChange, error, compact = false }) {
    const s = Number(sampled) || 0;
    const n = notRegistered === '' || notRegistered === null || notRegistered === undefined ? '' : Number(notRegistered);
    const over = n !== '' && n > s;
    const compliant = s === 0 ? '' : Math.max(0, s - (n === '' ? 0 : n));
    const pct = s === 0 || over ? null : spPercent(s, n === '' ? 0 : n);

    const input =
        'w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 ' +
        'focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/20';
    const readOnly = `${input} cursor-not-allowed bg-gray-100 text-gray-600`;

    const tone = pct === null ? 'text-gray-300' : pct >= 100 ? 'text-emerald-600' : pct >= 80 ? 'text-ink-900' : 'text-red-600';

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-lg font-extrabold text-gray-900">Safety Passport Sampling</h3>

            <div className="space-y-4">
                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Total workers sampled <span className="font-normal text-gray-400">(auto, from the staff you ticked)</span>
                    </label>
                    <input type="text" readOnly disabled className={readOnly} value={s} />
                    {s === 0 && <p className="mt-1 text-xs text-amber-600">Tick the staff present above — they are the workers sampled.</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">Workers not registered for this project</label>
                    <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max={s || undefined}
                        disabled={s === 0}
                        className={`${input} ${over ? '!border-red-400 !ring-red-100' : ''} disabled:cursor-not-allowed disabled:bg-gray-100`}
                        value={notRegistered ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder="0"
                    />
                    {over && <p className="mt-1 text-xs font-medium text-red-500">Cannot be more than the {s} worker(s) sampled.</p>}
                    {error && !over && <p className="mt-1 text-xs font-medium text-red-500">{error}</p>}
                </div>

                <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                        Compliant workers <span className="font-normal text-gray-400">(read only)</span>
                    </label>
                    <input type="text" readOnly disabled className={readOnly} value={compliant} placeholder="—" />
                </div>
            </div>

            <div className={`mt-5 rounded-2xl bg-gray-100 text-center ${compact ? 'p-4' : 'p-6'}`}>
                <p className="text-lg font-bold text-gray-800">SP Compliance</p>
                <p className={`mt-1 font-extrabold leading-none tracking-tight ${tone} ${compact ? 'text-5xl' : 'text-6xl'}`}>
                    {pct === null ? '—' : `${Number.isInteger(pct) ? pct : pct.toFixed(1)}%`}
                </p>
                <p className="mt-3 text-sm text-gray-600">
                    ({s || 'sampled'} − {n === '' ? 'not registered' : n}) ÷ {s || 'sampled'} × 100
                </p>
            </div>
        </div>
    );
}
