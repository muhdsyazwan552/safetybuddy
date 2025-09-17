import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Pages/Admin/Layout';

const ClientComplaint = ({ title }) => {
  // Sample data with status field (default: open)
  const [complaints, setComplaints] = useState([
    { 
      id: 1, 
      project: "Project Alpha", 
      topic: "Safety Passport Compliance", 
      date: "2023-05-15", 
      executor: "Safety Solutions Inc.", 
      description: "Compliance rate below target of 95%", 
      status: "open"
    },
    { 
      id: 2, 
      project: "Project Beta", 
      topic: "Overall Compliance Level", 
      date: "2023-06-22", 
      executor: "Compliance Partners", 
      description: "'GOOD' rating below target threshold", 
      status: "closed"
    },
    { 
      id: 3, 
      project: "Project Gamma", 
      topic: "Non-Conformance", 
      date: "2023-07-10", 
      executor: "Risk Management Group", 
      description: "Multiple NC cases reported in sector B", 
      status: "open"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [viewingComplaint, setViewingComplaint] = useState(null);

  // Filter complaints based on search term
  const filteredComplaints = complaints.filter(complaint =>
    Object.values(complaint).some(
      value => typeof value === 'string' && 
      value.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ).slice(0, entriesToShow);

  // Toggle complaint status
  const handleStatusChange = (id) => {
    setComplaints(complaints.map(item => 
      item.id === id ? { 
        ...item, 
        status: item.status === 'open' ? 'closed' : 'open' 
      } : item
    ));
    
    // Update the viewed complaint if it's the one being changed
    if (viewingComplaint && viewingComplaint.id === id) {
      setViewingComplaint({
        ...viewingComplaint,
        status: viewingComplaint.status === 'open' ? 'closed' : 'open'
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
            </div>
            
            <div className="relative">
              <input
                type="text"
                placeholder="Search complaints..."
                className="border border-gray-300 rounded px-4 py-1 pl-8 text-sm w-full md:w-64"
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
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topic
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Executor
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredComplaints.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {complaint.id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {complaint.project}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {complaint.topic}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {complaint.date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {complaint.executor}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        complaint.status === 'open' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-4">
                        <button 
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => setViewingComplaint(complaint)}
                        >
                          View
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
              Showing 1 to {filteredComplaints.length} of {complaints.length} entries
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

        {/* Complaint Viewer Modal */}
        {viewingComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">{viewingComplaint.project} - {viewingComplaint.topic}</h2>
                  <button 
                    className="text-gray-500 hover:text-gray-700"
                    onClick={() => setViewingComplaint(null)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-700">Details</h3>
                    <p className="mt-1 text-sm text-gray-600">{viewingComplaint.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Date Reported</p>
                      <p className="text-sm">{viewingComplaint.date}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Project Executor</p>
                      <p className="text-sm">{viewingComplaint.executor}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Current Status</p>
                      <p className="text-sm capitalize">{viewingComplaint.status}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button 
                    className={`px-4 py-2 rounded text-white ${
                      viewingComplaint.status === 'open' 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    onClick={() => handleStatusChange(viewingComplaint.id)}
                  >
                    {viewingComplaint.status === 'open' ? 'Mark as Closed' : 'Reopen'}
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

export default ClientComplaint;