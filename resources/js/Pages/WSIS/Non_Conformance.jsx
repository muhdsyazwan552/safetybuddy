import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import { showAlert } from '@/Helpers/alert';

const NonConformance = ({ title, auth, nonConformances = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingReport, setViewingReport] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [commentText, setCommentText] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { flash } = usePage().props;

  // Show flash messages
  useEffect(() => {
    if (flash?.success) {
      showAlert.success(flash.success);
    }
    if (flash?.error) {
      showAlert.error(flash.error);
    }
    if (flash?.warning) {
      showAlert.warning(flash.warning);
    }
    if (flash?.info) {
      showAlert.info(flash.info);
    }
  }, [flash]);

  const filtered = nonConformances.filter(nc => {
    const project = nc.inspection?.project?.name?.toLowerCase() ?? '';
    const topic = nc.inspection?.topic?.name?.toLowerCase() ?? '';
    const subcon = nc.inspection?.subcon_company?.name?.toLowerCase() ?? '';
    const inspector = nc.inspection?.inspector?.name?.toLowerCase() ?? '';
    const search = searchTerm.toLowerCase();

    const matchSearch = project.includes(search) || topic.includes(search)
      || subcon.includes(search) || inspector.includes(search);

    const matchStatus = statusFilter === 'all' || nc.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / entriesToShow);
  const startIndex = (currentPage - 1) * entriesToShow;
  const paginated = filtered.slice(startIndex, startIndex + entriesToShow);

  const handleStatusChange = (id, newStatus, comment = null) => {
    setIsUpdating(true);
    
    // Show loading indicator
    showAlert.info('Updating status...', 'Please wait');
    
    router.patch(`/non-conformances/${id}/status`,
      { 
        status: newStatus,
        comment: comment 
      },
      {
        preserveState: false,
        preserveScroll: false,
        onSuccess: (response) => {
          // Close modal
          setViewingReport(null);
          setCommentText('');
          
          // Show success message
          const successMessage = newStatus === 'closed' 
            ? 'Non-conformance closed successfully!' 
            : 'Non-conformance reopened successfully!';
          
          showAlert.success(response?.message || successMessage);
          
          // Reload after 1.5 seconds
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        },
        onError: (errors) => {
          console.error('Failed to update status', errors);
          showAlert.error('Failed to update status. Please try again.');
        },
        onFinish: () => {
          setIsUpdating(false);
        }
      }
    );
  };

  const handleUpdateWithComment = async () => {
    // Add confirmation dialog
    const confirmed = await showAlert.confirm(
      `Are you sure you want to ${viewingReport?.status === 'open' ? 'closed' : 'reopen'} this non-conformance?`,
      'Confirm Action'
    );
    
    if (confirmed) {
      const newStatus = viewingReport?.status === 'open' ? 'closed' : 'open';
      handleStatusChange(viewingReport.id, newStatus, commentText.trim() || null);
    }
  };

  // Helper function to display status
  const displayStatus = (status) => {
    return status === 'closed' ? 'closed' : status;
  };

  return (
    <AppLayout user={auth.user}>
      <Head title={title} />

      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-200 space-y-4 md:space-y-0">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="mr-2 text-sm text-gray-600">Show</label>
                <select
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                  value={entriesToShow}
                  onChange={(e) => { setEntriesToShow(Number(e.target.value)); setCurrentPage(1); }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="ml-2 text-sm text-gray-600">entries</span>
              </div>

              <div>
                <label className="mr-2 text-sm text-gray-600">Status</label>
                <select
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                >
                  <option value="all">All</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="border border-gray-300 rounded px-4 py-1 pl-8 text-sm w-64"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
              <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subcon Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inspector</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Open</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date Close</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.length > 0 ? paginated.map((nc, index) => (
                  <tr key={nc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{startIndex + index + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{nc.inspection?.project?.name ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{nc.inspection?.topic?.name ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{nc.inspection?.subcon_company?.name ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{nc.inspection?.inspector?.name ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {nc.date_open ? new Date(nc.date_open).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {nc.date_close ? new Date(nc.date_close).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        nc.status === 'open'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {displayStatus(nc.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <button
                        className="text-blue-600 hover:text-blue-800 mr-4"
                        onClick={() => {
                          setViewingReport(nc);
                          setCommentText(''); // Reset comment when opening modal
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
                      No non-conformance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="flex justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing {filtered.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + entriesToShow, filtered.length)} of {filtered.length} entries
            </div>
            {totalPages > 1 && (
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >Previous</button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`px-3 py-1 rounded text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setCurrentPage(page)}
                  >{page}</button>
                ))}
                <button
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >Next</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewingReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-800">Non-Conformance Detail</h2>
                <button 
                  className="text-gray-500 hover:text-gray-700" 
                  onClick={() => {
                    setViewingReport(null);
                    setCommentText('');
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
                <div><p className="text-gray-500 font-medium">Project</p><p>{viewingReport.inspection?.project?.name ?? '-'}</p></div>
                <div><p className="text-gray-500 font-medium">Topic</p><p>{viewingReport.inspection?.topic?.name ?? '-'}</p></div>
                <div><p className="text-gray-500 font-medium">Subcon Company</p><p>{viewingReport.inspection?.subcon_company?.name ?? '-'}</p></div>
                <div><p className="text-gray-500 font-medium">Inspector</p><p>{viewingReport.inspection?.inspector?.name ?? '-'}</p></div>
                <div><p className="text-gray-500 font-medium">Date Open</p><p>{viewingReport.date_open ? new Date(viewingReport.date_open).toLocaleDateString() : '-'}</p></div>
                <div><p className="text-gray-500 font-medium">Date Close</p><p>{viewingReport.date_close ? new Date(viewingReport.date_close).toLocaleDateString() : '-'}</p></div>
                <div>
                  <p className="text-gray-500 font-medium">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${viewingReport.status === 'open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {displayStatus(viewingReport.status)}
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-500 font-medium text-sm">Description</p>
                <p className="text-sm mt-1">{viewingReport.inspection?.description ?? '-'}</p>
              </div>

              {/* Display existing comment */}
              {viewingReport.comment && (
                <div className="mb-4">
                  <p className="text-gray-500 font-medium text-sm">Previous Comment</p>
                  <p className="text-sm mt-1 bg-gray-50 p-3 rounded">{viewingReport.comment}</p>
                </div>
              )}

              {/* Comment input field for update */}
              <div className="mb-4">
                <label className="text-gray-500 font-medium text-sm block mb-2">
                  {viewingReport.status === 'open' ? 'Add closing comment (optional)' : 'Add reopening comment (optional)'}
                </label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Type your comment here... (you can skip if no comment needed)"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  onClick={() => {
                    setViewingReport(null);
                    setCommentText('');
                  }}
                >
                  Close
                </button>
                <button
                  className={`px-4 py-2 rounded text-white text-sm ${viewingReport.status === 'open' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={handleUpdateWithComment}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : (viewingReport.status === 'open' ? 'Mark as Closed' : 'Reopen')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default NonConformance;