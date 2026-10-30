import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import TableViewIcon, { tableViewActionClass } from '@/Components/shared/TableViewIcon';
import SeriesCode from '@/Components/shared/SeriesCode';
import PdfButton from '@/Components/shared/PdfButton';
import ReviewProgress from '@/Components/shared/ReviewProgress';

// ─── Chart colours (consistent across all 4 charts) ────────────────────────
const CAT_COLORS = {
  fatality: '#EF4444',
  occup_health_complaint: '#F97316',
  lti: '#EAB308',
  first_aid_treatment: '#3B82F6',
  fire_cases: '#F43F5E',
  environmental_issue: '#22C55E',
  road_accident: '#A855F7',
};
const CAT_LABELS = {
  fatality: 'Fatality',
  occup_health_complaint: 'Occup. Health',
  lti: 'LTI (Lost Time)',
  first_aid_treatment: 'First Aid',
  fire_cases: 'Fire Cases',
  environmental_issue: 'Environmental',
  road_accident: 'Road Accident',
};
const CAT_KEYS = Object.keys(CAT_COLORS);

// ─── Helpers ────────────────────────────────────────────────────────────────
const MONTHS = [
  { value: '01', label: 'Jan' }, { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' }, { value: '04', label: 'Apr' },
  { value: '05', label: 'May' }, { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' }, { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' }, { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
];
const MONTH_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const getMonthLabel = (val) => MONTHS.find(m => m.value === val)?.label ?? val;
const getMonthFull = (val) => MONTH_FULL[parseInt(val, 10) - 1] ?? val;

// All months 01-12 in order
const ALL_MONTHS = MONTHS.map(m => m.value);

const statusBadge = (status) => {
  const map = {
    open: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500', label: 'Submitted' },
    'in progress': { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Reviewed' },
    inprogress: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500', label: 'Reviewed' },
    closed: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500', label: 'Approved' },
  };
  const s = map[(status ?? '').toLowerCase()] ?? { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400', label: status ?? '—' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

// ─── SVG Stacked Column Chart (all 12 months + overall, with number labels on top) ──
const StackedColumnChart = ({ monthlyData, totals }) => {
  const W = 900, H = 320, PAD = { top: 35, right: 20, bottom: 60, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Use all 12 months + OVERALL
  const displayMonths = [...ALL_MONTHS, 'OVERALL'];

  // Calculate totals for each month and overall
  const monthTotals = ALL_MONTHS.map(m => CAT_KEYS.reduce((s, k) => s + (monthlyData[m]?.[k] ?? 0), 0));
  const overallTotal = totals.total || 0;
  const allTotals = [...monthTotals, overallTotal];
  const maxVal = Math.max(1, ...allTotals);

  const barW = Math.min(45, (chartW / displayMonths.length) * 0.65);
  const step = chartW / displayMonths.length;

  const yTick = Math.ceil(maxVal / 5) || 1;
  const ticks = Array.from({ length: Math.ceil(maxVal / yTick) + 1 }, (_, i) => i * yTick);

  // Function to get stacked bars for a specific month or overall
  const getBarsForMonth = (month, isOverall = false) => {
    let row = {};
    if (isOverall) {
      CAT_KEYS.forEach(k => { row[k] = totals[k] ?? 0; });
    } else {
      row = monthlyData[month] ?? {};
    }
    return CAT_KEYS.map(k => ({ k, val: row[k] ?? 0 }));
  };

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[800px]">
        {/* Grid lines */}
        {ticks.map(t => {
          const y = PAD.top + chartH - (t / maxVal) * chartH;
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{t}</text>
            </g>
          );
        })}

        {/* Bars for each month */}
        {displayMonths.map((month, idx) => {
          const x = PAD.left + idx * step + (step / 2) - (barW / 2);
          const isOverall = month === 'OVERALL';
          const bars = getBarsForMonth(month, isOverall);
          let cumY = 0;
          const total = allTotals[idx];

          return (
            <g key={month}>
              {bars.map(({ k, val }) => {
                if (!val) return null;
                const bh = (val / maxVal) * chartH;
                const by = PAD.top + chartH - cumY - bh;
                cumY += bh;
                return (
                  <rect
                    key={k}
                    x={x}
                    y={by}
                    width={barW}
                    height={bh}
                    fill={CAT_COLORS[k]}
                    opacity="0.85"
                    rx="2"
                  />
                );
              })}
              {/* Total number on top of column */}
              {total > 0 && (
                <text
                  x={x + barW / 2}
                  y={PAD.top + chartH - (total / maxVal) * chartH - 5}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#374151"
                  fontWeight="bold"
                >
                  {total}
                </text>
              )}
              <text
                x={x + barW / 2}
                y={PAD.top + chartH + 18}
                textAnchor="middle"
                fontSize="10"
                fill={isOverall ? "#1f2937" : "#6b7280"}
                fontWeight={isOverall ? "bold" : "normal"}
              >
                {isOverall ? "OVERALL" : getMonthLabel(month)}
              </text>
            </g>
          );
        })}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke="#9ca3af" strokeWidth="1.5" />
        <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke="#9ca3af" strokeWidth="1.5" />

        {/* Y-axis label */}
        <text x="18" y={PAD.top + chartH / 2} textAnchor="middle" fontSize="11" fill="#6b7280" transform={`rotate(-90, 18, ${PAD.top + chartH / 2})`}>
          Number of Incidents
        </text>
      </svg>
    </div>
  );
};

// ─── SVG Line Chart (trendline showing total incidents over all 12 months) ──
const TrendLineChart = ({ monthlyData }) => {
  const W = 800, H = 240, PAD = { top: 25, right: 20, bottom: 55, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Get totals for all 12 months
  const monthTotals = ALL_MONTHS.map(m => CAT_KEYS.reduce((s, k) => s + (monthlyData[m]?.[k] ?? 0), 0));
  const maxVal = Math.max(1, ...monthTotals);
  const step = chartW / (ALL_MONTHS.length - 1);

  const points = ALL_MONTHS.map((m, i) => {
    const total = CAT_KEYS.reduce((s, k) => s + (monthlyData[m]?.[k] ?? 0), 0);
    return [PAD.left + i * step, PAD.top + chartH - (total / maxVal) * chartH];
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');

  const yTick = Math.ceil(maxVal / 5) || 1;
  const ticks = Array.from({ length: Math.ceil(maxVal / yTick) + 1 }, (_, i) => i * yTick);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[700px]">
        {ticks.map(t => {
          const y = PAD.top + chartH - (t / maxVal) * chartH;
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{t}</text>
            </g>
          );
        })}

        <path d={pathD} fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinejoin="round" />
        {points.map(([x, y], i) => {
          const total = monthTotals[i];
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4.5" fill="#3B82F6" stroke="white" strokeWidth="1.5" />
              {total > 0 && (
                <text x={x} y={y - 8} textAnchor="middle" fontSize="9" fill="#3B82F6" fontWeight="bold">
                  {total}
                </text>
              )}
            </g>
          );
        })}

        {ALL_MONTHS.map((m, i) => (
          <text key={m} x={PAD.left + i * step} y={PAD.top + chartH + 18}
            textAnchor="middle" fontSize="10" fill="#6b7280">{getMonthLabel(m)}</text>
        ))}

        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke="#d1d5db" strokeWidth="1.5" />
        <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke="#d1d5db" strokeWidth="1.5" />

        <text x="18" y={PAD.top + chartH / 2} textAnchor="middle" fontSize="11" fill="#6b7280" transform={`rotate(-90, 18, ${PAD.top + chartH / 2})`}>
          Number of Incidents
        </text>
      </svg>
    </div>
  );
};

// ─── Advanced SVG Pie Chart (handles 1 item gracefully) ─────────────────────
const PieChart = ({ totals }) => {
  const total = CAT_KEYS.reduce((s, k) => s + (totals[k] ?? 0), 0);

  if (!total) {
    return (
      <div className="flex items-center justify-center h-56 text-gray-400 text-sm">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No Data</p>
        </div>
      </div>
    );
  }

  const CX = 110, CY = 110, R = 85;
  let angle = -Math.PI / 2;

  // Filter categories with values > 0
  const activeCategories = CAT_KEYS.filter(k => (totals[k] ?? 0) > 0);

  // For single category, just draw a full circle
  if (activeCategories.length === 1) {
    const k = activeCategories[0];
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <svg viewBox="0 0 220 220" className="w-full h-auto">
          <circle cx={CX} cy={CY} r={R} fill={CAT_COLORS[k]} opacity="0.88" stroke="white" strokeWidth="2" />
          <text x={CX} y={CY + 5} textAnchor="middle" fontSize="14" fill="white" fontWeight="bold">
            {Math.round((totals[k] / total) * 100)}%
          </text>
        </svg>
      </div>
    );
  }

  // Multiple categories - draw pie slices
  const slices = activeCategories.map(k => {
    const val = totals[k] ?? 0;
    const frac = val / total;
    const a1 = angle;
    const a2 = angle + frac * 2 * Math.PI;
    angle = a2;

    // Calculate label position (middle of slice)
    const midAngle = (a1 + a2) / 2;
    const labelRadius = R * 0.65;
    const lx = CX + labelRadius * Math.cos(midAngle);
    const ly = CY + labelRadius * Math.sin(midAngle);

    return { k, val, frac, a1, a2, lx, ly };
  });

  const arc = ({ a1, a2 }) => {
    const x1 = CX + R * Math.cos(a1);
    const y1 = CY + R * Math.sin(a1);
    const x2 = CX + R * Math.cos(a2);
    const y2 = CY + R * Math.sin(a2);
    const largeArcFlag = a2 - a1 > Math.PI ? 1 : 0;
    return `M${CX},${CY} L${x1},${y1} A${R},${R},0,${largeArcFlag},1,${x2},${y2} Z`;
  };

  return (
    <svg viewBox="0 0 220 220" className="w-full h-auto drop-shadow-sm">
      <defs>
        {slices.map((s, i) => (
          <filter key={`shadow-${i}`} id={`shadow-${i}`}>
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.15" />
          </filter>
        ))}
      </defs>
      {slices.map((s, i) => (
        <g key={s.k}>
          <path
            d={arc(s)}
            fill={CAT_COLORS[s.k]}
            opacity="0.9"
            stroke="white"
            strokeWidth="2"
            filter={`url(#shadow-${i})`}
            className="transition-all duration-300 hover:opacity-100 cursor-pointer"
          />
          {s.frac > 0.08 && (
            <text
              x={s.lx}
              y={s.ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="11"
              fill="white"
              fontWeight="bold"
              className="drop-shadow-sm"
            >
              {Math.round(s.frac * 100)}%
            </text>
          )}
        </g>
      ))}
      {/* Inner circle for donut effect */}
      <circle cx={CX} cy={CY} r={R * 0.35} fill="white" opacity="0.95" />
    </svg>
  );
};

// ─── SVG Grouped Bar Chart (by category per all 12 months) ──────────────────
const GroupedBarChart = ({ monthlyData }) => {
  const W = 900, H = 280, PAD = { top: 25, right: 20, bottom: 60, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // For each category, get values for all 12 months
  const catData = CAT_KEYS.map(k => ({
    k,
    vals: ALL_MONTHS.map(m => ({ m, v: monthlyData[m]?.[k] ?? 0 })),
  }));

  const maxVal = Math.max(1, ...catData.flatMap(c => c.vals.map(v => v.v)));
  const groupW = chartW / CAT_KEYS.length;
  const barW = Math.min(12, (groupW / ALL_MONTHS.length) * 0.65);
  const yTick = Math.ceil(maxVal / 5) || 1;
  const ticks = Array.from({ length: Math.ceil(maxVal / yTick) + 1 }, (_, i) => i * yTick);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto min-w-[800px]">
        {ticks.map(t => {
          const y = PAD.top + chartH - (t / maxVal) * chartH;
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={PAD.left + chartW} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">{t}</text>
            </g>
          );
        })}

        {catData.map((cat, ci) => {
          const gx = PAD.left + ci * groupW;
          const totalBars = ALL_MONTHS.length;
          return (
            <g key={cat.k}>
              {cat.vals.map(({ m, v }, mi) => {
                const bh = (v / maxVal) * chartH;
                const by = PAD.top + chartH - bh;
                const bx = gx + (groupW - totalBars * barW) / 2 + mi * barW;
                const opacity = 0.5 + (mi / (totalBars - 1)) * 0.5;
                return v > 0 ? (
                  <rect key={m} x={bx} y={by} width={barW} height={bh}
                    fill={CAT_COLORS[cat.k]} opacity={opacity} rx="1" />
                ) : null;
              })}
              <text x={gx + groupW / 2} y={PAD.top + chartH + 18}
                textAnchor="middle" fontSize="8.5" fill="#6b7280">
                {CAT_LABELS[cat.k].split(' ').map((w, i) => (
                  <tspan key={i} x={gx + groupW / 2} dy={i === 0 ? 0 : 10}>{w}</tspan>
                ))}
              </text>
            </g>
          );
        })}

        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke="#d1d5db" strokeWidth="1.5" />
        <line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke="#d1d5db" strokeWidth="1.5" />

        <text x="18" y={PAD.top + chartH / 2} textAnchor="middle" fontSize="11" fill="#6b7280" transform={`rotate(-90, 18, ${PAD.top + chartH / 2})`}>
          Number of Incidents
        </text>
      </svg>
    </div>
  );
};

// ─── Monthly Summary Table (shows all 12 months) ────────────────────────────
const MonthlySummaryTable = ({ monthlyData, totals }) => {
  const monthlyRows = ALL_MONTHS.map(m => ({
    label: getMonthLabel(m),
    ...CAT_KEYS.reduce((acc, k) => ({ ...acc, [k]: monthlyData[m]?.[k] ?? 0 }), {}),
    total: CAT_KEYS.reduce((s, k) => s + (monthlyData[m]?.[k] ?? 0), 0),
  }));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50"><th className="px-3 py-2 text-center border border-gray-200 font-semibold text-gray-600 w-10">#</th>
            <th className="px-3 py-2 text-left border border-gray-200 font-semibold text-gray-600">Month</th>
            {CAT_KEYS.map(k => (
              <th key={k} className="px-3 py-2 text-center border border-gray-200 font-semibold whitespace-nowrap" style={{ color: CAT_COLORS[k] }}>
                {CAT_LABELS[k]}
              </th>
            ))}
            <th className="px-3 py-2 text-center border border-gray-200 font-bold text-gray-700">Total</th>
          </tr>
        </thead>
        <tbody>
          {monthlyRows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-yellow-50' : 'bg-white'}><td className="px-3 py-2 border border-gray-200 text-center text-gray-500">{i + 1}</td>
              <td className="px-3 py-2 border border-gray-200 font-medium text-gray-700 whitespace-nowrap">{row.label}</td>
              {CAT_KEYS.map(k => (
                <td key={k} className="px-3 py-2 border border-gray-200 text-center font-semibold" style={{ color: row[k] > 0 ? CAT_COLORS[k] : '#d1d5db' }}>
                  {row[k] > 0 ? row[k] : ''}
                </td>
              ))}
              <td className="px-3 py-2 border border-gray-200 text-center font-bold text-gray-800">{row.total}</td>
            </tr>
          ))}
          {/* Overall row */}
          <tr className="bg-gray-100 font-bold">
            <td className="px-3 py-2 border border-gray-300 text-gray-700">Overall</td>
            {CAT_KEYS.map(k => (
              <td key={k} className="px-3 py-2 border border-gray-300 text-center" style={{ color: CAT_COLORS[k] }}>
                {totals[k] || ''}
              </td>
            ))}
            <td className="px-3 py-2 border border-gray-300 text-center text-gray-800">{totals.total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

// ─── Legend ─────────────────────────────────────────────────────────────────
const Legend = ({ keys = CAT_KEYS }) => (
  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
    {keys.map(k => (
      <span key={k} className="flex items-center gap-1.5 text-xs text-gray-600">
        <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: CAT_COLORS[k] }} />
        {CAT_LABELS[k]}
      </span>
    ))}
  </div>
);

// ─── Chart Card ─────────────────────────────────────────────────────────────
const ChartCard = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
    <p className="text-sm font-bold text-gray-700 mb-3">{title}</p>
    {children}
  </div>
);

// ─── Modal Field ─────────────────────────────────────────────────────────────
const Field = ({ label, value }) => (
  <div>
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{label}</p>
    <p className="text-sm text-gray-800">{value ?? '—'}</p>
  </div>
);

// ════════════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════════════
const IncidentStatistic = ({ title, incidents: initialIncidents = [] }) => {
  const [incidents] = useState(initialIncidents);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [viewingIncident, setViewingIncident] = useState(null);
  const [activeTab, setActiveTab] = useState('table');

  // ── Derived option lists ─────────────────────────────────────────────────
  const years = useMemo(() => {
    const ys = new Set(incidents.map(i => i.incident_year?.toString()).filter(Boolean));
    return [...ys].sort();
  }, [incidents]);

  const projects = useMemo(() => {
    const ps = new Set(incidents.map(i => i.project_name).filter(Boolean));
    return [...ps].sort();
  }, [incidents]);

  // ── Filtered incidents ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return incidents.filter(inc => {
      const haystack = [
        inc.incident_year, inc.incident_month, inc.incident_type, inc.injury_type,
        inc.body_part, inc.location, inc.project_name, inc.subcon_company,
        inc.immediate_cause, inc.status, inc.responsible_person, inc.reported_by,
      ].join(' ').toLowerCase();

      return (
        (!searchTerm || haystack.includes(searchTerm.toLowerCase())) &&
        (!selectedMonth || inc.incident_month === selectedMonth) &&
        (!selectedYear || String(inc.incident_year) === selectedYear) &&
        (!selectedProject || inc.project_name === selectedProject)
      );
    });
  }, [incidents, searchTerm, selectedMonth, selectedYear, selectedProject]);

  // ── Summary totals ───────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const t = {};
    CAT_KEYS.forEach(k => { t[k] = filtered.reduce((s, i) => s + (i[k] ?? 0), 0); });
    t.total = filtered.reduce((s, i) => s + (i.total ?? 0), 0);
    return t;
  }, [filtered]);

  // ── Monthly breakdown for charts (includes all 12 months) ────────────────
  const monthlyData = useMemo(() => {
    const d = {};
    filtered.forEach(inc => {
      const m = inc.incident_month;
      if (!m) return;
      if (!d[m]) d[m] = {};
      CAT_KEYS.forEach(k => { d[m][k] = (d[m][k] ?? 0) + (inc[k] ?? 0); });
    });
    return d;
  }, [filtered]);

  // ── Table pagination ─────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / entriesToShow));
  const paginated = filtered.slice((currentPage - 1) * entriesToShow, currentPage * entriesToShow);

  const resetPage = () => setCurrentPage(1);

  // ── Summary card config ──────────────────────────────────────────────────
  const summaryCards = [
    { label: 'Fatality', val: totals.fatality, color: 'border-red-500', text: 'text-red-600' },
    { label: 'Occup. Health', val: totals.occup_health_complaint, color: 'border-orange-400', text: 'text-orange-500' },
    { label: 'LTI', val: totals.lti, color: 'border-yellow-500', text: 'text-yellow-600' },
    { label: 'First Aid', val: totals.first_aid_treatment, color: 'border-blue-400', text: 'text-blue-600' },
    { label: 'Fire Cases', val: totals.fire_cases, color: 'border-rose-500', text: 'text-rose-600' },
    { label: 'Environmental', val: totals.environmental_issue, color: 'border-green-500', text: 'text-green-600' },
    { label: 'Road Accident', val: totals.road_accident, color: 'border-purple-500', text: 'text-purple-600' },
    { label: 'Total', val: totals.total, color: 'border-gray-700', text: 'text-gray-800' },
  ];

  return (
    <AppLayout>
      <Head title={title} />

      <div className="p-6 space-y-5">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{filtered.length} incident{filtered.length !== 1 ? 's' : ''} found</p>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm text-sm font-medium flex items-center gap-1.5"
              onClick={() => router.visit(route('incident.create'))}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Report Incident
            </button>
            {/* <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
              onClick={() => window.print()}
            >
              Generate Report
            </button> */}
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Filters</p>
          <div className="flex flex-wrap gap-3">
            <select
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white min-w-[160px]"
              value={selectedProject}
              onChange={e => { setSelectedProject(e.target.value); resetPage(); }}
            >
              <option value="">All Projects</option>
              {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <select
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
              value={selectedYear}
              onChange={e => { setSelectedYear(e.target.value); resetPage(); }}
            >
              <option value="">All Years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white"
              value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); resetPage(); }}
            >
              <option value="">All Months</option>
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>

            <div className="relative flex-1 min-w-[180px]">
              <input
                type="text"
                placeholder="Search..."
                className="border border-gray-300 rounded-lg px-4 py-1.5 pl-8 text-sm w-full"
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); resetPage(); }}
              />
              <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {(selectedProject || selectedYear || selectedMonth || searchTerm) && (
              <button
                className="px-3 py-1.5 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-100"
                onClick={() => { setSelectedProject(''); setSelectedYear(''); setSelectedMonth(''); setSearchTerm(''); resetPage(); }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Summary Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {summaryCards.map(c => (
            <div key={c.label} className={`bg-white rounded-xl border-t-4 ${c.color} shadow-sm p-3`}>
              <p className="text-xs text-gray-500 font-medium leading-tight">{c.label}</p>
              <p className={`text-2xl font-bold mt-1 ${c.text}`}>{c.val}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Toggle ──────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {[
            { id: 'table', label: 'Table' },
            { id: 'charts', label: 'Charts' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-white shadow text-gray-800'
                : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══ CHARTS TAB ══════════════════════════════════════════════════════ */}
        {activeTab === 'charts' && (
          <div className="space-y-6">

            {/* Chart 1: Monthly Summary Table - All 12 months */}
            <ChartCard title="Monthly Incident Summary (All Months)">
              <MonthlySummaryTable monthlyData={monthlyData} totals={totals} />
            </ChartCard>



            {/* Charts 3 & 4 side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Chart 2: Stacked Column Chart - Incident Statistic Performance (all months + overall with numbers on top) */}
              <ChartCard title="Incident Statistic Performance">
                <StackedColumnChart monthlyData={monthlyData} totals={totals} />
                <Legend />
                <p className="text-xs text-gray-400 mt-3 text-center">Each column shows total incidents per month, stacked by category. Number on top shows total incidents.</p>
              </ChartCard>

              {/* Chart 3: Trend Line Chart */}
              {/* <ChartCard title="Incident Trend (Monthly)">
                <TrendLineChart monthlyData={monthlyData} />
                <Legend />
              </ChartCard> */}

              {/* Chart 4: Pie chart — Incident Breakdown */}
              <ChartCard title="Incident Breakdown">
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  {/* Advanced Pie Chart */}
                  <div className="relative w-64 h-64 flex-shrink-0">
                    <PieChart totals={totals} />
                    {/* Center total count */}
                    {totals.total > 0 && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-2xl font-bold text-gray-800">{totals.total}</span>
                        <span className="text-xs text-gray-400">Total</span>
                      </div>
                    )}
                  </div>

                  {/* Legend with detailed stats */}
                  <div className="flex-1 w-full">
                    {CAT_KEYS.filter(k => totals[k] > 0).length > 0 ? (
                      <div className="space-y-3">
                        {CAT_KEYS.filter(k => totals[k] > 0).map(k => {
                          const pct = totals.total > 0 ? ((totals[k] / totals.total) * 100).toFixed(1) : 0;
                          const val = totals[k];
                          return (
                            <div key={k} className="group">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                                    style={{ background: CAT_COLORS[k] }}
                                  />
                                  <span className="text-sm font-medium text-gray-700">{CAT_LABELS[k]}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-gray-800">{val}</span>
                                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                    {pct}%
                                  </span>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 ease-out"
                                  style={{
                                    width: `${pct}%`,
                                    background: CAT_COLORS[k],
                                    boxShadow: `0 0 8px ${CAT_COLORS[k]}40`
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}

                        {/* Summary stats */}
                        <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-400">Total Incidents</p>
                            <p className="text-xl font-bold text-gray-800">{totals.total}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-400">Categories</p>
                            <p className="text-xl font-bold text-gray-800">{CAT_KEYS.filter(k => totals[k] > 0).length}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-400">No incident data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </ChartCard>
            </div>

            {/* Chart 5: Grouped bar — Incident Statistic by Category (all months) */}
            {/* <ChartCard title="Incident Statistic by Category (Monthly Comparison)">
              <GroupedBarChart monthlyData={monthlyData} />
              <Legend />
              <p className="text-xs text-gray-400 mt-3 text-center">Each category group shows monthly distribution. Color intensity indicates month progression (lighter = earlier, darker = later).</p>
            </ChartCard> */}

          </div>
        )}

        {/* ══ TABLE TAB ════════════════════════════════════════════════════════ */}
        {activeTab === 'table' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Show</span>
                <select
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                  value={entriesToShow}
                  onChange={e => { setEntriesToShow(Number(e.target.value)); resetPage(); }}
                >
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span>entries</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      '#', 'Code', 'Year', 'Month', 'Incident Type', 'Injury Type',
                      'Body Part', 'Location', 'Project Name', 'Contractor / Subcon',
                      'Fatality', 'Occup. Health', 'LTI',
                      'First Aid', 'Fire Cases', 'Environmental',
                      'Road Accident', 'Total', 'Status', 'Actions',
                    ].map(h => (
                      <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={20} className="text-center py-10 text-gray-400 text-sm">No incidents found.</td>
                    </tr>
                  ) : (
                    paginated.map((inc, idx) => (
                      <tr key={inc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 font-medium text-gray-700">{(currentPage - 1) * entriesToShow + idx + 1}</td>
                        <td className="px-3 py-3 whitespace-nowrap"><SeriesCode code={inc.series_code} /></td>
                        <td className="px-3 py-3 text-gray-700">{inc.incident_year ?? '—'}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{getMonthFull(inc.incident_month)}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{inc.incident_type ?? '—'}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{inc.injury_type ?? '—'}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{inc.body_part ?? '—'}</td>
                        <td className="px-3 py-3 text-gray-700">{inc.location ?? '—'}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{inc.project_name ?? '—'}</td>
                        <td className="px-3 py-3 text-gray-700 whitespace-nowrap">{inc.subcon_company ?? '—'}</td>
                        <td className="px-3 py-3 text-center font-semibold text-red-600">{inc.fatality ?? 0}</td>
                        <td className="px-3 py-3 text-center font-semibold text-orange-500">{inc.occup_health_complaint ?? 0}</td>
                        <td className="px-3 py-3 text-center font-semibold text-yellow-600">{inc.lti ?? 0}</td>
                        <td className="px-3 py-3 text-center font-semibold text-blue-600">{inc.first_aid_treatment ?? 0}</td>
                        <td className="px-3 py-3 text-center font-semibold text-rose-500">{inc.fire_cases ?? 0}</td>
                        <td className="px-3 py-3 text-center font-semibold text-green-600">{inc.environmental_issue ?? 0}</td>
                        <td className="px-3 py-3 text-center font-semibold text-purple-600">{inc.road_accident ?? 0}</td>
                        <td className="px-3 py-3 text-center font-bold text-gray-800">{inc.total ?? 0}</td>
                        <td className="px-3 py-3">{statusBadge(inc.status)}</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <button
                            type="button"
                            className={tableViewActionClass}
                            onClick={() => setViewingIncident(inc)}
                            title="View incident"
                            aria-label="View incident"
                          >
                            <TableViewIcon />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filtered.length > 0 && (
                  <tfoot className="bg-gray-100 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan={9} className="px-3 py-2 text-xs font-bold text-gray-600 uppercase">Overall Total</td>
                      <td className="px-3 py-2 text-center font-bold text-red-600">{totals.fatality}</td>
                      <td className="px-3 py-2 text-center font-bold text-orange-500">{totals.occup_health_complaint}</td>
                      <td className="px-3 py-2 text-center font-bold text-yellow-600">{totals.lti}</td>
                      <td className="px-3 py-2 text-center font-bold text-blue-600">{totals.first_aid_treatment}</td>
                      <td className="px-3 py-2 text-center font-bold text-rose-500">{totals.fire_cases}</td>
                      <td className="px-3 py-2 text-center font-bold text-green-600">{totals.environmental_issue}</td>
                      <td className="px-3 py-2 text-center font-bold text-purple-600">{totals.road_accident}</td>
                      <td className="px-3 py-2 text-center font-bold text-gray-800">{totals.total}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-200 bg-gray-50 gap-3">
              <p className="text-sm text-gray-500">
                Showing {filtered.length === 0 ? 0 : (currentPage - 1) * entriesToShow + 1}–{Math.min(currentPage * entriesToShow, filtered.length)} of {filtered.length} entries
              </p>
              <div className="flex gap-1">
                <button
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >Previous</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .reduce((acc, p, i, arr) => {
                    if (i > 0 && p - arr[i - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...'
                      ? <span key={`e${i}`} className="px-2 py-1 text-sm text-gray-400">…</span>
                      : <button
                        key={p}
                        className={`px-3 py-1 rounded text-sm ${p === currentPage ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                        onClick={() => setCurrentPage(p)}
                      >{p}</button>
                  )
                }
                <button
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >Next</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      {viewingIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setViewingIncident(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Incident Detail</h2>
                <SeriesCode code={viewingIncident.series_code} className="block" />
                <p className="text-xs text-gray-500 mt-0.5">
                  {getMonthFull(viewingIncident.incident_month)} {viewingIncident.incident_year}
                  {viewingIncident.incident_type ? ` · ${viewingIncident.incident_type}` : ''}
                </p>
              </div>
              <button onClick={() => setViewingIncident(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              <ReviewProgress kind="incident" status={viewingIncident.status} />
              <section>
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">Basic Information</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Field label="Year" value={viewingIncident.incident_year} />
                  <Field label="Month" value={getMonthFull(viewingIncident.incident_month)} />
                  <Field label="Incident Type" value={viewingIncident.incident_type} />
                  <Field label="Injury Type" value={viewingIncident.injury_type} />
                  <Field label="Body Part" value={viewingIncident.body_part} />
                  <Field label="Location" value={viewingIncident.location} />
                  <Field label="Project Name" value={viewingIncident.project_name} />
                  <Field label="Contractor/Subcon" value={viewingIncident.subcon_company} />
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Status</p>
                    {statusBadge(viewingIncident.status)}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">Personnel</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Field label="Responsible Person" value={viewingIncident.responsible_person} />
                  <Field label="Position / Job Role" value={viewingIncident.position} />
                  <Field label="Reported By" value={viewingIncident.reported_by} />
                  <Field label="Reporter Position" value={viewingIncident.reporter_position} />
                </div>
              </section>

              {/* <section>
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">Incident Classification</h3>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {[
                    { label: 'Fatality', val: viewingIncident.fatality, color: 'text-red-600' },
                    { label: 'Occup. Health', val: viewingIncident.occup_health_complaint, color: 'text-orange-500' },
                    { label: 'LTI', val: viewingIncident.lti, color: 'text-yellow-600' },
                    { label: 'First Aid', val: viewingIncident.first_aid_treatment, color: 'text-blue-600' },
                    { label: 'Fire Cases', val: viewingIncident.fire_cases, color: 'text-rose-500' },
                    { label: 'Environmental', val: viewingIncident.environmental_issue, color: 'text-green-600' },
                    { label: 'Road Accident', val: viewingIncident.road_accident, color: 'text-purple-600' },
                    { label: 'Total', val: viewingIncident.total, color: 'text-gray-800 font-bold' },
                  ].map(c => (
                    <div key={c.label} className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400 leading-tight">{c.label}</p>
                      <p className={`text-xl font-bold mt-0.5 ${c.color}`}>{c.val ?? 0}</p>
                    </div>
                  ))}
                </div>
              </section> */}

              <section>
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">Case Details</h3>
                <div className="space-y-3">
                  {viewingIncident.involved_staff?.length > 0 && (
                    <Field label="Subcontractor staff involved" value={viewingIncident.involved_staff.map(x => x.name).join(', ')} />
                  )}
                  <Field label="Incident Description" value={viewingIncident.incident_description} />
                  <Field label="Immediate Cause" value={viewingIncident.immediate_cause} />
                  <Field label="Underlying Cause" value={viewingIncident.underlying_cause} />
                </div>
              </section>

              {viewingIncident.responses?.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">Supervisor review and approval</h3>
                  <ul className="space-y-2">
                    {viewingIncident.responses.map((r) => (
                      <li key={r.id} className={`rounded-lg px-3 py-2 text-sm ${['closed', 'approved'].includes(r.type) ? 'bg-green-50 text-green-900' : r.type === 'reopened' ? 'bg-yellow-50 text-yellow-900' : 'bg-blue-50 text-blue-900'}`}>
                        <p className="text-xs font-bold uppercase opacity-70">{['closed', 'approved'].includes(r.type) ? 'Approved' : r.type === 'reopened' ? 'Reopened' : 'Reviewed'} · {r.by}{r.role ? ` (${r.role})` : ''} · {r.at}</p>
                        {r.message && <p className="mt-0.5 whitespace-pre-wrap">{r.message}</p>}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <section>
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 border-b border-blue-100 pb-1">Follow-up & Actions</h3>
                <div className="space-y-3">
                  <Field label="Immediate Action Taken" value={viewingIncident.immediate_action} />
                  <Field label="Corrective / Preventive Action" value={viewingIncident.corrective} />
                </div>
              </section>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl flex items-center justify-end gap-3">
              <PdfButton href={`/pdf/incident/${viewingIncident.id}`} label="Generate PDF report" />
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm font-medium"
                onClick={() => setViewingIncident(null)}
              >Close</button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default IncidentStatistic;
