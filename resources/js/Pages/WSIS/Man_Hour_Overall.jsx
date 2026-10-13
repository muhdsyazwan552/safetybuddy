import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Bar, BarChart, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AppLayout from '@/Pages/WSIS/Layout';

const COLORS = ['#F7D31A', '#12171E', '#CA8A04', '#16a34a', '#e11d48', '#0891b2', '#f97316', '#6B7787'];
const MONTHS = [['01', 'January'], ['02', 'February'], ['03', 'March'], ['04', 'April'], ['05', 'May'], ['06', 'June'], ['07', 'July'], ['08', 'August'], ['09', 'September'], ['10', 'October'], ['11', 'November'], ['12', 'December']];
const format = (value) => new Intl.NumberFormat('en-MY', { maximumFractionDigits: 2 }).format(value || 0);
const EmptyChart = () => <div className="flex h-full items-center justify-center text-sm text-slate-400">No manhour data for this period.</div>;

export default function ManHourOverall({ title = 'Overall Manhours', entries = [] }) {
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const years = useMemo(() => [...new Set(entries.map((entry) => entry.work_date.slice(0, 4)))].sort().reverse(), [entries]);
  const filtered = useMemo(() => entries.filter((entry) => (!year || entry.work_date.startsWith(year)) && (!month || entry.work_date.slice(5, 7) === month)), [entries, year, month]);
  const period = `${month ? MONTHS.find(([value]) => value === month)?.[1] : 'All months'} ${year || 'all years'}`;
  const chartYear = year || years[0] || new Date().getFullYear().toString();

  const companyData = useMemo(() => {
    const totals = {};
    filtered.forEach((entry) => {
      const company = entry.subcontractor_name || 'Unassigned subcontractor';
      totals[company] = (totals[company] || 0) + Number(entry.manhours);
    });
    return Object.entries(totals).map(([company, manhours]) => ({ company, manhours })).sort((a, b) => b.manhours - a.manhours);
  }, [filtered]);

  const yearlyCompanyNames = useMemo(() => [...new Set(entries
    .filter((entry) => entry.work_date.startsWith(chartYear))
    .map((entry) => entry.subcontractor_name || 'Unassigned subcontractor'))].sort(), [entries, chartYear]);

  const yearlyMonthlyData = useMemo(() => {
    let cumulative = 0;
    return MONTHS.map(([monthNumber, monthName]) => {
      const row = { month: monthName.slice(0, 3) };
      yearlyCompanyNames.forEach((company) => { row[company] = 0; });
      entries.filter((entry) => entry.work_date.startsWith(`${chartYear}-${monthNumber}`)).forEach((entry) => {
        const company = entry.subcontractor_name || 'Unassigned subcontractor';
        row[company] = (row[company] || 0) + Number(entry.manhours);
      });
      const monthlyTotal = yearlyCompanyNames.reduce((total, company) => total + row[company], 0);
      cumulative += monthlyTotal;
      row.cumulative = cumulative;
      return row;
    });
  }, [entries, chartYear, yearlyCompanyNames]);

  const yearlyCompanyData = useMemo(() => yearlyCompanyNames.map((company) => ({
    company,
    manhours: yearlyMonthlyData.reduce((total, row) => total + Number(row[company] || 0), 0),
  })), [yearlyCompanyNames, yearlyMonthlyData]);

  const yearlyTableData = useMemo(() => {
    let cumulative = 0;
    return MONTHS.map(([monthNumber, monthName]) => {
      const row = { month: `${monthName.slice(0, 3)}-${chartYear.slice(-2)}`, workforce: {}, manhours: {} };
      yearlyCompanyNames.forEach((company) => { row.workforce[company] = 0; row.manhours[company] = 0; });
      entries.filter((entry) => entry.work_date.startsWith(`${chartYear}-${monthNumber}`)).forEach((entry) => {
        const company = entry.subcontractor_name || 'Unassigned subcontractor';
        row.workforce[company] = (row.workforce[company] || 0) + Number(entry.worker_count);
        row.manhours[company] = (row.manhours[company] || 0) + Number(entry.manhours);
      });
      row.totalWorkforce = yearlyCompanyNames.reduce((total, company) => total + row.workforce[company], 0);
      row.totalManhours = yearlyCompanyNames.reduce((total, company) => total + row.manhours[company], 0);
      cumulative += row.totalManhours;
      row.cumulative = cumulative;
      return row;
    });
  }, [entries, chartYear, yearlyCompanyNames]);

  const tableTotals = useMemo(() => ({
    workforce: Object.fromEntries(yearlyCompanyNames.map((company) => [company, yearlyTableData.reduce((total, row) => total + row.workforce[company], 0)])),
    manhours: Object.fromEntries(yearlyCompanyNames.map((company) => [company, yearlyTableData.reduce((total, row) => total + row.manhours[company], 0)])),
    totalWorkforce: yearlyTableData.reduce((total, row) => total + row.totalWorkforce, 0),
    totalManhours: yearlyTableData.reduce((total, row) => total + row.totalManhours, 0),
  }), [yearlyCompanyNames, yearlyTableData]);

  const totalManhours = filtered.reduce((total, entry) => total + Number(entry.manhours), 0);
  const totalWorkers = filtered.reduce((total, entry) => total + Number(entry.worker_count), 0);

  return (
    <AppLayout>
      <Head title={title} />
      <div className="space-y-6 p-4 sm:p-6">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Safety performance</p><h1 className="mt-1 text-2xl font-bold text-slate-800">{title}</h1><p className="mt-1 text-sm text-slate-500">Combined manhours for every subcontractor company and project.</p></div>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm"><Link href="/man-hour" className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Company view</Link><Link href="/man-hour/overall" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Overall view</Link></div>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-800">All-company report</h2><p className="text-sm text-slate-500">Choose the reporting date period.</p></div><div className="flex flex-col gap-2 sm:flex-row"><select value={year} onChange={(e) => setYear(e.target.value)} className="rounded-md border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600"><option value="">All years</option>{years.map((item) => <option key={item} value={item}>{item}</option>)}</select><select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-md border-slate-300 text-sm focus:border-blue-600 focus:ring-blue-600"><option value="">All months</option>{MONTHS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div></div>
        </section>

        <div className="grid gap-4 sm:grid-cols-3"><Metric label="Total manhours" value={`${format(totalManhours)} hrs`} /><Metric label="Recorded workforce" value={format(totalWorkers)} /><Metric label="Companies recorded" value={format(companyData.length)} /></div>
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="font-bold text-slate-800">Total manhours by company</h2><p className="text-sm text-slate-500">{period}. Each company is shown in a different colour.</p></div><div className="h-80">{companyData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={companyData} margin={{ top: 10, right: 12, left: -15, bottom: 46 }}><XAxis dataKey="company" interval={0} angle={-25} textAnchor="end" tick={{ fontSize: 12 }} /><YAxis /><Tooltip formatter={(value) => [`${format(value)} hrs`, 'Manhours']} /><Bar dataKey="manhours" radius={[4, 4, 0, 0]}>{companyData.map((item, index) => <Cell key={item.company} fill={COLORS[index % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer> : <EmptyChart />}</div></section>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="font-bold text-slate-800">Cumulative Manhours Breakdown {chartYear}</h2><p className="text-sm text-slate-500">Full-year manhours split by company.</p></div><div className="h-80">{yearlyCompanyData.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={yearlyCompanyData} dataKey="manhours" nameKey="company" cx="50%" cy="46%" outerRadius="65%" label={({ percent }) => `${Math.round(percent * 100)}%`}>{yearlyCompanyData.map((item, index) => <Cell key={item.company} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => [`${format(value)} hrs`, 'Manhours']} /><Legend verticalAlign="bottom" height={44} /></PieChart></ResponsiveContainer> : <EmptyChart />}</div></section>
        </div>
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h2 className="font-bold text-slate-800">Year {chartYear} · Workforce & Manhours Monitoring</h2><p className="text-sm text-slate-500">January to December totals by company, based on saved daily manhour records.</p></div><div className="overflow-x-auto"><table className="min-w-max w-full border-collapse text-xs"><thead className="bg-slate-50 text-slate-700"><tr><th className="border border-slate-300 px-3 py-2">Year</th><th className="border border-slate-300 px-3 py-2">Month</th><th colSpan={yearlyCompanyNames.length + 1} className="border border-slate-300 px-3 py-2 text-center">Workforce (Attendance) Monitoring</th><th colSpan={yearlyCompanyNames.length + 2} className="border border-slate-300 px-3 py-2 text-center">Manhours</th></tr><tr><th className="border border-slate-300 px-3 py-2">{chartYear}</th><th className="border border-slate-300 px-3 py-2" />{yearlyCompanyNames.map((company) => <th key={`work-${company}`} className="border border-slate-300 px-3 py-2">{company}</th>)}<th className="border border-slate-300 px-3 py-2">Total Workforce</th>{yearlyCompanyNames.map((company) => <th key={`hour-${company}`} className="border border-slate-300 px-3 py-2">{company}</th>)}<th className="border border-slate-300 px-3 py-2">Total Manhours</th><th className="border border-slate-300 px-3 py-2">Cumulative</th></tr></thead><tbody>{yearlyTableData.map((row) => <tr key={row.month} className="text-right hover:bg-slate-50"><td className="border border-slate-200 px-3 py-2 text-center text-slate-400">{chartYear}</td><td className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-700">{row.month}</td>{yearlyCompanyNames.map((company) => <td key={`work-${row.month}-${company}`} className="border border-slate-200 px-3 py-2">{format(row.workforce[company])}</td>)}<td className="border border-slate-200 px-3 py-2 font-semibold">{format(row.totalWorkforce)}</td>{yearlyCompanyNames.map((company) => <td key={`hour-${row.month}-${company}`} className="border border-slate-200 px-3 py-2">{format(row.manhours[company])}</td>)}<td className="border border-slate-200 px-3 py-2 font-semibold">{format(row.totalManhours)}</td><td className="border border-slate-200 px-3 py-2 font-semibold">{format(row.cumulative)}</td></tr>)}</tbody><tfoot className="bg-slate-100 font-bold text-slate-800"><tr><td colSpan="2" className="border border-slate-300 px-3 py-2 text-right">TOTAL</td>{yearlyCompanyNames.map((company) => <td key={`total-work-${company}`} className="border border-slate-300 px-3 py-2 text-right">{format(tableTotals.workforce[company])}</td>)}<td className="border border-slate-300 px-3 py-2 text-right">{format(tableTotals.totalWorkforce)}</td>{yearlyCompanyNames.map((company) => <td key={`total-hour-${company}`} className="border border-slate-300 px-3 py-2 text-right">{format(tableTotals.manhours[company])}</td>)}<td className="border border-slate-300 px-3 py-2 text-right">{format(tableTotals.totalManhours)}</td><td className="border border-slate-300 px-3 py-2 text-right">{format(tableTotals.totalManhours)}</td></tr></tfoot></table></div></section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4"><h2 className="font-bold text-slate-800">Year {chartYear} · Total Manhours</h2><p className="text-sm text-slate-500">January to December. Stacked company manhours with a cumulative total line.</p></div><div className="h-80">{yearlyCompanyNames.length ? <ResponsiveContainer width="100%" height="100%"><ComposedChart data={yearlyMonthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 8 }}><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis yAxisId="manhours" tickFormatter={(value) => format(value)} /><YAxis yAxisId="cumulative" orientation="right" tickFormatter={(value) => format(value)} /><Tooltip formatter={(value, name) => [name === 'Cumulative manhours' ? `${format(value)} hrs` : `${format(value)} hrs`, name]} /><Legend verticalAlign="bottom" height={34} />{yearlyCompanyNames.map((company, index) => <Bar key={company} yAxisId="manhours" dataKey={company} stackId="manhours" fill={COLORS[index % COLORS.length]} />)}<Line yAxisId="cumulative" type="monotone" dataKey="cumulative" name="Cumulative manhours" stroke="#111827" strokeWidth={2} dot={false} /></ComposedChart></ResponsiveContainer> : <EmptyChart />}</div></section>
      </div>
    </AppLayout>
  );
}

function Metric({ label, value }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-slate-800">{value}</p></div>;
}
