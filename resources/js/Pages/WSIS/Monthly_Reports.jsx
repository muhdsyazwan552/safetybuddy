import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';

const MonthlyReport = ({ title }) => {
  // Sample report data
  const [reports, setReports] = useState([
    {
      id: 1,
      year: '2023',
      month: '05',
      title: 'May 2023 Safety Report',
      generated_by: 'Safety Team',
      generated_at: '2023-05-31',
      content: 'Monthly safety statistics showing improvement in compliance...',
      download_url: '#'
    },
    {
      id: 2,
      year: '2023',
      month: '06',
      title: 'June 2023 Safety Report',
      generated_by: 'Safety Team',
      generated_at: '2023-06-30',
      content: 'Increased incidents noted in construction zone B...',
      download_url: '#'
    },
    {
      id: 3,
      year: '2023',
      month: '07',
      title: 'July 2023 Safety Report',
      generated_by: 'Compliance Officer',
      generated_at: '2023-07-31',
      content: 'New safety protocols implemented with positive results...',
      download_url: '#'
    }
  ]);

  // Filter states
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [viewingReport, setViewingReport] = useState(null);

  // Generate years and months for filters
  const years = ['2023', '2024', '2025'];
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  // Filter reports based on selections
  const filteredReports = reports.filter(report => {
    const matchesYear = selectedYear ? report.year === selectedYear : true;
    const matchesMonth = selectedMonth ? report.month === selectedMonth : true;
    return matchesYear && matchesMonth;
  });

  const generateNewReport = () => {
    // In a real app, this would call an API
    const newReport = {
      id: reports.length + 1,
      year: selectedYear || '2023',
      month: selectedMonth || '01',
      title: `${months.find(m => m.value === (selectedMonth || '01'))?.label} ${selectedYear || '2023'} Safety Report`,
      generated_by: 'System Admin',
      generated_at: new Date().toISOString().split('T')[0],
      content: 'Automatically generated report content...',
      download_url: '#'
    };
    setReports([...reports, newReport]);
  };

  return (
    <AppLayout>
      <Head title={title} />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-gray-200 gap-4">
            <div className="flex flex-col md:flex-row gap-4 w-full">
              <div className="flex items-center gap-2">
                <select
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                
                <select
                  className="border border-gray-300 rounded px-3 py-2 text-sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">All Months</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
              
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                onClick={generateNewReport}
                disabled={!selectedYear || !selectedMonth}
              >
                Generate New Report
              </button>
            </div>
          </div>
          
          {/* Reports List */}
          <div className="divide-y divide-gray-200">
            {filteredReports.length > 0 ? (
              filteredReports.map(report => (
                <div key={report.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{report.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Generated by {report.generated_by} on {report.generated_at}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="text-blue-600 hover:text-blue-800 text-sm"
                        onClick={() => setViewingReport(report)}
                      >
                        View
                      </button>
                      <a 
                        href={report.download_url} 
                        className="text-green-600 hover:text-green-800 text-sm"
                        download
                      >
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No reports found for selected filters
              </div>
            )}
          </div>
        </div>

        {/* Report Viewer Modal */}
        {viewingReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold">{viewingReport.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Generated by {viewingReport.generated_by} on {viewingReport.generated_at}
                    </p>
                  </div>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setViewingReport(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="prose max-w-none">
                  <h3>Executive Summary</h3>
                  <p>{viewingReport.content}</p>
                  
                  <h3 className="mt-6">Detailed Statistics</h3>
                  <div className="bg-gray-50 p-4 rounded-lg mt-2">
                    <table className="min-w-full">
                      <thead>
                        <tr>
                          <th className="text-left py-2">Metric</th>
                          <th className="text-right py-2">Value</th>
                          <th className="text-right py-2">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="py-2">Total Incidents</td>
                          <td className="text-right py-2">24</td>
                          <td className="text-right py-2 text-red-500">↑ 12%</td>
                        </tr>
                        <tr>
                          <td className="py-2">Safety Violations</td>
                          <td className="text-right py-2">8</td>
                          <td className="text-right py-2 text-green-500">↓ 5%</td>
                        </tr>
                        <tr>
                          <td className="py-2">Training Completed</td>
                          <td className="text-right py-2">142</td>
                          <td className="text-right py-2 text-green-500">↑ 23%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end gap-3">
                  <a 
                    href={viewingReport.download_url}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    download
                  >
                    Download PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MonthlyReport;