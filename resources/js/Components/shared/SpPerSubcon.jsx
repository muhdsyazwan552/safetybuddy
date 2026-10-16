import React from 'react';

/**
 * Safety Passport sampling per subcontractor.
 *   sampled        = ticked attendees of that company (automatic)
 *   not registered = typed by the inspector
 * staff: [{ id, company_id, company_name }]   attendees: [staff ids]   value: { [company_id]: n }
 */
export function spGroups(staff = [], attendees = []) {
    const ids = new Set(attendees.map(Number));
    const map = new Map();
    staff.forEach((s) => {
        if (!ids.has(Number(s.id))) return;
        const g = map.get(s.company_id) || { id: s.company_id, name: s.company_name, sampled: 0 };
        g.sampled += 1;
        map.set(s.company_id, g);
    });

    return [...map.values()];
}

export default function SpPerSubcon({ staff = [], attendees = [], value = {}, onChange, error }) {
    const groups = spGroups(staff, attendees);

    if (groups.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
                Tick the staff who are present to record the Safety Passport sampling.
            </div>
        );
    }

    const num = (g) => Math.min(g.sampled, Math.max(0, Number(value[g.id] || 0)));
    const totalSampled = groups.reduce((n, g) => n + g.sampled, 0);
    const totalNot = groups.reduce((n, g) => n + num(g), 0);
    const pct = (s, n) => (s > 0 ? (((s - n) / s) * 100).toFixed(2) : '-');

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <h3 className="text-base font-extrabold text-gray-900">Safety Passport sampling</h3>
            <p className="mb-3 text-xs text-gray-500">Per subcontractor. The workers sampled are the staff you ticked; enter how many have no valid Safety Passport.</p>

            <div className="space-y-3">
                {groups.map((g) => {
                    const n = Number(value[g.id] || 0);
                    const over = n > g.sampled;
                    return (
                        <div key={g.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                            <p className="truncate text-sm font-bold text-gray-800">{g.name}</p>
                            <div className="mt-2 grid grid-cols-3 items-end gap-3 text-center">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Sampled</p>
                                    <p className="text-xl font-extrabold text-gray-900">{g.sampled}</p>
                                </div>
                                <label className="block">
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Not registered</span>
                                    <input
                                        type="number"
                                        min="0"
                                        max={g.sampled}
                                        inputMode="numeric"
                                        value={value[g.id] ?? ''}
                                        placeholder="0"
                                        onChange={(e) => onChange({ ...value, [g.id]: e.target.value })}
                                        className={`mt-1 w-full rounded-lg border px-2 py-2 text-center text-base font-bold ${over ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
                                    />
                                </label>
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">SP</p>
                                    <p className={`text-xl font-extrabold ${over ? 'text-gray-300' : 'text-ink-900'}`}>{over ? '-' : `${pct(g.sampled, n)}%`}</p>
                                </div>
                            </div>
                            {over && <p className="mt-1 text-xs font-medium text-red-500">Cannot be more than the {g.sampled} sampled.</p>}
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white">
                <span>All subcontractors</span>
                <span className="text-brand-400">{totalSampled} sampled · {totalNot} not registered · {pct(totalSampled, totalNot)}%</span>
            </div>
            {error && <p className="mt-2 text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
}
