import React, { useState, useMemo } from "react";
import { Head, Link } from "@inertiajs/react";
import AppLayout from "@/Pages/WSIS/Layout";
import useIsMobile from "@/Components/shared/useIsMobile";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

const Dashboard_Inspection = ({
  title,
  auth,
  inspections = [],
  projects = [],
  all_companies = [],
  topics = [],
  project_chart_data = [],
  executor_chart_data = [],
  findings_summary = {},
  topic_chart_data = [],
  user_project_count = 0,
  user_employee_count = 0,
  user_executor_count = 0,
  user_inspection_count = 0,
  dashboard_cards = null,
}) => {
  const isMobile = useIsMobile();
  const [dateRange, setDateRange] = useState("month");
  // const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const [chartType, setChartType] = useState("compliance");

  // process inspections for charts
  const { stats, chartData, evaluationData, recentInspections, topicChartData } = useMemo(() => {


    const filteredInspections = inspections.filter((inspection) => {
      const now = new Date();
      let startDate;

      switch (dateRange) {
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "quarter":
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        default:
          startDate = new Date(0);
      }

      const inspectionDate = new Date(inspection.inspection_date);
      const dateMatch = inspectionDate >= startDate;

      const projectMatch =
        projectFilter === "all" || inspection.project?.id === projectFilter;
      return projectMatch; // plus any date filtering

      return dateMatch && projectMatch;
    });


    const filteredExecutorData = executor_chart_data
      .filter(company =>
        projectFilter === "all" || company.project_ids.includes(Number(projectFilter))
      )
      .map(company => {
        const companyInspections = filteredInspections.filter(
          i =>
            i.subcon_company_id === company.company_id && // ✅ was i.company_id
            (projectFilter === "all" || i.project?.id === Number(projectFilter))
        );

        const total = companyInspections.length;
        const good = companyInspections.filter(i => i.evaluation === "good").length;
        const moderate = companyInspections.filter(i => i.evaluation === "moderate").length;
        const poor = companyInspections.filter(i => i.evaluation === "poor").length;
        const nonConformance = companyInspections.filter(i => i.evaluation === "nonconformance").length;
        const clientComplaints = companyInspections.filter(i => i.evaluation === "clientcomplaint").length;
        const compliantCount = good + moderate + poor + nonConformance + clientComplaints;

        return {
          ...company,
          total,
          good,
          moderate,
          poor,
          nonConformance,
          clientComplaints,
          // Bar dataKeys are lowercase; recompute them here so they respect the
          // selected project (the backend values are unfiltered by project).
          nonconformance: nonConformance,
          clientcomplaint: clientComplaints,
          compliant_count: compliantCount,
          compliance_rate: total > 0 ? Math.round((compliantCount / total) * 100) : 0,
        };
      });


    const complianceData = filteredExecutorData;
    const projectsData = project_chart_data;
    const displayData = chartType === "compliance" ? complianceData : projectsData;

    const totalInspections = filteredInspections.length;
    const goodInspections = filteredInspections.filter(i => i.evaluation === "good").length;
    const moderateInspections = filteredInspections.filter(i => i.evaluation === "moderate").length;
    const poorInspections = filteredInspections.filter(i => i.evaluation === "poor").length;
    const nonConformance = filteredInspections.filter(i => i.evaluation === "nonconformance").length;
    const clientComplaints = filteredInspections.filter(i => i.evaluation === "clientcomplaint").length;

    const evaluationDistribution = [
      { name: "Good", value: goodInspections },
      { name: "Moderate", value: moderateInspections },
      { name: "Poor", value: poorInspections },
      { name: "Non-conformance", value: nonConformance },
      { name: "Client Complaint", value: clientComplaints },
    ].filter((item) => item.value > 0);

    const topicChartData = [];
    const topicsMap = {};

    // Initialize topics map with all topics
    topics.forEach(topic => {
      topicsMap[topic.id] = {
        name: topic.name,
        good: 0,
        moderate: 0,
        poor: 0,
        nonconformance: 0,
        clientcomplaint: 0,
        total: 0
      };
    });

    // Count evaluations by topic
    filteredInspections.forEach(inspection => {
      if (inspection.topic && inspection.topic.id && topicsMap[inspection.topic.id]) {
        const evaluation = inspection.evaluation;
        if (evaluation && topicsMap[inspection.topic.id][evaluation] !== undefined) {
          topicsMap[inspection.topic.id][evaluation] += 1;
          topicsMap[inspection.topic.id].total += 1;
        }
      }
    });

    // Convert to array (include ALL topics)
    Object.values(topicsMap).forEach(topic => {
      topicChartData.push({
        name: topic.name,
        good: topic.good,
        moderate: topic.moderate,
        poor: topic.poor,
        nonconformance: topic.nonconformance,
        clientcomplaint: topic.clientcomplaint,
        total: topic.total
      });
    });


    return {
      stats: {
        total: totalInspections,
        good: goodInspections,
        moderate: moderateInspections,
        poor: poorInspections,
        nonConformance,
        clientComplaints,
        complianceRate:
          totalInspections > 0
            ? Math.round(((goodInspections + moderateInspections) / totalInspections) * 100)
            : 0,
      },
      chartData: displayData,
      evaluationData: evaluationDistribution,
      recentInspections: filteredInspections.slice(0, 10),
      topicChartData: topicChartData,
    };
  }, [inspections, projects, dateRange, projectFilter, executor_chart_data, project_chart_data, chartType, topics, topic_chart_data]);

  // Add this function to process findings data
  const processFindingsData = (summaryData) => {
    if (!summaryData || !summaryData.summary) return null;

    const { summary, total } = summaryData;

    // Get unique topics across all evaluation types
    const allTopics = new Set();
    Object.values(summary).forEach(evaluation => {
      evaluation.topics.forEach(topic => {
        if (topic) allTopics.add(topic);
      });
    });

    // Create a matrix of counts by evaluation type and topic
    const topicMatrix = {};
    Array.from(allTopics).forEach(topic => {
      topicMatrix[topic] = {
        good: 0,
        moderate: 0,
        poor: 0,
        nonconformance: 0,
        clientcomplaint: 0,
      };
    });

    // Populate the matrix with actual counts
    inspections.forEach(inspection => {
      if (inspection.topic && inspection.topic.name && inspection.evaluation) {
        const topicName = inspection.topic.name;
        const evaluation = inspection.evaluation;

        if (topicMatrix[topicName] && topicMatrix[topicName][evaluation] !== undefined) {
          topicMatrix[topicName][evaluation] += 1;
        }
      }
    });

    return {
      summary,
      total,
      topicMatrix,
      allTopics: Array.from(allTopics).sort(),
    };
  };

  // Replace processFindingsData + findingsData entirely with this:

  const findingsData = useMemo(() => {
    // Pick the correct summary slice based on projectFilter
    const raw = findings_summary[projectFilter] ?? findings_summary['all'];
    if (!raw || !raw.summary) return null;

    const { summary } = raw;

    // Collect all unique topic names across all evaluations
    const allTopics = new Set();
    Object.values(summary).forEach(ev => {
      ev.topics.forEach(topic => { if (topic) allTopics.add(topic); });
    });

    if (allTopics.size === 0) return null;

    // Build topic matrix from filtered inspections (not the raw prop)
    // so the table always matches the current projectFilter
    const filteredForFindings = projectFilter === 'all'
      ? inspections
      : inspections.filter(i => i.project?.id === Number(projectFilter));

    const topicMatrix = {};
    allTopics.forEach(topic => {
      topicMatrix[topic] = { good: 0, moderate: 0, poor: 0, nonconformance: 0, clientcomplaint: 0 };
    });

    filteredForFindings.forEach(inspection => {
      const topicName = inspection.topic?.name;
      const evaluation = inspection.evaluation;
      if (topicName && topicMatrix[topicName] && evaluation) {
        topicMatrix[topicName][evaluation] += 1;
      }
    });

    // Recalculate summary counts from filteredForFindings (not PHP counts)
    const evaluations = ['good', 'moderate', 'poor', 'nonconformance', 'clientcomplaint'];
    const liveSummary = {};
    evaluations.forEach(ev => {
      liveSummary[ev] = {
        count: filteredForFindings.filter(i => i.evaluation === ev).length,
      };
    });

    return {
      summary: liveSummary,
      total: filteredForFindings.length,
      topicMatrix,
      allTopics: Array.from(allTopics).sort(),
    };
  }, [findings_summary, inspections, projectFilter]);


  return (
    <AppLayout user={auth.user}>
      <Head title={title} />

      <div className="p-6 space-y-8">

        {(() => {
          const fallback = { total: 0, active: 0, this_month: 0, last_month: 0 };
          const c = dashboard_cards || {};
          const cards = [
            {
              key: 'projects', label: 'Total Projects', icon: 'fa-folder-open', tone: 'blue',
              data: c.projects || { ...fallback, total: user_project_count },
              sub: (d) => `${d.active} active`,
              period: 'created',
            },
            {
              key: 'employees', label: 'Total Employees', icon: 'fa-users', tone: 'purple',
              data: c.employees || { ...fallback, total: user_employee_count },
              sub: (d) => `${d.active} active`,
              period: 'joined',
            },
            {
              key: 'executors', label: 'Total Executors', icon: 'fa-user-tie', tone: 'amber',
              data: c.executors || { ...fallback, total: user_executor_count },
              sub: (d) => `${d.active} active`,
              period: 'added',
            },
            {
              key: 'inspections', label: 'Total Inspections', icon: 'fa-clipboard-check', tone: 'green',
              data: c.inspections || { ...fallback, total: user_inspection_count },
              sub: (d) => `${d.active} NC / complaints`,
              period: 'recorded',
            },
          ];
          const tones = {
            blue: ['bg-blue-100', 'text-blue-600', 'bg-blue-600'],
            purple: ['bg-purple-100', 'text-purple-600', 'bg-purple-600'],
            amber: ['bg-amber-100', 'text-amber-600', 'bg-amber-600'],
            green: ['bg-green-100', 'text-green-600', 'bg-green-600'],
          };
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cards.map((card) => {
                const d = card.data;
                const diff = d.this_month - d.last_month;
                const [softBg, iconColor, barBg] = tones[card.tone];
                return (
                  <div key={card.key} className="card bg-white rounded-2xl shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:scale-[1.02]">
                    <div className="p-5">
                      <div className="flex justify-between items-center">
                        <div className="min-w-0">
                          <h2 className="text-gray-500 text-sm font-medium">{card.label}</h2>
                          <p className="text-3xl font-bold text-gray-800 mt-2">{d.total}</p>
                          <p className="text-xs text-gray-500 mt-1">{card.sub(d)}</p>
                          <div className="flex flex-wrap items-center mt-3 gap-x-2 gap-y-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${d.this_month > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                              {d.this_month > 0 ? '+' : ''}{d.this_month} this month
                            </span>
                            <span className="text-gray-500 text-xs">
                              {diff === 0 ? 'same as last month' : `${diff > 0 ? '+' : ''}${diff} vs last month`}
                            </span>
                          </div>
                        </div>
                        <div className={`${softBg} p-4 rounded-full shadow-inner shrink-0`}>
                          <i className={`fas ${card.icon} ${iconColor} text-xl`}></i>
                        </div>
                      </div>
                    </div>
                    <div className={`${barBg} h-1 w-full`}></div>
                  </div>
                );
              })}
            </div>
          );
        })()}
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
            <p className="text-gray-600 mt-1">
              Comprehensive overview of inspection activities
            </p>
          </div>
          <div className="flex gap-3">
            {/* <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-60 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ease-in-out duration-200 hover:border-gray-400"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 90 Days</option>
              <option value="all">All Time</option>
            </select> */}
            {/* <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Evaluations</option>
              <option value="good">Good</option>
              <option value="moderate">Moderate</option>
              <option value="poor">Poor</option>
              <option value="nonconformance">Non-conformance</option>
              <option value="clientcomplaint">Client Complaint</option>
            </select> */}
            <select
              value={projectFilter}
              onChange={(e) => {
                const val = e.target.value === "all" ? "all" : Number(e.target.value);
                console.log("Selected project filter:", val);
                setProjectFilter(val);
              }}
              className="w-60 px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ease-in-out duration-200 hover:border-gray-400"
            >
              <option value="all" className="text-gray-500">
                All Projects
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>




          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Bar Chart Inspection by Compliance*/}
          <div className="bg-white rounded-xl shadow p-3 sm:p-6 border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {chartType === "compliance"
                ? "Inspections by Compliance (Executor Company)"
                : "Inspections by Project"}
            </h2>
            <div className="overflow-x-auto"><div style={{ minWidth: isMobile ? Math.max(320, chartData.length * 64) : "100%" }}>
<ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                barSize={isMobile ? 20 : 28}
                margin={{ top: 20, right: isMobile ? 10 : 30, left: isMobile ? 0 : 20, bottom: chartType === "compliance" ? 60 : 40 }}
              >
                <defs>
                  <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FBD926" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#CA8A04" stopOpacity={0.9} />
                  </linearGradient>
                  <linearGradient id="complianceBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.9} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis
                  dataKey={chartType === "compliance" ? "name" : "short_name"}
                  tick={{ fill: "#6b7280", fontSize: chartType === "compliance" ? 10 : 12 }}
                  angle={chartType === "compliance" ? -45 : 0}
                  textAnchor={chartType === "compliance" ? "end" : "middle"}
                  height={chartType === "compliance" ? 60 : 40}
                />

                <YAxis
                  domain={[
                    0,
                    chartType === "compliance"
                      ? Math.max(...chartData.map(d => d.compliant_count || 0))
                      : Math.max(...chartData.map(d => d.count || 0))
                  ]}
                  allowDecimals={false}
                />

                <Tooltip
                  formatter={(value, name, props) => {
                    const evaluationNames = {
                      good: "Good",
                      moderate: "Moderate",
                      poor: "Poor",
                      nonconformance: "Non-conformance",
                      clientcomplaint: "Client Complaint",
                      compliant_count: "Compliant Count",
                      compliance_rate: "Compliance Rate"
                    };

                    if (chartType === "compliance") {
                      const payload = props.payload;
                      const total = payload.total || 1; // Avoid division by zero



                      // For other values like compliance_rate
                      return [`${value}${name === 'compliance_rate' ? '%' : ''}`, evaluationNames[name] || name];
                    } else {
                      // For project chart
                      return [`${value}`, evaluationNames[name] || name];
                    }
                  }}
                  labelFormatter={(value) => {
                    const item = chartData.find(
                      d => (chartType === "compliance" ? d.short_name : d.name) === value
                    );

                    if (item) {
                      if (chartType === "compliance") {
                        return `${item.name}\nTotal: ${item.total || 0} inspections`;
                      }
                      return item.name;
                    }
                    return value;
                  }}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                />

                {chartType === "compliance" ? (
                  <>
                    <Bar dataKey="good" fill="#10b981" stroke="#fff" strokeWidth={1} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="moderate" fill="#f59e0b" stroke="#fff" strokeWidth={1} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="poor" fill="#ef4444" stroke="#fff" strokeWidth={1} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="nonconformance" fill="#6b7280" stroke="#fff" strokeWidth={1} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="clientcomplaint" fill="#8b5cf6" stroke="#fff" strokeWidth={1} radius={[6, 6, 0, 0]} />
                  </>
                ) : (
                  <>
                    <Bar dataKey="good" fill="#10b981" stroke="#fff" strokeWidth={1} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="moderate" fill="#f59e0b" stroke="#fff" strokeWidth={1} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="poor" fill="#ef4444" stroke="#fff" strokeWidth={1} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="nonconformance" fill="#6b7280" stroke="#fff" strokeWidth={1} radius={[6, 6, 0, 0]} />
                    <Bar dataKey="clientcomplaint" fill="#8b5cf6" stroke="#fff" strokeWidth={1} radius={[6, 6, 0, 0]} />
                  </>
                )}

              </BarChart>
            </ResponsiveContainer>
</div></div>

            {chartType === "compliance" && (
              <div className="mt-4 text-xs sm:text-sm text-gray-600 flex flex-wrap justify-center gap-x-4 gap-y-2">
                <div className="flex items-center whitespace-nowrap">
                  <div className="w-3 h-3 bg-emerald-500 mr-2 shrink-0 rounded-sm"></div>
                  <span>Good</span>
                </div>
                <div className="flex items-center whitespace-nowrap">
                  <div className="w-3 h-3 bg-amber-500 mr-2 shrink-0 rounded-sm"></div>
                  <span>Moderate</span>
                </div>
                <div className="flex items-center whitespace-nowrap">
                  <div className="w-3 h-3 bg-red-500 mr-2 shrink-0 rounded-sm"></div>
                  <span>Poor</span>
                </div>
                <div className="flex items-center whitespace-nowrap">
                  <div className="w-3 h-3 bg-gray-500 mr-2 shrink-0 rounded-sm"></div>
                  <span>Non-Conformance</span>
                </div>
                <div className="flex items-center whitespace-nowrap">
                  <div className="w-3 h-3 bg-violet-500 mr-2 shrink-0 rounded-sm"></div>
                  <span>Client Complaint</span>
                </div>
              </div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl shadow p-3 sm:p-6 border">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Evaluation Summary
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={evaluationData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 70 : 100}
                  label={({ name, percent }) =>
                    isMobile ? `${(percent * 100).toFixed(0)}%` : `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {evaluationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.name === "Good"
                          ? "#22c55e" // Green
                          : entry.name === "Moderate"
                            ? "#f59e0b" // Yellow
                            : entry.name === "Poor"
                              ? "#ef4444" // Orange
                              : entry.name === "Non-conformance"
                                ? "#6b7280" // Red
                                : entry.name === "Client Complaint"
                                  ? "#8655f6" // Purple
                                  : "#8655f6" // Fallback Gray
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value}`, name]} // Show raw count instead of %
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                />
                {/* <Legend
        verticalAlign="bottom"
        height={36}
        formatter={(value) => (
          <span className="text-gray-700 text-sm">{value}</span>
        )}
      /> */}

              </PieChart>

            </ResponsiveContainer>
            <div className="mt-4 text-xs sm:text-sm text-gray-600 flex flex-wrap justify-center gap-x-4 gap-y-2">
              <div className="flex items-center whitespace-nowrap">
                <div className="w-3 h-3 bg-emerald-500 mr-2 shrink-0 rounded-sm"></div>
                <span>Good</span>
              </div>
              <div className="flex items-center whitespace-nowrap">
                <div className="w-3 h-3 bg-amber-500 mr-2 shrink-0 rounded-sm"></div>
                <span>Moderate</span>
              </div>
              <div className="flex items-center whitespace-nowrap">
                <div className="w-3 h-3 bg-red-500 mr-2 shrink-0 rounded-sm"></div>
                <span>Poor</span>
              </div>
              <div className="flex items-center whitespace-nowrap">
                <div className="w-3 h-3 bg-gray-500 mr-2 shrink-0 rounded-sm"></div>
                <span>Non-Conformance</span>
              </div>
              <div className="flex items-center whitespace-nowrap">
                <div className="w-3 h-3 bg-violet-500 mr-2 shrink-0 rounded-sm"></div>
                <span>Client Complaint</span>
              </div>
            </div>
          </div>

        </div>

        {/* NEW TOPIC CHART - Modified to show stacked bars by evaluation type */}
        {/* <div className="bg-white rounded-xl shadow p-3 sm:p-6 border">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Inspection Results by Topic
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={topicChartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              barGap={0}
              barCategoryGap="10%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6b7280", fontSize: 10 }}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis
  allowDecimals={false}
  tick={{ fill: "#6b7280" }}
  label={{ value: 'Number of Inspections', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
/>
              <Tooltip
                formatter={(value, name) => {
                  const evaluationNames = {
                    good: "Good",
                    moderate: "Moderate",
                    poor: "Poor",
                    nonconformance: "Non-conformance",
                    clientcomplaint: "Client Complaint"
                  };
                  return [`${value}`, evaluationNames[name] || name];
                }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                }}
              />
              <Legend 
                verticalAlign="bottom"
                height={36}
                formatter={(value) => {
                  const evaluationNames = {
                    good: "Good",
                    moderate: "Moderate",
                    poor: "Poor",
                    nonconformance: "Non-conformance",
                    clientcomplaint: "Client Complaint"
                  };
                  return <span className="text-gray-700 text-sm">{evaluationNames[value] || value}</span>;
                }}
              />
              <Bar dataKey="good" stackId="a" fill="#10b981" name="good" />
              <Bar dataKey="moderate" stackId="a" fill="#f59e0b" name="moderate" />
              <Bar dataKey="poor" stackId="a" fill="#ef4444" name="poor" />
              <Bar dataKey="nonconformance" stackId="a" fill="#6b7280" name="nonconformance" />
              <Bar dataKey="clientcomplaint" stackId="a" fill="#8b5cf6" name="clientcomplaint" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs sm:text-sm text-gray-600 flex flex-wrap justify-center gap-x-4 gap-y-2">
            <div className="flex items-center whitespace-nowrap">
              <div className="w-3 h-3 bg-emerald-500 mr-2 shrink-0 rounded-sm"></div>
              <span>Good</span>
            </div>
            <div className="flex items-center whitespace-nowrap">
              <div className="w-3 h-3 bg-amber-500 mr-2 shrink-0 rounded-sm"></div>
              <span>Moderate</span>
            </div>
            <div className="flex items-center whitespace-nowrap">
              <div className="w-3 h-3 bg-red-500 mr-2 shrink-0 rounded-sm"></div>
              <span>Poor</span>
            </div>
            <div className="flex items-center whitespace-nowrap">
              <div className="w-3 h-3 bg-gray-500 mr-2 shrink-0 rounded-sm"></div>
              <span>Non-Conformance</span>
            </div>
            <div className="flex items-center whitespace-nowrap">
              <div className="w-3 h-3 bg-violet-500 mr-2 shrink-0 rounded-sm"></div>
              <span>Client Complaint</span>
            </div>
          </div>
        </div> */}

        {/* Topic Chart */}
        <div className="bg-white rounded-xl shadow p-3 sm:p-6 border">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Inspection Results by Topic
          </h2>
          {topicChartData.length > 0 ? (
            <>
              <div className="overflow-x-auto"><div style={{ minWidth: isMobile ? Math.max(320, topicChartData.length * 64) : "100%" }}>
<ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={topicChartData}
                  margin={{ top: 20, right: isMobile ? 10 : 30, left: isMobile ? 0 : 20, bottom: 60 }}
                  barGap={0}
                  barCategoryGap="10%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#6b7280" }}
                  />
                  <Tooltip
                    formatter={(value, name) => {
                      const evaluationNames = {
                        good: "Good",
                        moderate: "Moderate",
                        poor: "Poor",
                        nonconformance: "Non-conformance",
                        clientcomplaint: "Client Complaint"
                      };
                      return [`${value}`, evaluationNames[name] || name];
                    }}
                  />
                  {/* <Legend 
            verticalAlign="bottom"
            height={36}
            formatter={(value) => {
              const evaluationNames = {
                good: "Good",
                moderate: "Moderate",
                poor: "Poor",
                nonconformance: "Non-conformance",
                clientcomplaint: "Client Complaint"
              };
              return <span className="text-gray-700 text-sm">{evaluationNames[value] || value}</span>;
            }}
          /> */}
                  <Bar dataKey="good" stackId="a" fill="#10b981" name="good" />
                  <Bar dataKey="moderate" stackId="a" fill="#f59e0b" name="moderate" />
                  <Bar dataKey="poor" stackId="a" fill="#ef4444" name="poor" />
                  <Bar dataKey="nonconformance" stackId="a" fill="#6b7280" name="nonconformance" />
                  <Bar dataKey="clientcomplaint" stackId="a" fill="#8b5cf6" name="clientcomplaint" />
                </BarChart>
              </ResponsiveContainer>
</div></div>
              <div className="mt-4 text-xs sm:text-sm text-gray-600 flex flex-wrap justify-center gap-x-4 gap-y-2">
                <div className="flex items-center whitespace-nowrap">
                  <div className="w-3 h-3 bg-emerald-500 mr-2 shrink-0 rounded-sm"></div>
                  <span>Good</span>
                </div>
                <div className="flex items-center whitespace-nowrap">
                  <div className="w-3 h-3 bg-amber-500 mr-2 shrink-0 rounded-sm"></div>
                  <span>Moderate</span>
                </div>
                <div className="flex items-center whitespace-nowrap">
                  <div className="w-3 h-3 bg-red-500 mr-2 shrink-0 rounded-sm"></div>
                  <span>Poor</span>
                </div>
                <div className="flex items-center whitespace-nowrap">
                  <div className="w-3 h-3 bg-gray-500 mr-2 shrink-0 rounded-sm"></div>
                  <span>Non-Conformance</span>
                </div>
                <div className="flex items-center whitespace-nowrap">
                  <div className="w-3 h-3 bg-violet-500 mr-2 shrink-0 rounded-sm"></div>
                  <span>Client Complaint</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500 py-10">No topic data available</p>
          )}
        </div>

        {/* Findings Summary Table */}
        <div className="bg-white p-6 rounded-xl shadow border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Findings Summary
          </h3>

          {findingsData ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700 border rounded-lg">
                <thead>
                  <tr className="bg-gray-100 text-center font-semibold"><th className="border px-4 py-2 w-12">#</th>
                    <th className="border px-4 py-2">Topic</th>
                    <th className="border px-4 py-2">GOOD</th>
                    <th className="border px-4 py-2">MODERATE</th>
                    <th className="border px-4 py-2">POOR</th>
                    <th className="border px-4 py-2">NONCONFORMANCE</th>
                    <th className="border px-4 py-2">CLIENT COMPLAINT</th>
                  </tr>
                </thead>
                <tbody>
                  {findingsData.allTopics.map((topic, topicIdx) => (
                    <tr key={topic} className="text-center"><td className="border px-4 py-2 text-gray-500">{topicIdx + 1}</td>
                      <td className="border px-4 py-2 font-medium">{topic}</td>
                      <td className="border px-4 py-2">{findingsData.topicMatrix[topic]?.good || 0}</td>
                      <td className="border px-4 py-2">{findingsData.topicMatrix[topic]?.moderate || 0}</td>
                      <td className="border px-4 py-2">{findingsData.topicMatrix[topic]?.poor || 0}</td>
                      <td className="border px-4 py-2">{findingsData.topicMatrix[topic]?.nonconformance || 0}</td>
                      <td className="border px-4 py-2">{findingsData.topicMatrix[topic]?.clientcomplaint || 0}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 text-center font-semibold">
                    <td className="border px-4 py-2"></td><td className="border px-4 py-2">Total</td>
                    <td className="border px-4 py-2">{findingsData.summary.good.count}</td>
                    <td className="border px-4 py-2">{findingsData.summary.moderate.count}</td>
                    <td className="border px-4 py-2">{findingsData.summary.poor.count}</td>
                    <td className="border px-4 py-2">{findingsData.summary.nonconformance.count}</td>
                    <td className="border px-4 py-2">{findingsData.summary.clientcomplaint.count}</td>
                  </tr>
                  <tr className="bg-blue-50 text-blue-800 font-bold text-center">
                    <td colSpan="6" className="border px-4 py-2">Total Findings</td>
                    <td className="border px-4 py-2">{findingsData.total}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No findings data available</p>
          )}
        </div>

      </div>
    </AppLayout>
  );
};

export default Dashboard_Inspection;