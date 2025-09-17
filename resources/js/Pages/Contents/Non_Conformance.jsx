import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Pages/Admin/Layout';

const NonConformance = ({ title }) => {
  // Sample data with status field
  const [reports, setReports] = useState([
    { 
      id: 1, 
      project: "Project Alpha", 
      topic: "Electrical Safety", 
      date: "2023-05-15", 
      executor: "Safety Solutions Inc.", 
      description: "Found exposed wiring in the main control room", 
      status: "open",
      image: "/images/report1.jpg"
    },
    { 
      id: 2, 
      project: "Project Beta", 
      topic: "Fire Prevention", 
      date: "2023-06-22", 
      executor: "Compliance Partners", 
      description: "Missing fire extinguishers in sector B", 
      status: "closed",
      image: "/images/report2.jpg"
    },
    { 
      id: 3, 
      project: "Project Gamma", 
      topic: "PPE Compliance", 
      date: "2023-07-10", 
      executor: "Risk Management Group", 
      description: "Workers not wearing helmets in construction area", 
      status: "open",
      image: "/images/report3.jpg"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [isAdding, setIsAdding] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [newReport, setNewReport] = useState({ 
    project: '', 
    topic: '', 
    date: '', 
    executor: '', 
    description: '',
    status: 'open',
    image: ''
  });

  // Filter reports based on search term
const filteredReports = reports
  .filter(report =>
    Object.values(report).some(
      value =>
        typeof value === 'string' &&
        value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )
  .slice(0, entriesToShow);


  // CRUD Operations
  const handleAddReport = () => {
    if (newReport.project.trim() && newReport.topic.trim()) {
      const newId = reports.length > 0 ? Math.max(...reports.map(r => r.id)) + 1 : 1;
      setReports([...reports, { id: newId, ...newReport }]);
      setNewReport({ 
        project: '', 
        topic: '', 
        date: '', 
        executor: '', 
        description: '',
        status: 'open',
        image: ''
      });
      setIsAdding(false);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    setReports(reports.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));
  };

  const handleDelete = (id) => {
    setReports(reports.filter(item => item.id !== id));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReport(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewReport(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadReport = (report) => {
    // In a real app, this would generate/download a PDF
    console.log(`Downloading report ${report.id}`);
    alert(`Downloading report for ${report.project}`);
  };

  return (
    <AppLayout>
      <Head title={title} />
      
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            onClick={() => console.log('Generate full report clicked')}
          >
            Generate Full Report
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header with Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div>
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
                <span className="ml-2 text-sm text-gray-600">entries</span>
              </div>
              
              <button 
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center"
                onClick={() => setIsAdding(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Add New Report
              </button>
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search reports..."
                className="border border-gray-300 rounded px-4 py-1 pl-8 text-sm w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          {/* Add New Report Form */}
          {isAdding && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Project</label>
                  <input
                    type="text"
                    name="project"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={newReport.project}
                    onChange={handleInputChange}
                    placeholder="Project name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Safety Evaluation Topic</label>
                  <input
                    type="text"
                    name="topic"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={newReport.topic}
                    onChange={handleInputChange}
                    placeholder="Evaluation topic"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
                  <input
                    type="date"
                    name="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={newReport.date}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Project Executor</label>
                  <input
                    type="text"
                    name="executor"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={newReport.executor}
                    onChange={handleInputChange}
                    placeholder="Executor name"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <textarea
                    name="description"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={newReport.description}
                    onChange={handleInputChange}
                    placeholder="Detailed description"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-sm"
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
              <div className="flex items-end space-x-2">
                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                  onClick={handleAddReport}
                >
                  Save Report
                </button>
                <button
                  className="px-3 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Report Viewer Modal */}
          {viewingReport && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold">{viewingReport.project} - {viewingReport.topic}</h2>
                    <button 
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setViewingReport(null)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <div className="mb-4">
                        <h3 className="font-medium text-gray-700">Details</h3>
                        <p className="mt-1 text-sm text-gray-600">{viewingReport.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Date</p>
                          <p className="text-sm">{viewingReport.date}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Executor</p>
                          <p className="text-sm">{viewingReport.executor}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <p className="text-sm capitalize">{viewingReport.status}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:col-span-1">
                      {viewingReport.image && (
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <img 
                            src={viewingReport.image} 
                            alt="Report evidence" 
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button 
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      onClick={() => downloadReport(viewingReport)}
                    >
                      Download PDF
                    </button>
                    <button 
                      className={`px-4 py-2 rounded text-white ${
                        viewingReport.status === 'open' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                      onClick={() => {
                        const newStatus = viewingReport.status === 'open' ? 'closed' : 'open';
                        handleStatusChange(viewingReport.id, newStatus);
                        setViewingReport({...viewingReport, status: newStatus});
                      }}
                    >
                      {viewingReport.status === 'open' ? 'Mark as Closed' : 'Reopen'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Safety Evaluation Topic
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Executor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {report.project}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {report.topic}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {report.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {report.executor}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        report.status === 'open' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-4">
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => setViewingReport(report)}
                        >
                          View
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleDelete(report.id)}
                        >
                          Delete
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
              Showing 1 to {filteredReports.length} of {reports.length} entries
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
      </div>
    </AppLayout>
  );
};

export default NonConformance;