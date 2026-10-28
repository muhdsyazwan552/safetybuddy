// SPGPNC / BSPR configuration of the company: benchmarks, penalty amounts, ranking, switches.
import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Save, BookOpen } from 'lucide-react';

const field = 'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20';

function Num({ label, suffix, value, onChange, error }) {
    return (
        <label className="block text-xs font-semibold text-gray-600">
            {label}
            <div className="relative">
                <input type="number" step="0.01" min="0" value={value} onChange={(e) => onChange(e.target.value)} className={`${field} ${suffix ? 'pr-12' : ''}`} />
                {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{suffix}</span>}
            </div>
            {error && <span className="text-xs text-red-500">{error}</span>}
        </label>
    );
}

function Switch({ label, checked, onChange }) {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold text-gray-700">
            {label}
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-brand-600" />
        </label>
    );
}

export default function PerformanceSettingsCard({ settings }) {
    const { data, setData, put, processing, errors, recentlySuccessful } = useForm({
        sp_benchmark: settings.sp_benchmark, g_benchmark: settings.g_benchmark, p_benchmark: settings.p_benchmark,
        sp_penalty: settings.sp_penalty, g_penalty: settings.g_penalty, p_penalty: settings.p_penalty,
        nc_penalty: settings.nc_penalty, cc_penalty: settings.cc_penalty,
        gold_min: settings.gold_min, silver_min: settings.silver_min,
        scoring_on: !!settings.scoring_on, bspr_on: !!settings.bspr_on, penalties_on: !!settings.penalties_on,
    });

    const save = (e) => {
        e.preventDefault();
        put('/performance-settings', { preserveScroll: true });
    };

    return (
        <form onSubmit={save} className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-gray-800">SPGPNC &amp; BSPR settings</h2>
                    <p className="text-sm text-gray-500">Enable Safety Metrics to measure your company's safety compliance performance based on inspection results. You can use the default settings or customise them to suit your company's requirements. If disabled, inspections can still be conducted, but SPGPNC scores, penalties, and BSPR ratings will not be generated.</p>
                </div>
                <Link href="/performance/learn-more" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700">
                    <BookOpen className="h-4 w-4" /> Learn more
                </Link>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
                <Switch label="Scoring" checked={data.scoring_on} onChange={(v) => setData('scoring_on', v)} />
                <Switch label="BSPR ranking" checked={data.bspr_on} onChange={(v) => setData('bspr_on', v)} />
                <Switch label="Penalties" checked={data.penalties_on} onChange={(v) => setData('penalties_on', v)} />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                            <th className="px-3 py-2">Metric</th><th className="px-3 py-2">Measurement</th><th className="px-3 py-2">Minimum benchmark</th><th className="px-3 py-2">Penalty when below / per finding</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[
                            ['SP', 'Compliant sampled workers ÷ sampled workers × 100', 'sp_benchmark', 'sp_penalty', 'once per inspection'],
                            ['G', 'GOOD ÷ total findings × 100', 'g_benchmark', 'g_penalty', 'once per inspection'],
                            ['P', '100 − (POOR ÷ total findings × 100)', 'p_benchmark', 'p_penalty', 'once per inspection'],
                            ['N', '100 − (NC ÷ total findings × 100)', null, 'nc_penalty', 'per NC'],
                            ['C', '100 − (CC ÷ total findings × 100)', null, 'cc_penalty', 'per CC'],
                        ].map(([k, m, bench, pen, per]) => (
                            <tr key={k}>
                                <td className="px-3 py-3 font-extrabold">{k}</td>
                                <td className="px-3 py-3 text-gray-600">{m}</td>
                                <td className="px-3 py-3">{bench ? <Num label="" suffix="%" value={data[bench]} onChange={(v) => setData(bench, v)} error={errors[bench]} /> : <span className="text-gray-400">No benchmark</span>}</td>
                                <td className="px-3 py-3"><Num label="" suffix="RM" value={data[pen]} onChange={(v) => setData(pen, v)} error={errors[pen]} /><span className="text-[11px] text-gray-400">{per}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Num label="GOLD: SPGPNC at or above" suffix="%" value={data.gold_min} onChange={(v) => setData('gold_min', v)} error={errors.gold_min} />
                <Num label="SILVER: at or above (below Gold is Silver, below this is Bronze)" suffix="%" value={data.silver_min} onChange={(v) => setData('silver_min', v)} error={errors.silver_min} />
            </div>

            <div className="mt-5 flex items-center gap-3">
                <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-bold text-ink-900 disabled:opacity-50">
                    <Save className="h-4 w-4" /> Save settings
                </button>
                {recentlySuccessful && <span className="text-sm font-semibold text-emerald-600">Saved</span>}
            </div>
        </form>
    );
}
