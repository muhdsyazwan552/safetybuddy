import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppLayout from '@/Pages/WSIS/Layout';

const today = new Date().toISOString().slice(0, 10);

const number = (value, options = {}) => new Intl.NumberFormat('en-MY', {
  maximumFractionDigits: 2,
  ...options,
}).format(value || 0);

const formatDate = (date) => new Intl.DateTimeFormat('en-MY', {
  day: '2-digit', month: 'short', year: 'numeric',
}).format(new Date(`${date}T00:00:00`));

const CHART_COLORS = ['#F7D31A', '#12171E', '#CA8A04', '#16a34a', '#e11d48', '#0891b2', '#f97316', '#6B7787'];
const MONTHS = [
  ['01', 'January'], ['02', 'February'], ['03', 'March'], ['04', 'April'], ['05', 'May'], ['06', 'June'],
  ['07', 'July'], ['08', 'August'], ['09', 'September'], ['10', 'October'], ['11', 'November'], ['12', 'December'],
];

const ManHour = ({ title = 'Manhours & Incident', projects = [], entries = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [subcontractors, setSubcontractors] = useState([]);
  const [loadingSubcontractors, setLoadingSubcontractors] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    project_id: '',
    subcon_company_id: '',
    work_date: today,
    worker_count: '',
    working_hours: '8',
  });

  useEffect(() => {
    if (!data.project_id) {
      setSubcontractors([]);
      return;
    }

    setLoadingSubcontractors(true);
    fetch(`/man-hour/projects/${data.project_id}/subcontractors`)
      .then((response) => response.ok ? response.json() : Promise.reject(response))
      .then((json) => {
        setSubcontractors(json.subcontractors || []);
        setData('subcon_company_id', '');
      })
      .catch(() => setSubcontractors([]))
      .finally(() => setLoadingSubcontractors(false));
  }, [data.project_id]);

  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const text = `${entry.project_name || ''} ${entry.subcontractor_name || ''} ${entry.work_date}`.toLowerCase();
    return text.includes(search.toLowerCase())
      && (!selectedYear || entry.work_date.startsWith(selectedYear))
      && (!selectedMonth || entry.work_date.slice(5, 7) === selectedMonth)
      && (!selectedCompany || entry.subcontractor_name === selectedCompany);
  }), [entries, search, selectedYear, selectedMonth, selectedCompany]);
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const visibleEntries = filteredEntries.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => setPage(1), [search, selectedYear, selectedMonth, selectedCompany, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const years = useMemo(() => [...new Set(entries.map((entry) => entry.work_date.slice(0, 4)))].sort().reverse(), [entries]);
  const chartPeriod = `${selectedMonth ? MONTHS.find(([value]) => value === selectedMonth)?.[1] : 'All months'} ${selectedYear || 'all years'}`;
  const companies = useMemo(() => [...new Set(entries.map((entry) => entry.subcontractor_name).filter(Boolean))].sort(), [entries]);
  const availableMonths = useMemo(() => [...new Set(entries.map((entry) => entry.work_date.slice(0, 7)))].sort().reverse(), [entries]);
  const fallbackMonth = availableMonths.find((item) => !selectedYear || item.startsWith(selectedYear)) || availableMonths[0] || today.slice(0, 7);
  const reportYear = selectedYear || fallbackMonth.slice(0, 4);
  const reportMonth = selectedMonth || fallbackMonth.slice(5, 7);
  const reportMonthKey = `${reportYear}-${reportMonth}`;

  const stats = useMemo(() => ({
    manhours: filteredEntries.reduce((total, entry) => total + Number(entry.manhours), 0),
    workforce: filteredEntries.reduce((total, entry) => total + Number(entry.worker_count), 0),
    activeDays: new Set(filteredEntries.map((entry) => entry.work_date)).size,
    projects: new Set(filteredEntries.map((entry) => entry.project_name).filter(Boolean)).size,
  }), [filteredEntries]);

  // Entries store a headcount rather than individual worker identities. For each
  // project, combine the subcontractor headcounts per date, then average its active days.
  const projectWorkforceData = useMemo(() => {
    const projectsByDate = {};
    filteredEntries.forEach((entry) => {
      const key = entry.project_name || 'Unassigned project';
      projectsByDate[key] ??= {};
      projectsByDate[key][entry.work_date] = (projectsByDate[key][entry.work_date] || 0) + Number(entry.worker_count);
    });
    return Object.entries(projectsByDate)
      .map(([project, dates]) => {
        const dailyCounts = Object.values(dates);
        return { project, workers: Math.round(dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length), activeDays: dailyCounts.length };
      })
      .sort((a, b) => b.workers - a.workers);
  }, [filteredEntries]);

  const cumulativeBreakdown = useMemo(() => {
    const totals = {};
    filteredEntries.forEach((entry) => {
      const key = entry.project_name || 'Unassigned project';
      totals[key] = (totals[key] || 0) + Number(entry.manhours);
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredEntries]);

  const monthlyProjectNames = useMemo(() => [...new Set(entries
    .filter((entry) => entry.work_date.startsWith(reportMonthKey) && (!selectedCompany || entry.subcontractor_name === selectedCompany))
    .map((entry) => entry.project_name || 'Unassigned project'))].sort(), [entries, reportMonthKey, selectedCompany]);

  const monthlyTableData = useMemo(() => {
    const daysInMonth = new Date(Number(reportYear), Number(reportMonth), 0).getDate();
    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = `${reportMonthKey}-${String(day).padStart(2, '0')}`;
      const row = { day, date, projects: {} };
      monthlyProjectNames.forEach((project) => { row.projects[project] = { workers: 0, manhours: 0 }; });
      entries.filter((entry) => entry.work_date === date && (!selectedCompany || entry.subcontractor_name === selectedCompany)).forEach((entry) => {
        const project = entry.project_name || 'Unassigned project';
        row.projects[project] ??= { workers: 0, manhours: 0 };
        row.projects[project].workers += Number(entry.worker_count);
        row.projects[project].manhours += Number(entry.manhours);
      });
      row.totalWorkers = Object.values(row.projects).reduce((total, project) => total + project.workers, 0);
      row.totalManhours = Object.values(row.projects).reduce((total, project) => total + project.manhours, 0);
      return row;
    });
  }, [entries, reportYear, reportMonth, reportMonthKey, selectedCompany, monthlyProjectNames]);

  const monthlyTableTotals = useMemo(() => ({
    projects: Object.fromEntries(monthlyProjectNames.map((project) => [project, {
      workers: monthlyTableData.reduce((total, row) => total + row.projects[project].workers, 0),
      manhours: monthlyTableData.reduce((total, row) => total + row.projects[project].manhours, 0),
    }])),
    workers: monthlyTableData.reduce((total, row) => total + row.totalWorkers, 0),
    manhours: monthlyTableData.reduce((total, row) => total + row.totalManhours, 0),
  }), [monthlyProjectNames, monthlyTableData]);

  const openModal = () => {
    reset();
    clearErrors();
    setSubcontractors([]);
    setStep(1);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!processing) setIsModalOpen(false);
  };

  const next = () => {
    if (step === 1 && data.project_id) setStep(2);
    if (step === 2 && data.subcon_company_id) setStep(3);
  };

  const save = (event) => {
    event.preventDefault();
    post(route('man.hour.store'), {
      onSuccess: () => {
        setIsModalOpen(false);
        setStep(1);
        reset();
      },
    });
  };

  return (
    <AppLayout>
      <Head title={title} />
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Safety performance</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-800">{title}</h1>
            <p className="mt-1 text-sm text-slate-500">Select one subcontractor company and a date period to review its workforce and manhours.</p>
          </div>
          <button onClick={openModal} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            <span className="text-lg leading-none">+</span> Add daily manhour
          </button>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <Link href="/man-hour" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Company view</Link>
          <Link href="/man-hour/overall" className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Overall view</Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Total manhours', `${number(stats.manhours)} hrs`, 'Workers × working hours'],
            ['Daily workforce', number(stats.workforce), 'Sum of recorded daily workers'],
            ['Active days', number(stats.activeDays), 'Dates with a manhour entry'],
            ['Projects recorded', number(stats.projects), 'In the selected results'],
          ].map(([label, value, detail]) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
              <p className="mt-1 text-xs text-slate-400">{detail}</p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-bold text-slate-800">Daily manhour records</h2>
              <p className="text-sm text-slate-500">Newest created records appear first. Saving again updates that day’s record.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded-md border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600" aria-label="Records per page"><option value={10}>10 per page</option><option value={25}>25 per page</option><option value={50}>50 per page</option></select>
              <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="rounded-md border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600" aria-label="Filter by year"><option value="">All years</option>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select>
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="rounded-md border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600" aria-label="Filter by month"><option value="">All months</option>{MONTHS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)} className="rounded-md border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600" aria-label="Filter by company"><option value="">All subcontractor companies</option>{companies.map((company) => <option key={company} value={company}>{company}</option>)}</select>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search project or subcontractor" className="rounded-md border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr><th className="px-4 py-3 w-12">#</th><th className="px-4 py-3">Work date</th><th className="px-4 py-3">Project</th><th className="px-4 py-3">Subcontractor</th><th className="px-4 py-3 text-right">Workers</th><th className="px-4 py-3 text-right">Hours / worker</th><th className="px-4 py-3 text-right">Total manhours</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visibleEntries.map((entry, rowNo) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70"><td className="whitespace-nowrap px-4 py-3 text-slate-500">{(page - 1) * pageSize + rowNo + 1}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(entry.work_date)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{entry.project_name || '—'}</td>
                    <td className="px-4 py-3">{entry.subcontractor_name || '—'}</td>
                    <td className="px-4 py-3 text-right">{number(entry.worker_count)}</td>
                    <td className="px-4 py-3 text-right">{number(entry.working_hours)} hrs</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">{number(entry.manhours)} hrs</td>
                  </tr>
                ))}
                {!filteredEntries.length && <tr><td colSpan="7" className="px-4 py-12 text-center text-slate-500">No manhour records match these filters. Add your first daily record to begin.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"><span>{filteredEntries.length ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredEntries.length)} of ${filteredEntries.length} records` : 'No records'}</span><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50">Previous</button><span className="text-xs">Page {page} of {totalPages}</span><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50">Next</button></div></div>
        </section>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="font-bold text-slate-800">{MONTHS.find(([value]) => value === reportMonth)?.[1]} {reportYear} · Daily project monitoring</h2>
            <p className="text-sm text-slate-500">{selectedCompany || 'All subcontractor companies'} · days 1 to {monthlyTableData.length}. Each project shows daily workers and manhours, with monthly totals at the bottom.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-max w-full border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-700">
                <tr><th rowSpan="2" className="border border-slate-300 px-3 py-2">Day</th>{monthlyProjectNames.map((project) => <th key={project} colSpan="2" className="border border-slate-300 px-3 py-2 text-center">{project}</th>)}<th colSpan="2" className="border border-slate-300 px-3 py-2 text-center">Daily total</th></tr>
                <tr>{monthlyProjectNames.flatMap((project) => [<th key={`${project}-workers`} className="border border-slate-300 px-3 py-2">Workers</th>, <th key={`${project}-hours`} className="border border-slate-300 px-3 py-2">Manhours</th>])}<th className="border border-slate-300 px-3 py-2">Workers</th><th className="border border-slate-300 px-3 py-2">Manhours</th></tr>
              </thead>
              <tbody>{monthlyTableData.map((row) => <tr key={row.date} className="text-right hover:bg-slate-50"><td className="border border-slate-200 px-3 py-2 text-center font-medium text-slate-700">{row.day}</td>{monthlyProjectNames.flatMap((project) => [<td key={`${row.date}-${project}-workers`} className="border border-slate-200 px-3 py-2">{number(row.projects[project].workers)}</td>, <td key={`${row.date}-${project}-hours`} className="border border-slate-200 px-3 py-2">{number(row.projects[project].manhours)}</td>])}<td className="border border-slate-200 px-3 py-2 font-semibold">{number(row.totalWorkers)}</td><td className="border border-slate-200 px-3 py-2 font-semibold">{number(row.totalManhours)}</td></tr>)}</tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-800"><tr><td className="border border-slate-300 px-3 py-2 text-right">MONTHLY TOTAL</td>{monthlyProjectNames.flatMap((project) => [<td key={`${project}-total-workers`} className="border border-slate-300 px-3 py-2 text-right">{number(monthlyTableTotals.projects[project].workers)}</td>, <td key={`${project}-total-hours`} className="border border-slate-300 px-3 py-2 text-right">{number(monthlyTableTotals.projects[project].manhours)}</td>])}<td className="border border-slate-300 px-3 py-2 text-right">{number(monthlyTableTotals.workers)}</td><td className="border border-slate-300 px-3 py-2 text-right">{number(monthlyTableTotals.manhours)}</td></tr></tfoot>
            </table>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4"><h2 className="font-bold text-slate-800">Average daily workers by project</h2><p className="text-sm text-slate-500">{chartPeriod}. Subcontractor headcounts are combined for each project day.</p></div>
            <div className="h-72">{projectWorkforceData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={projectWorkforceData} margin={{ top: 10, right: 12, left: -20, bottom: 36 }}><XAxis dataKey="project" interval={0} angle={-22} textAnchor="end" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} /><Tooltip formatter={(value) => [number(value), 'Average workers']} /><Bar dataKey="workers" name="Average workers" fill="#EAB308" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyChart />}</div>
          </section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4"><h2 className="font-bold text-slate-800">Cumulative manhours breakdown</h2><p className="text-sm text-slate-500">{chartPeriod}, grouped by project.</p></div>
            <div className="h-72">{cumulativeBreakdown.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={cumulativeBreakdown} dataKey="value" nameKey="name" cx="50%" cy="46%" outerRadius="70%" label={({ percent }) => `${Math.round(percent * 100)}%`}>{cumulativeBreakdown.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}</Pie><Tooltip formatter={(value) => [`${number(value)} hrs`, 'Manhours']} /><Legend verticalAlign="bottom" height={44} /></PieChart></ResponsiveContainer> : <EmptyChart />}</div>
          </section>
        </div>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={closeModal}>
          <form onSubmit={save} onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
              <div><h2 className="text-lg font-bold text-slate-800">Add daily manhour</h2><p className="mt-1 text-sm text-slate-500">Step {step} of 3</p></div>
              <button type="button" onClick={closeModal} className="text-xl leading-none text-slate-400 hover:text-slate-700" aria-label="Close">×</button>
            </div>
            <div className="flex px-6 pt-5">{['Project', 'Subcontractor', 'Work details'].map((label, index) => <div key={label} className="flex flex-1 items-center last:flex-none"><span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${step >= index + 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{index + 1}</span><span className={`ml-2 hidden text-xs font-semibold sm:inline ${step >= index + 1 ? 'text-blue-700' : 'text-slate-400'}`}>{label}</span>{index < 2 && <span className="mx-3 h-px flex-1 bg-slate-200" />}</div>)}</div>
            <div className="min-h-52 px-6 py-6">
              {step === 1 && <div><label className="mb-2 block text-sm font-semibold text-slate-700">Which project?</label><select value={data.project_id} onChange={(e) => setData('project_id', e.target.value)} className="w-full rounded-md border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600"><option value="">Select a project</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>{errors.project_id && <p className="mt-2 text-xs text-red-600">{errors.project_id}</p>}</div>}
              {step === 2 && <div><label className="mb-2 block text-sm font-semibold text-slate-700">Assigned subcontractor company</label>{loadingSubcontractors ? <p className="text-sm text-slate-500">Loading assigned companies…</p> : <><select value={data.subcon_company_id} onChange={(e) => setData('subcon_company_id', e.target.value)} className="w-full rounded-md border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600"><option value="">Select a subcontractor company</option>{subcontractors.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select>{!subcontractors.length && <p className="mt-2 text-xs text-amber-600">No subcontractor companies are assigned to this project.</p>}</>}{errors.subcon_company_id && <p className="mt-2 text-xs text-red-600">{errors.subcon_company_id}</p>}</div>}
              {step === 3 && <div className="grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className="mb-2 block text-sm font-semibold text-slate-700">Work date</label><input type="date" value={data.work_date} onChange={(e) => setData('work_date', e.target.value)} className="w-full rounded-md border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600" />{errors.work_date && <p className="mt-2 text-xs text-red-600">{errors.work_date}</p>}</div><div><label className="mb-2 block text-sm font-semibold text-slate-700">Total workers</label><input type="number" min="0" value={data.worker_count} onChange={(e) => setData('worker_count', e.target.value)} placeholder="e.g. 25" className="w-full rounded-md border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600" />{errors.worker_count && <p className="mt-2 text-xs text-red-600">{errors.worker_count}</p>}</div><div><label className="mb-2 block text-sm font-semibold text-slate-700">Working hours</label><input type="number" min="0" max="24" step="0.5" value={data.working_hours} onChange={(e) => setData('working_hours', e.target.value)} className="w-full rounded-md border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600" />{errors.working_hours && <p className="mt-2 text-xs text-red-600">{errors.working_hours}</p>}</div><div className="sm:col-span-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-800">Daily manhours: <strong>{number(Number(data.worker_count) * Number(data.working_hours))} hrs</strong></div></div>}
            </div>
            <div className="flex justify-between border-t border-slate-200 bg-slate-50 px-6 py-4"><button type="button" onClick={() => setStep((current) => Math.max(1, current - 1))} className={`rounded-md px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 ${step === 1 ? 'invisible' : ''}`}>Back</button>{step < 3 ? <button type="button" onClick={next} disabled={(step === 1 && !data.project_id) || (step === 2 && (!data.subcon_company_id || loadingSubcontractors))} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">Next</button> : <button type="submit" disabled={processing} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{processing ? 'Saving…' : 'Save manhour'}</button>}</div>
          </form>
        </div>
      )}
    </AppLayout>
  );
};

const EmptyChart = () => <div className="flex h-full items-center justify-center text-sm text-slate-400">No manhour data for this period.</div>;

export default ManHour;
