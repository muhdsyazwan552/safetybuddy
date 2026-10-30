import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    MapPin, CalendarDays, ClipboardCheck, AlertTriangle, Users, Building2, Phone, Mail, ChevronRight, Clock, ChevronLeft,
} from 'lucide-react';
import ReviewLayout from '@/Layouts/ReviewLayout';
import VisitCard from '@/Components/shared/VisitCard';
import CaseCard from '@/Components/shared/CaseCard';
import { EVAL, EVAL_ORDER, fmtDate } from '@/Components/inspector/kit';
import { statusMeta, timelineProgress, daysLeft } from '@/Components/inspector/projectUtils';

const CASE_STATE = {
    open: ['Open', 'bg-red-50 text-red-700 border-red-200'],
    responded: ['Replied', 'bg-blue-50 text-blue-700 border-blue-200'],
    returned: ['Returned', 'bg-amber-50 text-amber-700 border-amber-200'],
    closed: ['Closed', 'bg-emerald-50 text-emerald-700 border-emerald-200'],
};

// The project page content, shared with the inspector's project page.
// hrefs: where a visit / case / subcontractor opens; null = that record has no page for this user
export function ProjectDetail({ project, stats = {}, evaluation = {}, team = [], subcons = [], visits = [], cases = [], backHref = '/review/projects', backLabel = 'Projects', myRole = null, heroExtra = null, hrefs = {} }) {
    const visitHref = hrefs.visit || ((v) => `/review/visits/${v.key}`);
    const caseHref = hrefs.case === undefined ? ((c) => `/review/cases/${c.type}/${c.id}`) : hrefs.case;
    const subconHref = hrefs.subcon === undefined ? ((c) => `/review/subcons/${c.id}`) : hrefs.subcon;
    const SubconTag = subconHref ? Link : 'div';
    const [tab, setTab] = useState('overview');
    const st = statusMeta(project.status);
    const prog = timelineProgress(project.start_date, project.end_date);
    const left = daysLeft(project.end_date);
    const evalTotal = EVAL_ORDER.reduce((s, k) => s + (evaluation[k] || 0), 0);
    const openCases = cases.filter((c) => c.state !== 'closed');

    // every list is paged on the page itself; each tab keeps its own page number
    const [pages, setPages] = useState({ visits: 1, cases: 1, subcons: 1, team: 1 });
    const setPage = (key, n) => setPages((p) => ({ ...p, [key]: n }));
    const paged = (key, rows, size) => {
        const last = Math.max(1, Math.ceil(rows.length / size));
        const page = Math.min(pages[key], last);
        return { rows: rows.slice((page - 1) * size, page * size), page, last, total: rows.length, key };
    };
    // only one card of the visit / case lists is open at a time
    const [openVisit, setOpenVisit] = useState(null);
    const [openCase, setOpenCase] = useState(null);
    const pVisits = paged('visits', visits, 5);
    const pCases = paged('cases', cases, 5);
    const pSubcons = paged('subcons', subcons, 6);
    const pTeam = paged('team', team, 6);

    const tabs = [
        ['overview', 'Overview'],
        ['visits', `Toolbox talk & Inspection (${stats.visits ?? 0})`],
        ['cases', `NC / CC (${cases.length})`],
        ['subcons', `Subcons (${subcons.length})`],
        ['team', `Team (${team.length})`],
    ];

    return (
            <div className="mx-auto max-w-5xl space-y-4 px-4 pb-10 pt-5 sm:px-6">
                <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800">
                    <ChevronLeft className="h-4 w-4" /> {backLabel}
                </Link>

                {/* Hero */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink-950 via-ink-900 to-ink-700 p-5 text-white shadow-lg">
                    <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-2xl" />
                    <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">Project #{project.id}</p>
                                <h1 className="mt-1 break-words text-xl font-extrabold leading-tight sm:text-2xl">{project.name}</h1>
                                <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-300">
                                    <MapPin className="h-4 w-4 shrink-0 text-brand-400" /> {project.location || '-'}
                                </p>
                            </div>
                            <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold uppercase ${st.cls}`}>{st.label}</span>
                        </div>
                        {myRole && <p className="mt-3 text-sm text-gray-300">Your role : <b className="text-brand-400">{myRole}</b></p>}

                        <div className="mt-4">
                            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-300">
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays className="h-3.5 w-3.5 text-brand-400" />
                                    {fmtDate(project.start_date)} → {fmtDate(project.end_date)}
                                </span>
                                {left !== null && (
                                    <span className={`font-bold ${left < 0 ? 'text-red-400' : 'text-brand-400'}`}>
                                        {left < 0 ? `${Math.abs(left)} days overdue` : left === 0 ? 'Ends today' : `${left} days left`}
                                    </span>
                                )}
                            </div>
                            {prog !== null && (
                                <div className="h-2 overflow-hidden rounded-full bg-white/15">
                                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${prog}%` }} />
                                </div>
                            )}
                        </div>
                        {heroExtra}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat icon={ClipboardCheck} label="Inspections" value={stats.inspections ?? 0} onClick={() => setTab('visits')} />
                    <Stat icon={AlertTriangle} label="Open NC / CC" value={stats.open_cases ?? 0} danger={stats.open_cases > 0} onClick={() => setTab('cases')} />
                    <Stat icon={Clock} label="Manhours" value={stats.manhours ?? 0} sub={`${stats.work_days ?? 0} work day(s)`} />
                    <Stat icon={Building2} label="Subcons" value={subcons.length} onClick={() => setTab('subcons')} />
                </div>

                {/* Tabs */}
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sb-scroll sm:mx-0 sm:px-0">
                    {tabs.map(([k, label]) => (
                        <button
                            key={k}
                            onClick={() => setTab(k)}
                            className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${tab === k ? 'bg-ink-900 text-brand-400' : 'border border-gray-200 bg-white text-gray-600'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'overview' && (
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card title="Inspection results">
                            {evalTotal === 0 ? <Empty>No inspections yet.</Empty> : (
                                <div className="space-y-3">
                                    <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
                                        {EVAL_ORDER.map((k) => evaluation[k] > 0 && (
                                            <div key={k} style={{ width: `${(evaluation[k] / evalTotal) * 100}%`, background: EVAL[k].color }} />
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {EVAL_ORDER.map((k) => (
                                            <div key={k} className="flex items-center gap-2 text-sm">
                                                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: EVAL[k].color }} />
                                                <span className="min-w-0 flex-1 truncate text-gray-600">{EVAL[k].label}</span>
                                                <span className="font-bold text-gray-900">{evaluation[k] || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>

                        <Card title={`Open NC / CC (${openCases.length})`}>
                            {openCases.length === 0 ? <Empty>Nothing open on this project.</Empty> : (
                                <div className="-mx-4 -mb-4 divide-y divide-gray-100">
                                    {openCases.slice(0, 5).map((c) => <CaseRow key={c.key} c={c} href={caseHref ? caseHref(c) : null} />)}
                                </div>
                            )}
                        </Card>

                        <Card title="Latest toolbox talk & inspection" className="md:col-span-2">
                            {visits.length === 0 ? <Empty>No toolbox talk & inspection yet.</Empty> : (
                                <div className="space-y-3">
                                    {visits.slice(0, 3).map((v) => <VisitCard key={v.key} visit={v} detailHref={visitHref(v)} />)}
                                    {visits.length > 3 && (
                                        <button onClick={() => setTab('visits')} className="w-full rounded-xl bg-gray-50 py-2.5 text-xs font-bold text-brand-800">See all toolbox talk & inspection</button>
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {tab === 'visits' && (
                    visits.length === 0 ? <Empty boxed>No toolbox talk & inspection yet.</Empty> : (
                        <div className="space-y-4">
                            {pVisits.rows.map((v) => (
                                <VisitCard key={v.key} visit={v} detailHref={visitHref(v)} open={openVisit === v.key} onToggle={() => setOpenVisit((k) => (k === v.key ? null : v.key))} />
                            ))}
                            <Pagination p={pVisits} onPage={setPage} />
                        </div>
                    )
                )}

                {tab === 'cases' && (
                    cases.length === 0 ? <Empty boxed>No NC / CC raised on this project.</Empty> : (
                        <div className="space-y-4">
                            {pCases.rows.map((c) => (
                                <CaseCard key={c.key} item={c} showReply={false} collapsible open={openCase === c.key} onToggle={() => setOpenCase((k) => (k === c.key ? null : c.key))}>
                                    {caseHref && (
                                        <Link href={caseHref(c)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink-900 px-5 py-3 text-sm font-bold text-brand-400 shadow-sm transition hover:bg-ink-800 sm:ml-auto sm:w-auto sm:min-w-[260px]">
                                            View full details <ChevronRight className="h-4 w-4" />
                                        </Link>
                                    )}
                                </CaseCard>
                            ))}
                            <Pagination p={pCases} onPage={setPage} />
                        </div>
                    )
                )}

                {tab === 'subcons' && (
                    subcons.length === 0 ? <Empty boxed>No subcontractor assigned.</Empty> : (
                        <div className="space-y-3"><div className="grid gap-3 md:grid-cols-2">
                            {pSubcons.rows.map((c) => (
                                <SubconTag key={c.id} {...(subconHref ? { href: subconHref(c) } : {})} className="block min-w-0 rounded-3xl border border-gray-200 bg-white p-4 shadow-md shadow-gray-200/60 transition hover:shadow-md">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 font-extrabold text-ink-900">{(c.name || '?').charAt(0).toUpperCase()}</span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-gray-900">{c.name}</p>
                                            <p className="truncate text-xs text-gray-500">{c.scope || 'No scope set'}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                                    </div>
                                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                                        <Pill label="Staff" value={c.staff} />
                                        <Pill label="Today" value={c.present_today} />
                                        <Pill label="Inspections" value={c.inspections} />
                                    </div>
                                </SubconTag>
                            ))}
                        </div>
                        <Pagination p={pSubcons} onPage={setPage} /></div>
                    )
                )}

                {tab === 'team' && (
                    team.length === 0 ? <Empty boxed>No staff assigned.</Empty> : (
                        <div className="space-y-3"><div className="grid gap-3 md:grid-cols-2">
                            {pTeam.rows.map((m) => (
                                <div key={m.id} className="min-w-0 rounded-3xl border border-gray-200 bg-white p-4 shadow-md shadow-gray-200/60">
                                    <div className="flex items-center gap-3">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 font-extrabold text-brand-900">{(m.name || '?').charAt(0).toUpperCase()}</span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-gray-900">{m.name}{m.is_me && <span className="ml-2 rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-extrabold text-ink-900">You</span>}</p>
                                            <p className="truncate text-xs text-gray-500">{m.role || '-'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 space-y-1 text-xs text-gray-600">
                                        {m.contact && <a href={`tel:${m.contact}`} className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gray-400" />{m.contact}</a>}
                                        {m.email && <a href={`mailto:${m.email}`} className="flex min-w-0 items-center gap-2"><Mail className="h-3.5 w-3.5 shrink-0 text-gray-400" /><span className="truncate">{m.email}</span></a>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Pagination p={pTeam} onPage={setPage} /></div>
                    )
                )}
            </div>
    );
}

export default function ProjectShow(props) {
    return (
        <ReviewLayout title={props.project.name}>
            <Head title={`Project: ${props.project.name}`} />
            <ProjectDetail {...props} />
        </ReviewLayout>
    );
}

// Previous / next with the page count; hidden when everything fits on one page
function Pagination({ p, onPage }) {
    if (p.last <= 1) return null;
    const btn = 'inline-flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 disabled:opacity-40';
    return (
        <div className="flex items-center justify-between gap-3 pt-1">
            <button type="button" className={btn} disabled={p.page <= 1} onClick={() => onPage(p.key, p.page - 1)}>
                <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span className="text-xs font-semibold text-gray-500">Page {p.page} of {p.last} · {p.total} total</span>
            <button type="button" className={btn} disabled={p.page >= p.last} onClick={() => onPage(p.key, p.page + 1)}>
                Next <ChevronRight className="h-4 w-4" />
            </button>
        </div>
    );
}

function Stat({ icon: Icon, label, value, sub, danger = false, onClick }) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag type={onClick ? 'button' : undefined} onClick={onClick} className={`min-w-0 rounded-2xl border p-3.5 text-left shadow-sm ${danger ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-white'}`}>
            <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] font-bold uppercase tracking-wide text-gray-500">{label}</span>
                <Icon className={`h-4 w-4 shrink-0 ${danger ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
            <p className={`mt-1.5 text-2xl font-extrabold leading-none ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
            {sub && <p className="mt-1 text-[11px] text-gray-400">{sub}</p>}
        </Tag>
    );
}

function Card({ title, children, className = '' }) {
    return (
        <section className={`min-w-0 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-md shadow-gray-200/60 ${className}`}>
            <p className="bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">{title}</p>
            <div className="p-4">{children}</div>
        </section>
    );
}

function Empty({ children, boxed = false }) {
    return <p className={`text-sm text-gray-500 ${boxed ? 'rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center' : ''}`}>{children}</p>;
}

function Pill({ label, value }) {
    return (
        <div className="rounded-xl bg-gray-50 py-2">
            <p className="text-base font-extrabold text-gray-900">{value}</p>
            <p className="text-[10px] font-semibold uppercase text-gray-500">{label}</p>
        </div>
    );
}

function CaseRow({ c, href }) {
    const [label, cls] = CASE_STATE[c.state] || CASE_STATE.open;
    const i = c.inspection || {};
    const Tag = href ? Link : 'div';
    return (
        <Tag {...(href ? { href } : {})} className="flex items-center gap-3 px-4 py-3 transition hover:bg-gray-50">
            <span className={`shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold ${c.type === 'nc' ? 'bg-orange-100 text-orange-800' : 'bg-violet-100 text-violet-800'}`}>
                {c.type === 'nc' ? 'NC' : 'CC'}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{i.topic || 'Inspection finding'}</p>
                <p className="truncate text-xs text-gray-500">{i.subcon || '-'} · {fmtDate(c.date_open || c.created_at)}</p>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{label}</span>
        </Tag>
    );
}
