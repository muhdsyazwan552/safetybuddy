import React, { useMemo, useState } from 'react';
import { Check, Search, Users, X } from 'lucide-react';

/**
 * Tick the subcontractor staff who attended a toolbox talk.
 * The total attendance is simply the number of ticked people – nothing is typed.
 */
export default function AttendeePicker({ staff = [], value = [], onChange, error, projectSelected = true }) {
    const [query, setQuery] = useState('');
    const selected = useMemo(() => new Set(value.map(Number)), [value]);

    const groups = useMemo(() => {
        const q = query.trim().toLowerCase();
        const map = new Map();
        staff.forEach((s) => {
            if (q && !`${s.name} ${s.role || ''} ${s.company_name}`.toLowerCase().includes(q)) return;
            if (!map.has(s.company_id)) map.set(s.company_id, { id: s.company_id, name: s.company_name, people: [] });
            map.get(s.company_id).people.push(s);
        });
        return [...map.values()];
    }, [staff, query]);

    const toggle = (id) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        onChange([...next]);
    };

    const toggleGroup = (g) => {
        const ids = g.people.map((p) => p.id);
        const all = ids.every((id) => selected.has(id));
        const next = new Set(selected);
        ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
        onChange([...next]);
    };

    const selectedPeople = staff.filter((s) => selected.has(s.id));

    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-gray-700">Attendance — tick who attended</label>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1 text-xs font-extrabold text-brand-400">
                    <Users className="h-3.5 w-3.5" /> Total: {selected.size}
                </span>
            </div>

            {!projectSelected ? (
                <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                    Choose the project first to see its subcontractor staff.
                </p>
            ) : staff.length === 0 ? (
                <p className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-6 text-center text-sm text-amber-800">
                    No subcontractor staff are registered for this project yet. Add staff on the subcontractor page first.
                </p>
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white">
                    <div className="relative border-b border-gray-100 p-2.5">
                        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search staff, role or company…"
                            className="w-full rounded-lg border-0 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                        {groups.length === 0 && <p className="p-4 text-center text-sm text-gray-400">No staff match your search.</p>}
                        {groups.map((g) => {
                            const allOn = g.people.every((p) => selected.has(p.id));
                            return (
                                <div key={g.id} className="border-b border-gray-100 last:border-0">
                                    <div className="flex items-center justify-between bg-gray-50 px-3.5 py-2">
                                        <p className="truncate text-xs font-extrabold uppercase tracking-wide text-gray-600">{g.name}</p>
                                        <button type="button" onClick={() => toggleGroup(g)} className="shrink-0 text-xs font-bold text-blue-700 hover:underline">
                                            {allOn ? 'Clear' : 'Select all'}
                                        </button>
                                    </div>
                                    <ul>
                                        {g.people.map((p) => {
                                            const on = selected.has(p.id);
                                            return (
                                                <li key={p.id}>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggle(p.id)}
                                                        className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition hover:bg-gray-50 ${on ? 'bg-brand-100/50' : ''}`}
                                                    >
                                                        <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${on ? 'border-brand-600 bg-brand-500 text-ink-900' : 'border-gray-300 bg-white'}`}>
                                                            {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate text-sm font-semibold text-gray-900">{p.name}</span>
                                                            {p.role && <span className="block truncate text-xs text-gray-500">{p.role}</span>}
                                                        </span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>

                    {selectedPeople.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 border-t border-gray-100 p-2.5">
                            {selectedPeople.map((p) => (
                                <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-bold text-brand-900">
                                    {p.name}
                                    <button type="button" onClick={() => toggle(p.id)} className="rounded-full p-0.5 hover:bg-brand-200" aria-label={`Remove ${p.name}`}>
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {error && <p className="mt-1.5 text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
}
