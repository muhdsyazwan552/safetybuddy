import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import TableViewIcon, { tableViewActionClass } from '@/Components/shared/TableViewIcon';

const DailyReports = ({ title }) => {
  // Sample data with all required fields
  const [incidents, setIncidents] = useState([
    { 
      id: 1, 
      project_executor: "Safety Solutions Inc.", 
      fatality: 0,
      occupational_health_complaint: 3,
      lost_time_injury: 2,
      first_aid_treatment: 5,
      fire_cases: 1,
      environmental_issue: 2,
      road_accident: 0,
      month: "2023-05",
      status: "open"
    },
    { 
      id: 2, 
      project_executor: "Compliance Partners", 
      fatality: 1,
      occupational_health_complaint: 2,
      lost_time_injury: 1,
      first_aid_treatment: 3,
      fire_cases: 0,
      environmental_issue: 1,
      road_accident: 1,
      month: "2023-06",
      status: "closed"
    },
    { 
      id: 3, 
      project_executor: "Risk Management Group", 
      fatality: 0,
      occupational_health_complaint: 5,
      lost_time_injury: 3,
      first_aid_treatment: 7,
      fire_cases: 2,
      environmental_issue: 3,
      road_accident: 2,
      month: "2023-07",
      status: "open"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [viewingIncident, setViewingIncident] = useState(null);

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

  // Filter incidents based on search and date filters
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = Object.values(incident).some(
      value => typeof value === 'string' && 
      value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesMonth = selectedMonth 
      ? incident.month.endsWith(`-${selectedMonth}`) 
      : true;
    
    const matchesYear = selectedYear 
      ? incident.month.startsWith(selectedYear) 
      : true;
    
    return matchesSearch && matchesMonth && matchesYear;
  }).slice(0, entriesToShow);

  const handleStatusChange = (id) => {
    setIncidents(incidents.map(item => 
      item.id === id ? { 
        ...item, 
        status: item.status === 'open' ? 'closed' : 'open' 
      } : item
    ));
    
    if (viewingIncident && viewingIncident.id === id) {
      setViewingIncident({
        ...viewingIncident,
        status: viewingIncident.status === 'open' ? 'closed' : 'open'
      });
    }
  };

  return (
    <AppLayout>
      <Head title={title} />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            onClick={() => console.log('Generate report clicked')}
          >
            Generate Report
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header with Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border-b border-gray-200 gap-4">
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="flex items-center">
                <label className="mr-2 text-sm text-gray-600">Show</label>
                <select 
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                  value={entriesToShow}
                  onChange={(e) => setEntriesToShow(Number(e.target.value))}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <div className="flex flex-col md:flex-row gap-2">
                <select
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="">All Years</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                
                <select
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="">All Months</option>
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Search incidents..."
                className="border border-gray-300 rounded px-4 py-1 pl-8 text-sm w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Project Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Executor	
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reports
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIncidents.map((incident, index) => (
                  <tr key={index + 1} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {incident.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {incident.project_executor}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {incident.fatality}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {incident.occupational_health_complaint}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {incident.lost_time_injury}
                    </td>
                
                   
                    
                    <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                      <div className="flex justify-end space-x-4">
                        <button 
                          type="button"
                          className={tableViewActionClass}
                          onClick={() => setViewingIncident(incident)}
                          title="View report"
                          aria-label="View report"
                        >
                          <TableViewIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Table Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
            <div className="mb-4 md:mb-0 text-sm text-gray-600">
              Showing 1 to {filteredIncidents.length} of {incidents.length} entries
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100">
                Previous
              </button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                1
              </button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100">
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Floating Create Button */}
        <button 
          className="fixed bottom-8 right-8 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          onClick={() => console.log('Create new incident')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Incident Viewer Modal */}
        {viewingIncident && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">{viewingIncident.project_executor}</h2>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setViewingIncident(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Month</p>
                    <p className="text-sm">{viewingIncident.month}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-sm capitalize">{viewingIncident.status}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Fatality</p>
                      <p className="text-sm">{viewingIncident.fatality}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Occupational Health</p>
                      <p className="text-sm">{viewingIncident.occupational_health_complaint}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Lost Time Injury</p>
                      <p className="text-sm">{viewingIncident.lost_time_injury}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">First Aid Cases</p>
                      <p className="text-sm">{viewingIncident.first_aid_treatment}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Fire Cases</p>
                      <p className="text-sm">{viewingIncident.fire_cases}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Environmental Issues</p>
                      <p className="text-sm">{viewingIncident.environmental_issue}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Road Accidents</p>
                      <p className="text-sm">{viewingIncident.road_accident}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-start space-x-3">
                  <button 
                    className={`px-4 py-2 rounded text-white ${
                      viewingIncident.status === 'open' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={() => handleStatusChange(viewingIncident.id)}
                  >
                    {viewingIncident.status === 'open' ? 'Mark as Closed' : 'Reopen'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DailyReports;
