import React, { useEffect, useState, useMemo, useRef } from 'react';
import { usePage, useForm, Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';

const ProjectManagement = () => {
  const { projects: initialProjects = [], title, flash } = usePage().props || {};

  // Ensure executors is always an array
  const projectsWithExecutors = (initialProjects || []).map((project) => ({
    ...project,
    executors: Array.isArray(project.executors) ? project.executors : [],
    executorAssignments: Array.isArray(project.executorAssignments)
      ? project.executorAssignments
      : [],
  }));

  
  const [projects, setProjects] = useState(projectsWithExecutors);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showExecutorDropdown, setShowExecutorDropdown] = useState(null);
  

  // Form handling for create
  const { data: createData, setData: setCreateData, post, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm({
    name: '',
    location: '',
    start_date: '',
    end_date: '',
    status: 'pending',
  });

  // Form handling for update
  const { data: updateData, setData: setUpdateData, put, processing: updateProcessing, errors: updateErrors, reset: resetUpdate } = useForm({
    id: null,
    name: '',
    location: '',
    start_date: '',
    end_date: '',
    status: 'pending',
  });

  // Determine which form to use based on mode
  const isEditMode = !!updateData.id;
  const formData = isEditMode ? updateData : createData;
  const formErrors = isEditMode ? updateErrors : createErrors;
  const processing = isEditMode ? updateProcessing : createProcessing;

  // Add useEffect to close dropdown when modal opens/closes
  useEffect(() => {
    if (showProjectModal) {
      setShowExecutorDropdown(null);
    }
  }, [showProjectModal]);

  // Search + pagination
  const filteredProjects = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    const list = q
      ? projects.filter(
        (p) =>
          (p.name || '').toLowerCase().includes(q) ||
          (p.location || '').toLowerCase().includes(q)
      )
      : projects;

    return list;
  }, [projects, searchTerm]);

  const itemsPerPage = entriesToShow;
  const totalFiltered = filteredProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleProjects = filteredProjects.slice(startIndex, startIndex + itemsPerPage);

  // CRUD Operations
const handleCreateProject = (e) => {
  e.preventDefault();
  post(route('admin.projects.store'), {
    preserveScroll: true,
    onSuccess: (page) => {
      // Append new project from server response (optional: return it from controller)
      if (page.props.project) {
        setProjects((prev) => [...prev, page.props.project]);
      }
      resetCreate();
      setShowProjectModal(false);

      window.location.reload();
    },
  });
};

const handleUpdateProject = (e) => {
  e.preventDefault();
  put(route('admin.projects.update', updateData.id), {
    preserveScroll: true,
    onSuccess: () => {
      
      resetUpdate();
      setShowProjectModal(false);

       window.location.reload();
    },
  });
};

  const handleEdit = (project) => {
    setUpdateData({
      id: project.id,
      name: project.name || '',
      location: project.location || '',
      start_date: project.start_date || '',
      end_date: project.end_date || '',
      status: project.status || 'pending',
    });
    setShowProjectModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this project?')) {
      // Use Inertia's delete method for proper handling
      router.delete(route('admin.projects.destroy', id), {
        onSuccess: () => {
          router.reload({ only: ['projects'] });
        },
        onError: (errors) => {
          console.error('Delete error:', errors);
          alert('Failed to delete project. Please try again.');
        }
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (isEditMode) {
      setUpdateData(name, value);
    } else {
      setCreateData(name, value);
    }
  };

  const closeModal = () => {
    setShowProjectModal(false);
    if (isEditMode) {
      resetUpdate();
    } else {
      resetCreate();
    }
  };

  // Toggle executor dropdown for a specific project
  const toggleExecutorDropdown = (projectId) => {
    setShowExecutorDropdown((prev) => (prev === projectId ? null : projectId));
  };

  // Executor badges (companies only) - Updated with proper click outside handling
  const ExecutorBadges = ({ executorCompanies = [], projectId }) => {
    const dropdownRef = useRef(null);
    const displayedExecutors = executorCompanies.slice(0, 3);
    const extraCount = Math.max(0, executorCompanies.length - displayedExecutors.length);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setShowExecutorDropdown(null);
        }
      };

      if (showExecutorDropdown === projectId) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showExecutorDropdown, projectId]);

    return (
      <div className="inline-block" ref={dropdownRef}>
        {/* Top row: first 3 executors + +N if more */}
        <div
          className="flex items-center cursor-pointer"
          onClick={() => toggleExecutorDropdown(projectId)}
        >
          {displayedExecutors.map((executor, i) => (
            <div
              key={executor.id ?? i}
              className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-semibold -mr-1.5 border-2 border-white shadow-sm"
              style={{ zIndex: 10 + i }}
              title={executor.name}
            >
              {(executor.short_name || executor.name || '?').toString().slice(0, 3).toUpperCase()}
            </div>
          ))}

          {extraCount > 0 && (
            <div
              className="w-8 h-8 rounded-full bg-gray-100 text-gray-800 flex items-center justify-center text-xs font-medium border-2 border-white shadow-sm"
              title={`${extraCount} more`}
            >
              +{extraCount}
            </div>
          )}
        </div>

        {/* Dropdown list */}
        {showExecutorDropdown === projectId && (
          <div className="absolute top-50 mt-2 w-72 rounded-2xl shadow-xl bg-white ring-1 ring-black/10 z-50">
            <div className="py-2 max-h-72 overflow-y-auto divide-y divide-gray-100">
              {executorCompanies.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500">No executors</div>
              ) : (
                executorCompanies.map((ex) => (
                  <div
                    key={ex.id}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-sm font-semibold text-gray-800">{ex.name}</div>
                    <div className="text-xs text-gray-600 mt-0.5">
                      <span className="font-medium text-gray-700">Job:</span>{' '}
                      {ex.pivot?.role_assignment ?? 'N/A'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AppLayout>
      <Head title={title} />

      <div className="p-6 relative">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <div className="space-x-2">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
              onClick={() => {
                resetCreate();
                setShowProjectModal(true);
              }}
            >
              Create Project
            </button>
          </div>
        </div>

        {flash && flash.message && (
  <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
    {flash.message}
  </div>
)}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden ">
          {/* Table Header */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
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
                  {[10, 25, 50, 100].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <span className="ml-2 text-sm text-gray-600">entries</span>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search projects..."
                className="border border-gray-300 rounded px-4 py-1 pl-8 text-sm w-full md:w-64"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <svg className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto ">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 ">
                {visibleProjects.map((project, rowIndex) => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {startIndex + rowIndex + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{project.name}</td>


                    <td className="px-6 py-4 text-sm text-gray-800">{project.location}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {project.start_date} to {project.end_date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${project.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : project.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : project.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}
                      >
                        {(project.status || '').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-4">
                        <Link
                          href={project.id ? route('executor.project.detail', { id: project.id }) : '#'}
                          className="text-blue-600 hover:text-blue-900"
                          onClick={(e) => !project.id && e.preventDefault()}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path
                              fillRule="evenodd"
                              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </Link>


                        <button
                          onClick={() => handleEdit(project)}
                          className="text-blue-600 hover:text-blue-900 mr-3 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>

                        <button
                          onClick={() => handleDelete(project.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {visibleProjects.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-6 text-center text-sm text-gray-500">
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
            <div className="mb-4 md:mb-0 text-sm text-gray-600">
              Showing {totalFiltered === 0 ? 0 : startIndex + 1} to{' '}
              {Math.min(startIndex + itemsPerPage, totalFiltered)} of {totalFiltered} entries
            </div>
            <div className="flex space-x-2">
              <button
                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                {currentPage} / {totalPages}
              </span>
              <button
                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {isEditMode ? 'Edit Project' : 'Create New Project'}
              </h2>
              <form onSubmit={isEditMode ? handleUpdateProject : handleCreateProject}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Project Name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location*
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date*
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={formData.start_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      {formErrors.start_date && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.start_date}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date*
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={formData.end_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      {formErrors.end_date && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.end_date}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status*
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : isEditMode ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ProjectManagement;