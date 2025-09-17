import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Pages/Admin/Layout';

const Inspection = ({ title, auth, projects = [], all_companies = [], topics = [], inspections: initialInspections = [] }) => {
  const { props } = usePage();
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [inspections, setInspections] = useState(initialInspections);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [inspectionItems, setInspectionItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Form handling
  const { data, setData, post, processing, errors, reset } = useForm({
    project_id: '',
    inspection_date: '',
  });

  // Update available companies when project changes
  useEffect(() => {
    if (data.project_id) {
      const selectedProject = projects.find(p => p.id == data.project_id);
      if (selectedProject && selectedProject.assigned_companies && selectedProject.assigned_companies.length > 0) {
        setAvailableCompanies(selectedProject.assigned_companies);
      } else {
        setAvailableCompanies([]);
      }
    } else {
      setAvailableCompanies(all_companies);
    }
  }, [data.project_id, projects, all_companies]);

  // Initialize with one empty inspection item
  useEffect(() => {
    if (isCreatingNew && inspectionItems.length === 0) {
      addInspectionItem();
    }
  }, [isCreatingNew]);

  // Load inspections from server
  useEffect(() => {
    setInspections(initialInspections);
  }, [initialInspections]);

  const addInspectionItem = () => {
    const newItem = {
      id: Date.now(), // temporary unique ID
      company_id: '',
      inspection_name: '',
      location: '',
      evaluation: '',
      description: '',
      topic_id: '',
      photos: []
    };
    setInspectionItems([...inspectionItems, newItem]);
  };

  const removeInspectionItem = (id) => {
    if (inspectionItems.length > 1) {
      setInspectionItems(inspectionItems.filter(item => item.id !== id));
    }
  };

  const updateInspectionItem = (id, field, value) => {
    setInspectionItems(inspectionItems.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handlePhotoUpload = (e, id) => {
    const files = Array.from(e.target.files);
    updateInspectionItem(id, 'photos', [...(inspectionItems.find(item => item.id === id).photos || []), ...files]);
  };

  // Filter inspections
  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch =
      inspection.inspection_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.executor_company?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.project?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || inspection.evaluation === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInspections.length / entriesToShow);
  const startIndex = (currentPage - 1) * entriesToShow;
  const paginatedInspections = filteredInspections.slice(startIndex, startIndex + entriesToShow);

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this inspection?')) {
      // Send delete request to server
      fetch(`/inspections/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
        },
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setInspections(inspections.filter(item => item.id !== id));
        } else {
          alert('Error deleting inspection');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error deleting inspection');
      });
    }
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare data for submission
    const formData = {
      project_id: data.project_id,
      inspection_date: data.inspection_date,
      inspection_items: inspectionItems.map(item => ({
        company_id: item.company_id,
        inspection_name: item.inspection_name,
        location: item.location,
        topic_id: item.topic_id,
        evaluation: item.evaluation,
        description: item.description,
      }))
    };

    try {
      const response = await fetch('/inspections/multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.success) {
        // Add new inspections to the state
        setInspections(prev => [...prev, ...result.inspections]);
        
        // Close modal and reset form
        setIsCreatingNew(false);
        setInspectionItems([]);
        reset();
        
        // Show success message
        alert('Inspections created successfully!');
        
        // Refresh the page to get updated data from server
        window.location.reload();
      } else {
        alert('Error: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while submitting the form.');
    }
  };

  // When project is selected
  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setData('project_id', projectId);
  };

  // Evaluation badge styling
  const getEvaluationBadge = (evaluation) => {
    const evaluationClasses = {
      good: 'bg-green-100 text-green-800',
      moderate: 'bg-yellow-100 text-yellow-800',
      poor: 'bg-orange-100 text-orange-800',
      nonconformance: 'bg-red-100 text-red-800',
      clientcomplaint: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${evaluationClasses[evaluation] || 'bg-gray-100 text-gray-800'}`}>
        {evaluation}
      </span>
    );
  };

  return (
    <AppLayout user={auth.user}>
      <Head title={title} />

      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <div className="flex space-x-3">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              onClick={() => setIsCreatingNew(true)}
            >
              Create New Inspection
            </button>
          </div>
        </div>

        {/* Create New Inspection Modal */}
        {isCreatingNew && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Create New Inspection</h2>
                    <p className="text-sm text-gray-600 mt-1">Fill in the inspection details</p>
                  </div>
                  <button
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setInspectionItems([]);
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
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Project Selection */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Project Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
                        <select
                          value={data.project_id}
                          onChange={handleProjectChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          required
                        >
                          <option value="">Choose a project</option>
                          {projects && projects.map(project => (
                            <option key={project.id} value={project.id}>
                              {project.name} {project.location && `(${project.location})`}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                          type="date"
                          value={data.inspection_date}
                          onChange={(e) => setData('inspection_date', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Inspection Items */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Inspection Items
                      </h3>
                      <button
                        type="button"
                        onClick={addInspectionItem}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                      >
                        + Add Another Item
                      </button>
                    </div>

                    {inspectionItems.map((item, index) => (
                      <div key={item.id} className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-medium text-gray-700">Item #{index + 1}</h4>
                          {inspectionItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeInspectionItem(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Company</label>
                            <select
                              value={item.company_id}
                              onChange={(e) => updateInspectionItem(item.id, 'company_id', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                              required
                              disabled={!data.project_id || availableCompanies.length === 0}
                            >
                              <option value="">Choose a company</option>
                              {availableCompanies.map(company => (
                                <option key={company.id} value={company.id}>
                                  {company.name}
                                </option>
                              ))}
                            </select>
                            {!data.project_id && (
                              <p className="text-sm text-gray-500 mt-1">Please select a project first</p>
                            )}
                            {data.project_id && availableCompanies.length === 0 && (
                              <p className="text-sm text-yellow-600 mt-1">No companies assigned to this project</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Inspection Name</label>
                            <input
                              type="text"
                              value={item.inspection_name}
                              onChange={(e) => updateInspectionItem(item.id, 'inspection_name', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                              placeholder="Enter inspection name"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <input
                              type="text"
                              value={item.location}
                              onChange={(e) => updateInspectionItem(item.id, 'location', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                              placeholder="Enter location"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                            <select
                              value={item.topic_id}
                              onChange={(e) => updateInspectionItem(item.id, 'topic_id', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                              required
                            >
                              <option value="">Select a topic</option>
                              {topics.map(topic => (
                                <option key={topic.id} value={topic.id}>
                                  {topic.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Evaluation</label>
                            <select
                              value={item.evaluation}
                              onChange={(e) => updateInspectionItem(item.id, 'evaluation', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                              required
                            >
                              <option value="">Select evaluation</option>
                              <option value="good">Good</option>
                              <option value="moderate">Moderate</option>
                              <option value="poor">Poor</option>
                              <option value="nonconformance">Nonconformance</option>
                              <option value="clientcomplaint">Client Complaint</option>
                            </select>
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                          <textarea
                            value={item.description}
                            onChange={(e) => updateInspectionItem(item.id, 'description', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                            rows="3"
                            placeholder="Enter detailed inspection description..."
                            required
                          ></textarea>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Inspection Photos</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors duration-200">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => handlePhotoUpload(e, item.id)}
                              className="hidden"
                              id={`inspection-photos-${item.id}`}
                            />
                            <label htmlFor={`inspection-photos-${item.id}`} className="cursor-pointer">
                              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="block text-sm font-medium text-gray-600 mb-1">Upload photos for this item</span>
                              <span className="text-xs text-gray-500">Click to browse or drag and drop</span>
                            </label>
                          </div>
                          {item.photos && item.photos.length > 0 && (
                            <p className="text-xs text-gray-500 mt-2">{item.photos.length} file(s) selected</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                      onClick={() => {
                        setIsCreatingNew(false);
                        setInspectionItems([]);
                        reset();
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                      disabled={processing}
                    >
                      {processing ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </span>
                      ) : (
                        'Save Inspection'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Table for Inspections */}
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

              <div>
                <label className="mr-2 text-sm text-gray-600">Evaluation</label>
                <select
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  <option value="good">Good</option>
                  <option value="moderate">Moderate</option>
                  <option value="poor">Poor</option>
                  <option value="nonconformance">Nonconformance</option>
                  <option value="clientcomplaint">Client Complaint</option>
                </select>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search inspections..."
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Evaluation
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topic
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedInspections.length > 0 ? (
                  paginatedInspections.map((inspection) => (
                    <tr key={inspection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {inspection.inspection_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {new Date(inspection.inspection_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {inspection.executor_company?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {inspection.project?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {inspection.location}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEvaluationBadge(inspection.evaluation)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800">
                        {inspection.topic?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-4">
                          <Link 
                            href={route('inspections.show', inspection.id)} 
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View
                          </Link>
                          <Link 
                            href={route('inspections.edit', inspection.id)} 
                            className="text-green-600 hover:text-green-800"
                          >
                            Edit
                          </Link>
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => handleDelete(inspection.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                      No inspections found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
            <div className="mb-4 md:mb-0 text-sm text-gray-600">
              Showing {filteredInspections.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + entriesToShow, filteredInspections.length)} of {filteredInspections.length} entries
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
      </div>
    </AppLayout>
  );
};

export default Inspection;