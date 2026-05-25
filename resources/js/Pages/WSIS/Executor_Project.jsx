import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import { showAlert } from '@/Helpers/alert';

const ExecutorManagement = ({ title, executors: initialExecutors }) => {
  const { companies } = usePage().props;
  const { errors } = usePage().props;
  const [executorCompanies, setExecutorCompanies] = useState(initialExecutors || []);
  const { flash } = usePage().props;

  // State for UI controls
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddExecutorModal, setShowAddExecutorModal] = useState(false);

  // Show flash messages
  useEffect(() => {
    if (flash?.success) {
      showAlert.success(flash.success);
    }
    if (flash?.error) {
      showAlert.error(flash.error);
    }
  }, [flash]);

  // Form handling
  const { data, setData, post, processing, reset } = useForm({
    name: '',
    email: '',
    contact: '',
    address: ''
  });

  // Filter companies based on search
  const filteredCompanies = companies.filter(company => {
    const search = searchTerm.toLowerCase();
    return (
      company.name?.toLowerCase().includes(search) ||
      company.email?.toLowerCase().includes(search) ||
      company.contact?.toLowerCase().includes(search)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / entriesToShow);
  const startIndex = (currentPage - 1) * entriesToShow;
  const paginatedCompanies = filteredCompanies.slice(startIndex, startIndex + entriesToShow);

  // Handle adding new executor
  const handleAddExecutor = () => {
    post(route('admin.company.store'), {
      data,
      onSuccess: () => {
        reset();
        setShowAddExecutorModal(false);
        showAlert.success('Executor company created successfully!');
      },
      onError: (errors) => {
        showAlert.error('Failed to create executor company');
      },
      preserveScroll: true
    });
  };

  // Handle delete company
  const handleDelete = async (id, name) => {
    const confirmed = await showAlert.confirm(
      `Are you sure you want to delete "${name}"?`,
      'Confirm Deletion'
    );

    if (confirmed) {
      router.delete(`/admin/companies/${id}`, {
        onSuccess: () => {
          showAlert.success('Company deleted successfully!');
        },
        onError: () => {
          showAlert.error('Failed to delete company');
        }
      });
    }
  };

  const getCompanyInitials = (companyName) => {
    if (!companyName) return '??';
    const words = companyName.trim().split(/\s+/);
    const firstTwoWords = words.slice(0, 2);
    const initials = firstTwoWords
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    return initials;
  };

  return (
    <AppLayout>
      <Head title={title} />

      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">Executor Companies</h1>
          <button
            onClick={() => setShowAddExecutorModal(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-800 transition-colors shadow-sm"
          >
            Add New Executor
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Table Header with Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-200 space-y-4 md:space-y-0">
            <div className="flex flex-wrap items-center space-x-4">
              <div>
                <label className="mr-2 text-sm text-gray-600">Show</label>
                <select
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                  value={entriesToShow}
                  onChange={(e) => {
                    setEntriesToShow(Number(e.target.value));
                    setCurrentPage(1);
                  }}
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
                placeholder="Search executors..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedCompanies.length > 0 ? (
                  paginatedCompanies.map((company, index) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                            {getCompanyInitials(company.name)}
                          </div>
                          <div className="font-medium text-gray-900">{company.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-600">{company.email || '-'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span className="text-sm text-gray-500">{company.contact || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full 
                          ${company.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {company.status || 'active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-4">
                          <Link
                            href={route('executor.staff', { id: company.id })}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Staff
                          </Link>
                          <button
                            className="text-green-600 hover:text-green-800"
                            onClick={() => {
                              // Handle edit
                              showAlert.info('Edit functionality coming soon');
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(company.id, company.name)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      No executor companies found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
            <div className="mb-4 md:mb-0 text-sm text-gray-600">
              Showing {filteredCompanies.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + entriesToShow, filteredCompanies.length)} of {filteredCompanies.length} entries
            </div>
            {totalPages > 1 && (
              <div className="flex space-x-2">
                <button
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`px-3 py-1 rounded text-sm ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-100'}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Executor Modal */}
        {showAddExecutorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">Add New Executor Company</h2>
                    <p className="text-sm text-gray-600 mt-1">Fill in the company details</p>
                  </div>
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      setShowAddExecutorModal(false);
                      reset();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                {errors && Object.keys(errors).length > 0 && (
                  <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
                    {Object.values(errors).map((error, index) => (
                      <p key={index} className="text-sm">{error}</p>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={data.name}
                      onChange={(e) => {
                        const capitalized = e.target.value
                          .toLowerCase()
                          .replace(/(^\w|\s\w)/g, (letter) => letter.toUpperCase());
                        setData('name', capitalized);
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email *</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={data.contact}
                      onChange={(e) => setData('contact', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows="3"
                      value={data.address}
                      onChange={(e) => setData('address', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowAddExecutorModal(false);
                      reset();
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddExecutor}
                    disabled={processing}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                  >
                    {processing ? 'Creating...' : 'Add Executor'}
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

export default ExecutorManagement;