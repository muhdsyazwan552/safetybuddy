// Everything about one subcontractor company - staff, daily attendance, NC / CC,
// Safety Passport and machinery. Shared by the admin, review and inspector portals;
// the data comes from App\Support\SubconDetail.
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { storageUrl } from '@/Components/inspector/kit';
import TableViewIcon, { tableViewActionClass } from '@/Components/shared/TableViewIcon';

const fmtDate = (d) => (d ? dayjs(d).format('DD MMM YYYY') : '-');

export const ExpiryBadge = ({ date }) => {
  if (!date) return <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">No expiry</span>;
  const days = dayjs(date).startOf('day').diff(dayjs().startOf('day'), 'day');
  const cls = days < 0 ? 'bg-red-100 text-red-700' : days <= 30 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800';
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{days < 0 ? 'Expired' : 'Exp'} {fmtDate(date)}</span>;
};

const EmptyState = ({ children }) => (
  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-sm text-gray-500">{children}</div>
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
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
      {cards.map(c => (
        <button key={c.key} type="button" onClick={() => onSelect(c.key)}
          className="rounded-lg border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow">
          <div className="text-xs font-medium uppercase tracking-wider text-gray-500">{c.label}</div>
          <div className="mt-1 text-2xl font-bold text-gray-800">{c.value}</div>
          <div className={`mt-0.5 text-xs ${c.alert ? 'font-semibold text-red-600' : 'text-gray-500'}`}>{c.sub}</div>
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
    <div className="mb-6 flex gap-1 overflow-x-auto border-b border-gray-200">
      {tabs.map(([key, label]) => (
        <button key={key} type="button" onClick={() => onChange(key)}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
            tab === key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}>
          {label}
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${tab === key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{counts[key]}</span>
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
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
          <thead className="bg-gray-50">
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
          <div key={c.key} className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <button type="button" onClick={() => setOpen(expanded ? null : c.key)} className="flex w-full flex-col gap-2 p-4 text-left md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold ${c.type === 'nc' ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'}`}>
                  {c.type === 'nc' ? 'NC' : 'CC'} #{c.id}
                </span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{i.topic || 'Inspection finding'}</div>
                  <div className="text-xs text-gray-500">{i.project || '-'}{i.location ? ` · ${i.location}` : ''} · Opened {fmtDate(c.date_open || c.created_at)}</div>
                </div>
              </div>
              <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-semibold md:self-center ${cls}`}>{label}</span>
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
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
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
        <div className="divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
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
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
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

/** Read-only staff list with contact and certifications. */
export const StaffTab = ({ staff = [] }) => {
  const [q, setQ] = useState('');
  const rows = staff.filter(s => [s.code, s.name, s.role, s.email, s.contact].some(v => v?.toLowerCase().includes(q.toLowerCase())));

  if (!staff.length) return <EmptyState>No staff registered by this subcontractor.</EmptyState>;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-4">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search staff..."
          className="w-full rounded border border-gray-300 px-3 py-1.5 text-sm md:w-64" />
      </div>
      <ul className="divide-y divide-gray-100">
        {rows.map(s => (
          <li key={s.id} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">{(s.name || '?').charAt(0).toUpperCase()}</span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-900">{s.name}</div>
                {s.code && <div className="truncate text-xs font-semibold text-gray-500">{s.code}</div>}
                <div className="truncate text-xs text-gray-500">
                  {s.role || '-'}{s.contact ? <> &middot; <a href={`tel:${s.contact}`} className="text-blue-600">{s.contact}</a></> : null}{s.email ? ` · ${s.email}` : ''}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
              {s.certifications?.map(c => (
                <a key={c.id} href={c.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-50">
                  {c.title} <ExpiryBadge date={c.expiry_date} />
                </a>
              ))}
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${s.is_safetypassport ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>Passport {s.is_safetypassport ? 'Yes' : 'No'}</span>
              {(s.status === 'pending' || s.supervisor_approved_at || s.manager_approved_at) && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"
                  title={`Supervisor: ${s.supervisor_approved_at ? `${s.supervisor_approved_name || 'approved'} ${String(s.supervisor_approved_at).slice(0, 10)}` : 'waiting'} | Manager: ${s.manager_approved_at ? `${s.manager_approved_name || 'approved'} ${String(s.manager_approved_at).slice(0, 10)}` : 'waiting'}`}>
                  Sup {s.supervisor_approved_at ? '✓' : '…'} · Mgr {s.manager_approved_at ? '✓' : '…'}
                </span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${(s.status || 'active') === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{s.status || 'active'}</span>
            </div>
          </li>
        ))}
        {!rows.length && <li className="p-6 text-center text-sm text-gray-500">No staff match your search.</li>}
      </ul>
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
