// Everything about one subcontractor company - staff, daily attendance, NC / CC,
// Safety Passport and machinery. Shared by the admin, review and inspector portals;
// the data comes from App\Support\SubconDetail.
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { storageUrl, cardTone, subconStatus } from '@/Components/inspector/kit';
import TableViewIcon, { tableViewActionClass } from '@/Components/shared/TableViewIcon';

const fmtDate = (d) => (d ? dayjs(d).format('DD MMM YYYY') : '-');

export const ExpiryBadge = ({ date }) => {
  if (!date) return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">No expiry</span>;
  const days = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
  const cls = days < 0 ? 'bg-red-100 text-red-700' : days <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{days < 0 ? 'Expired' : 'Exp'} {fmtDate(date)}</span>;
};

const EmptyState = ({ children }) => (
  <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">{children}</div>
);

const Detail = ({ label, children }) => (
  <div>
    <div className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</div>
    <div className="whitespace-pre-line text-gray-800">{children}</div>
  </div>
);

export const SubconSummary = ({ staff = [], machinery, cases, attendance, induction, onSelect }) => {
  const today = dayjs().format('YYYY-MM-DD');
  const presentToday = attendance.filter(a => a.date === today).reduce((n, a) => n + a.workers, 0);
  const openCases = cases.filter(c => c.state !== 'closed').length;
  const expiredCf = machinery.filter(m => m.cf_expiry && dayjs(m.cf_expiry).isBefore(dayjs(), 'day')).length;
  const cards = [
    { key: 'staff', label: 'Staff', value: staff.length, sub: `${staff.filter(s => (s.status || 'active') === 'active').length} active` },
    { key: 'attendance', label: 'Present Today', value: presentToday, sub: `${attendance.length} day record(s)` },
    { key: 'cases', label: 'Open NC / CC', value: openCases, sub: `${cases.length} total`, alert: openCases > 0 },
    { key: 'induction', label: 'Safety Passport', value: `${induction.done}/${induction.total}`, sub: induction.complete ? 'Complete' : 'Incomplete', alert: !induction.complete },
    { key: 'machinery', label: 'Machinery', value: machinery.length, sub: expiredCf ? `${expiredCf} CF expired` : 'No expired CF', alert: expiredCf > 0 },
  ];
  return (
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
      {cards.map(c => (
        <button key={c.key} type="button" onClick={() => onSelect(c.key)}
          className={`relative overflow-hidden rounded-3xl border p-4 text-left ${c.alert ? cardTone('rejected').card : 'border-gray-200 bg-white shadow-md shadow-gray-200/60 transition hover:-translate-y-0.5 hover:shadow-xl'}`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{c.label}</div>
          <div className="mt-1.5 text-3xl font-extrabold leading-none text-gray-900">{c.value}</div>
          <div className={`mt-1.5 text-xs ${c.alert ? 'font-extrabold uppercase tracking-wide text-rose-700' : 'font-semibold text-emerald-700'}`}>{c.sub}</div>
        </button>
      ))}
    </div>
  );
};
export const SubconTabs = ({ tab, onChange, counts }) => {
  const tabs = [
    ['staff', 'Staff'],
    ['attendance', 'Daily Attendance'],
    ['cases', 'NC / CC'],
    ['induction', 'Safety Passport'],
    ['machinery', 'Machinery'],
  ];
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
      {tabs.map(([key, label]) => (
        <button key={key} type="button" onClick={() => onChange(key)}
          className={`shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${
            tab === key ? 'bg-ink-900 text-brand-400 shadow-md' : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}>
          {label}
          <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${tab === key ? 'bg-white/15 text-brand-400' : 'bg-gray-100 text-gray-600'}`}>{counts[key]}</span>
        </button>
      ))}
    </div>
  );
};
export const AttendanceTab = ({ attendance }) => {
  const [open, setOpen] = useState(null);
  const [month, setMonth] = useState('');
  const months = [...new Set(attendance.map(a => a.date.slice(0, 7)))];
  const rows = month ? attendance.filter(a => a.date.startsWith(month)) : attendance;
  const totals = rows.reduce((t, a) => ({ workers: t.workers + a.workers, manhours: t.manhours + a.manhours }), { workers: 0, manhours: 0 });

  if (!attendance.length) return <EmptyState>No daily attendance recorded yet. The subcontractor leader ticks staff present from their leader link.</EmptyState>;

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-md shadow-gray-200/60">
      <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-semibold text-gray-800">{rows.length}</span> day(s) &middot;{' '}
          <span className="font-semibold text-gray-800">{totals.workers}</span> worker-days &middot;{' '}
          <span className="font-semibold text-gray-800">{Math.round(totals.manhours * 100) / 100}</span> manhours
        </div>
        <select value={month} onChange={e => setMonth(e.target.value)} className="rounded border border-gray-300 px-3 py-1 pr-8 text-sm">
          <option value="">All months</option>
          {months.map(m => <option key={m} value={m}>{dayjs(m + '-01').format('MMMM YYYY')}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-b from-gray-50 to-white">
            <tr>
              {['Date', 'Project', 'Workers', 'Hours / Worker', 'Manhours', ''].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {rows.map(a => (
              <React.Fragment key={a.key}>
                <tr className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-800">{dayjs(a.date).format('ddd, DD MMM YYYY')}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{a.project}</td>
                  <td className="px-6 py-3 text-sm text-gray-800">{a.workers}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">{a.hours}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-gray-800">{a.manhours}</td>
                  <td className="px-6 py-3 text-right">
                    <button type="button" onClick={() => setOpen(open === a.key ? null : a.key)} className="whitespace-nowrap text-sm text-blue-600 hover:underline">
                      {open === a.key ? 'Hide' : 'Who was present'}
                    </button>
                  </td>
                </tr>
                {open === a.key && (
                  <tr className="bg-gray-50">
                    <td colSpan="6" className="px-6 py-3">
                      {a.staff.length ? (
                        <div className="flex flex-wrap gap-2">
                          {a.staff.map(s => (
                            <span key={s.id} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700">
                              {s.name}{s.role ? <span className="text-gray-400"> &middot; {s.role}</span> : null}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-xs text-gray-500">Headcount only, names were not recorded for this day.</span>}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CASE_STATE = {
  open: ['Open', 'bg-red-100 text-red-700'],
  responded: ['Responded', 'bg-blue-100 text-blue-700'],
  returned: ['Returned', 'bg-amber-100 text-amber-800'],
  closed: ['Closed', 'bg-green-100 text-green-800'],
};

export const CasesTab = ({ cases }) => {
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);
  const rows = cases.filter(c => filter === 'all' || (filter === 'open' ? c.state !== 'closed' : c.type === filter));

  if (!cases.length) return <EmptyState>No Non-Conformance or Client Complaint has been raised against this company.</EmptyState>;

  const filters = [
    ['all', `All (${cases.length})`],
    ['open', `Not closed (${cases.filter(c => c.state !== 'closed').length})`],
    ['nc', `NC (${cases.filter(c => c.type === 'nc').length})`],
    ['cc', `CC (${cases.filter(c => c.type === 'cc').length})`],
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {filters.map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === k ? 'bg-blue-600 text-white' : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}>{l}</button>
        ))}
      </div>
      {rows.map(c => {
        const [label, cls] = CASE_STATE[c.state] || CASE_STATE.open;
        const i = c.inspection || {};
        const expanded = open === c.key;
        return (
          <div key={c.key} className={`overflow-hidden rounded-3xl border ${cardTone(c.state).card}`}>
            <button type="button" onClick={() => setOpen(expanded ? null : c.key)} className="flex w-full flex-col gap-2 p-4 text-left md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold ${c.type === 'nc' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}`}>
                  {c.series_code || `${c.type === 'nc' ? 'NC' : 'CC'} #${c.id}`}
                </span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{i.topic || 'Inspection finding'}</div>
                  <div className="text-xs text-gray-500">{i.project || '-'}{i.location ? ` · ${i.location}` : ''} · Opened {fmtDate(c.date_open || c.created_at)}</div>
                </div>
              </div>
              <span className={`self-start text-xs font-extrabold uppercase tracking-wide md:self-center ${cls.split(' ').find(x => x.startsWith('text-'))}`}>Status : {label}</span>
            </button>
            {expanded && (
              <div className="grid gap-4 border-t border-gray-100 p-4 text-sm md:grid-cols-2">
                <div className="space-y-2">
                  <Detail label="Finding">{i.description || '-'}</Detail>
                  <Detail label="Comment">{c.comment || '-'}</Detail>
                  <Detail label="Inspection">{fmtDate(i.inspection_date)}{i.inspector ? ` by ${i.inspector}` : ''}</Detail>
                  {c.date_close && <Detail label="Closed">{fmtDate(c.date_close)}</Detail>}
                  {i.photos?.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {i.photos.map(p => (
                        <a key={p} href={storageUrl(p)} target="_blank" rel="noreferrer">
                          <img src={storageUrl(p)} alt="" className="h-16 w-16 rounded border object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Detail label="Subcon response">{c.subcon_response || <span className="text-gray-400">No response yet</span>}</Detail>
                  {c.responded_at && <Detail label="Responded">{dayjs(c.responded_at).format('DD MMM YYYY, h:mm A')}{c.responded_by ? ` by ${c.responded_by}` : ''}</Detail>}
                  {c.return_reason && <Detail label="Returned because"><span className="text-amber-700">{c.return_reason}</span></Detail>}
                </div>
              </div>
            )}
          </div>
        );
      })}
      {!rows.length && <EmptyState>No case matches this filter.</EmptyState>}
    </div>
  );
};

export const InductionTab = ({ induction }) => {
  const [open, setOpen] = useState(null);
  const pct = induction.total ? Math.round((induction.done / induction.total) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-md shadow-gray-200/60">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-gray-800">{induction.done} of {induction.total} topics acknowledged</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${induction.complete ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
            {induction.complete ? 'Complete, company active' : 'Incomplete, company inactive'}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
          <div className={`h-full ${induction.complete ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
      {induction.topics.length ? (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-md shadow-gray-200/60">
          {induction.topics.map((t, n) => (
            <div key={t.id}>
              <button type="button" onClick={() => setOpen(open === t.id ? null : t.id)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${t.acked ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {t.acked ? (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  ) : n + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-800">{t.title}</span>
                <span className={`text-xs ${t.acked ? 'text-green-700' : 'text-gray-500'}`}>
                  {t.acked ? `Acknowledged${t.acknowledged_at ? ' ' + fmtDate(t.acknowledged_at) : ''}` : 'Pending'}
                </span>
              </button>
              {open === t.id && (
                <div className="space-y-1.5 bg-gray-50 px-4 py-3 text-sm text-gray-700 md:px-14">
                  {t.items.map((it, k) => it.type === 'subheading' ? <div key={k} className="pt-1 font-semibold text-gray-800">{it.content}</div>
                    : it.type === 'bullet' ? <div key={k} className="pl-3">&bull; {it.content}</div>
                    : it.type === 'highlight' ? <div key={k} className="rounded bg-amber-50 px-2 py-1 text-amber-900">{it.content}</div>
                    : <p key={k}>{it.content}</p>)}
                  {!t.items.length && <span className="text-gray-400">No content.</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : <EmptyState>No Safety Passport rules configured.</EmptyState>}
    </div>
  );
};

export const MachineryTab = ({ machinery }) => {
  if (!machinery.length) return <EmptyState>No machinery registered by this subcontractor.</EmptyState>;
  return (
    <div className="overflow-x-auto rounded-3xl border border-gray-200 bg-white shadow-md shadow-gray-200/60">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-b from-gray-50 to-white">
          <tr>
            {['#', 'Machinery', 'Plate / Serial No.', 'Operator', 'CF Expiry', 'Certificate'].map(h => (
              <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {machinery.map((m, n) => (
            <tr key={m.id} className="hover:bg-gray-50">
              <td className="px-6 py-3 text-sm text-gray-500">{n + 1}</td>
              <td className="px-6 py-3 text-sm font-medium text-gray-800">{m.name}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{m.identifier || '-'}</td>
              <td className="px-6 py-3 text-sm text-gray-600">{m.operator_name || '-'}</td>
              <td className="whitespace-nowrap px-6 py-3 text-sm"><ExpiryBadge date={m.cf_expiry} /></td>
              <td className="px-6 py-3 text-sm">
                {m.cf_url ? <a href={m.cf_url} target="_blank" rel="noreferrer" className={tableViewActionClass} title="View certificate" aria-label={`View certificate for ${m.name}`}><TableViewIcon /></a> : <span className="text-red-600">Not attached</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Read-only staff cards with contact and certifications; the card is highlighted by the staff status. */
export const StaffTab = ({ staff = [] }) => {
  const [q, setQ] = useState('');
  const rows = staff.filter(s => [s.code, s.name, s.role, s.email, s.contact].some(v => v?.toLowerCase().includes(q.toLowerCase())));

  if (!staff.length) return <EmptyState>No staff registered by this subcontractor.</EmptyState>;

  const row = (label, value) => (
    <>
      <dt className="text-gray-500">{label} :</dt>
      <dd className="min-w-0 break-words font-semibold text-gray-700">{value}</dd>
    </>
  );

  return (
    <div className="space-y-4">
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search staff..."
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm shadow-sm md:w-80" />

      <div className="grid gap-4 md:grid-cols-2">
        {rows.map(s => {
          const st = subconStatus(s.status || 'active');
          const waiting = s.status === 'pending' || s.supervisor_approved_at || s.manager_approved_at;
          return (
            <article key={s.id} className={`relative overflow-hidden rounded-3xl border p-5 ${st.tone.card}`}>
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-base font-extrabold text-brand-400">{(s.name || '?').charAt(0).toUpperCase()}</span>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-extrabold text-gray-900">{s.name}</div>
                  {s.code && <div className="truncate font-mono text-[11px] font-bold tracking-wide text-brand-800">{s.code}</div>}
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-2 gap-y-2 text-xs">
                {row('Role', s.role || '-')}
                {row('Status', <span className={`font-extrabold uppercase tracking-wide ${st.text}`}>{st.label}</span>)}
                {row('Safety passport', <span className={`font-extrabold uppercase tracking-wide ${s.is_safetypassport ? 'text-emerald-700' : 'text-rose-700'}`}>{s.is_safetypassport ? 'Yes' : 'No'}</span>)}
                {s.contact && row('Contact', <a href={`tel:${s.contact}`} className="text-blue-700">{s.contact}</a>)}
                {s.email && row('Email', s.email)}
                {waiting && row('Approval',
                  <span title={`Supervisor: ${s.supervisor_approved_at ? `${s.supervisor_approved_name || 'approved'} ${String(s.supervisor_approved_at).slice(0, 10)}` : 'waiting'} | Manager: ${s.manager_approved_at ? `${s.manager_approved_name || 'approved'} ${String(s.manager_approved_at).slice(0, 10)}` : 'waiting'}`}>
                    Supervisor <b className={s.supervisor_approved_at ? 'text-emerald-700' : 'text-amber-700'}>{s.supervisor_approved_at ? '✓' : '…'}</b>
                    {' · '}Manager <b className={s.manager_approved_at ? 'text-emerald-700' : 'text-amber-700'}>{s.manager_approved_at ? '✓' : '…'}</b>
                  </span>)}
              </dl>

              {s.certifications?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5 border-t border-gray-100 pt-3">
                  {s.certifications.map(c => (
                    <a key={c.id} href={c.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-blue-700 hover:bg-blue-50">
                      {c.title} <ExpiryBadge date={c.expiry_date} />
                    </a>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
      {!rows.length && <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">No staff match your search.</div>}
    </div>
  );
};
/** Tab content for everything except staff (pass staffPanel to replace the read-only list). */
export const SubconPanels = ({ tab, staff, machinery = [], cases = [], attendance = [], induction, staffPanel = null }) => (
  <>
    {tab === 'staff' && (staffPanel || <StaffTab staff={staff} />)}
    {tab === 'attendance' && <AttendanceTab attendance={attendance} />}
    {tab === 'cases' && <CasesTab cases={cases} />}
    {tab === 'induction' && <InductionTab induction={induction} />}
    {tab === 'machinery' && <MachineryTab machinery={machinery} />}
  </>
);

const NO_INDUCTION = { topics: [], total: 0, done: 0, complete: false };

/** Summary cards, tab bar and tab content in one block. */
export default function SubconDetail({ staff = [], machinery = [], cases = [], attendance = [], induction = NO_INDUCTION, staffPanel = null, initialTab = 'staff' }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <div>
      <SubconSummary staff={staff} machinery={machinery} cases={cases} attendance={attendance} induction={induction} onSelect={setTab} />
      <SubconTabs tab={tab} onChange={setTab} counts={subconCounts({ staff, machinery, cases, attendance, induction })} />
      <SubconPanels tab={tab} staff={staff} machinery={machinery} cases={cases} attendance={attendance} induction={induction} staffPanel={staffPanel} />
    </div>
  );
}

export const subconCounts = ({ staff = [], machinery = [], cases = [], attendance = [], induction = NO_INDUCTION }) => ({
  staff: staff.length,
  attendance: attendance.length,
  cases: cases.filter(c => c.state !== 'closed').length,
  induction: `${induction.done}/${induction.total}`,
  machinery: machinery.length,
});
