import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import Toolbox from './Toolbox';
import { showAlert } from '@/Helpers/alert';

const Inspection = ({
  title,
  auth,
  projects = [],
  auth_inspector = null,
  all_companies = [],
  topics = [],
  categories = [],
  inspections: initialInspections = [],
  toolboxTopics = [],
  toolboxCategories = [],
  toolboxTalks = [],
  projectStaff = {},
  visits = []

}) => {
  const [availableCompanies, setAvailableCompanies] = useState([]);
  const [visitStatus, setVisitStatus] = useState('All');
  const [visitToolbox, setVisitToolbox] = useState('All');
  const [visitSearch, setVisitSearch] = useState('');
  const [visitPage, setVisitPage] = useState(1);
  const visitPageSize = 15;

  const filteredVisits = visits.filter((v) => {
    const text = `${v.project || ''} ${v.by || ''}`.toLowerCase();
    const toolboxOk =
      visitToolbox === 'All' ||
      (visitToolbox === 'none' && !v.talk) ||
      (visitToolbox === 'yes' && v.talk && v.talk.conducted) ||
      (visitToolbox === 'no' && v.talk && !v.talk.conducted);
    return text.includes(visitSearch.toLowerCase()) && (visitStatus === 'All' || v.status === visitStatus) && toolboxOk;
  });
  const visitPages = Math.max(1, Math.ceil(filteredVisits.length / visitPageSize));
  const pagedVisits = filteredVisits.slice((visitPage - 1) * visitPageSize, visitPage * visitPageSize);
  const [inspections, setInspections] = useState(initialInspections);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [inspectionItems, setInspectionItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [availableInspectors, setAvailableInspectors] = useState([]);

  // Form handling
  const { data, setData, post, processing, errors, reset } = useForm({
    project_id: '',
    inspection_date: '',
  });

  // Update available companies when project changes (for inspections)
  useEffect(() => {
    if (data.project_id) {
      const selectedProject = projects.find(p => p.id == data.project_id);
      if (selectedProject && selectedProject.assigned_companies && selectedProject.assigned_companies.length > 0) {
        setAvailableCompanies(selectedProject.assigned_companies);
      } else {
        setAvailableCompanies([]);
      }
    } else {
      setAvailableCompanies([]);
    }
  }, [data.project_id, projects]);

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
      id: Date.now(),
      company_id: '',
      inspection_name: '', // Still used for the name field
      inspector_id: auth_inspector?.id ?? '',
      location: '',
      evaluation: '',
      description: '',
      category_id: '',
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
    setInspectionItems(prev => prev.map(item =>
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
  const requiredFieldStyle = "after:content-['*'] after:ml-0.5 after:text-red-500";

  const handleDelete = async (id) => {
    const ok = await showAlert.confirmDelete(
      'The inspection together with its non-conformance / client complaint record will be permanently removed.',
      'Delete this inspection?'
    );
    if (ok) {
      try {
        const response = await fetch(`/inspections/${id}`, {
          method: 'DELETE',
          headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        const data = await response.json();

        if (data.success) {
          setInspections(inspections.filter(item => item.id !== id));
          showAlert.success('The inspection has been deleted.', 'Inspection deleted');
        } else {
          showAlert.error(data.message || 'The inspection could not be deleted.', 'Delete failed');
        }
      } catch (error) {
        console.error('Error:', error);
        showAlert.error('Something went wrong while deleting. Please try again.', 'Delete failed');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate main form fields
    if (!data.project_id) {
      showAlert.warning('Choose the project this inspection belongs to.', 'Project required');
      return;
    }

    if (!data.inspection_date) {
      showAlert.warning('Pick the date the inspection took place.', 'Date required');
      return;
    }

    // Validate all inspection items
    const validationErrors = [];

    inspectionItems.forEach((item, index) => {
      // if (!item.inspection_id) {
      //   validationErrors.push(`Item ${index + 1}: Inspection name is required`);
      // }
      if (!item.company_id) {
        validationErrors.push(`Item ${index + 1}: Subcontractor company is required`);
      }
      if (!item.location) {
        validationErrors.push(`Item ${index + 1}: Location is required`);
      }
      if (!item.category_id) {
        validationErrors.push(`Item ${index + 1}: Category is required`);
      }
      if (!item.topic_id) {
        validationErrors.push(`Item ${index + 1}: Sub topic is required`);
      }
      if (!item.evaluation) {
        validationErrors.push(`Item ${index + 1}: Evaluation is required`);
      }
      if (!item.description) {
        validationErrors.push(`Item ${index + 1}: Description is required`);
      }
    });

    if (validationErrors.length > 0) {
      showAlert.errors(validationErrors, 'Please complete the inspection items');
      return;
    }

    // Prepare data for submission
    const formData = {
      project_id: data.project_id,
      inspection_date: data.inspection_date,
      inspection_items: inspectionItems.map(item => ({
        subcon_company_id: item.company_id, // renamed — this is the subcon company
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
        setInspections(prev => [...result.inspections, ...prev]);
        setIsCreatingNew(false);
        setInspectionItems([]);
        reset();
        showAlert.success('Your inspections have been saved.', 'Inspections created');
      } else {
        if (result.errors) {
          showAlert.errors(Object.values(result.errors).flat(), 'Please check the form');
        } else {
          showAlert.error(result.message || 'The inspections could not be saved.', 'Save failed');
        }
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      showAlert.error('We could not reach the server. Please try again.', 'Save failed');
    }
  };

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setData('project_id', projectId);
    setAvailableCompanies([]);

    // ✅ Filter inspectors for the selected project
    // if (projectId && inspectors[projectId]) {
    //   setAvailableInspectors(inspectors[projectId]);
    // } else {
    //   setAvailableInspectors([]);
    // }
  };

  // Evaluation badge styling
  const getEvaluationBadge = (evaluation) => {
    const evaluationClasses = {
      good: 'bg-green-100 text-green-800',
      poor: 'bg-orange-100 text-orange-800',
      nonconformance: 'bg-red-100 text-red-800',
      clientcomplaint: 'bg-purple-100 text-purple-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${evaluationClasses[evaluation] || 'bg-gray-100 text-gray-800'}`}>
        {evaluation?.replace(/([A-Z])/g, ' $1').trim() || evaluation}
      </span>
    );
  };

  return (
    <AppLayout user={auth.user}>
      <Head title={title} />

      <div className="p-6">
        {/* Site visits - toolbox talks and inspections in ONE table (older records included) */}
        <section id="visits" className="scroll-mt-20">
          <div className="mb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Toolbox talks &amp; inspections</h1>
                <p className="text-sm text-gray-500">One row per site visit. Open a row to see the toolbox talk first, then its inspections.</p>
              </div>
              <Link href="/site-visits/create" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-800">
                + New site visit
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-200 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <select className="rounded border border-gray-300 px-3 py-1 text-sm" value={visitStatus} onChange={(e) => { setVisitStatus(e.target.value); setVisitPage(1); }}>
                  <option value="All">All status</option>
                  <option value="pending_verification">Pending verification</option>
                  <option value="verified">Verified</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Returned</option>
                </select>
                <select className="rounded border border-gray-300 px-3 py-1 text-sm" value={visitToolbox} onChange={(e) => { setVisitToolbox(e.target.value); setVisitPage(1); }}>
                  <option value="All">Toolbox: all</option>
                  <option value="yes">Conducted</option>
                  <option value="no">Not conducted</option>
                  <option value="none">No toolbox record</option>
                </select>
              </div>
              <input
                type="text"
                placeholder="Search project or inspector..."
                className="w-full rounded border border-gray-300 px-4 py-1 text-sm md:w-64"
                value={visitSearch}
                onChange={(e) => { setVisitSearch(e.target.value); setVisitPage(1); }}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-3 w-12">#</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Recorded by</th>
                    <th className="px-4 py-3">Toolbox talk</th>
                    <th className="px-4 py-3">Inspections</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {pagedVisits.length === 0 && (
                    <tr><td colSpan="8" className="px-4 py-10 text-center text-gray-500">No site visits found</td></tr>
                  )}
                  {pagedVisits.map((v, n) => {
                    const counts = {};
                    v.inspections.forEach((i) => { counts[i.evaluation] = (counts[i.evaluation] || 0) + 1; });
                    return (
                      <tr key={v.key} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{(visitPage - 1) * visitPageSize + n + 1}</td>
                        <td className="whitespace-nowrap px-4 py-3">{v.date ? new Date(`${v.date}T00:00:00`).toLocaleDateString() : '-'}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{v.project || '-'}</td>
                        <td className="px-4 py-3">{v.by || '-'}</td>
                        <td className="px-4 py-3">
                          {v.talk ? (
                            <span className={`rounded-full px-2 py-1 text-xs font-semibold ${v.talk.conducted ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {v.talk.conducted ? 'Conducted' : 'Not conducted'}
                            </span>
                          ) : <span className="text-gray-400">-</span>}
                          {v.talk && <span className="ml-2 text-xs text-gray-500">{v.talk.attended} present</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-gray-800">{v.inspections.length}</span>
                            {Object.entries(counts).map(([ev, c]) => (
                              <span key={ev} title={ev}>{getEvaluationBadge(ev)}<span className="ml-0.5 text-xs text-gray-500">×{c}</span></span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                            { pending_verification: 'bg-amber-100 text-amber-800', verified: 'bg-blue-100 text-blue-800', approved: 'bg-emerald-100 text-emerald-800', rejected: 'bg-red-100 text-red-800' }[v.status] || 'bg-gray-100 text-gray-700'
                          }`}>
                            {{ pending_verification: 'Pending verification', verified: 'Verified', approved: 'Approved', rejected: 'Returned' }[v.status] || v.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/site-visits/${v.key}`} className="font-semibold text-blue-600 hover:text-blue-800">View</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <span>{filteredVisits.length} site visit(s)</span>
              <div className="flex items-center gap-2">
                <button className="rounded border border-gray-300 bg-white px-3 py-1 disabled:opacity-50" disabled={visitPage === 1} onClick={() => setVisitPage((p) => Math.max(1, p - 1))}>Previous</button>
                <span className="text-xs">Page {visitPage} of {visitPages}</span>
                <button className="rounded border border-gray-300 bg-white px-3 py-1 disabled:opacity-50" disabled={visitPage === visitPages} onClick={() => setVisitPage((p) => Math.min(visitPages, p + 1))}>Next</button>
              </div>
            </div>
          </div>
        </section>

        <details className="mt-10 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <summary className="cursor-pointer text-sm font-bold text-gray-700">Create or manage individual toolbox talks and inspections</summary>
          <div className="mt-6">
        {/* 1 · Toolbox Talks (first) */}
        <section id="toolbox" className="scroll-mt-20">
          <Toolbox
            embedded
            title="Toolbox Talks"
            projects={projects}
            toolboxTopics={toolboxCategories}
            toolboxTalks={toolboxTalks}
            projectStaff={projectStaff}
          />
        </section>

        <hr className="my-10 border-t-2 border-gray-200" />

        {/* 2 · Inspections */}
        <section id="inspections" className="scroll-mt-20">
        {(
          <>
            {/* Create New Inspection Modal */}
            {isCreatingNew && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
                  {/* Modal Header */}
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
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldStyle}`}>
                              Select Project
                            </label>
                            <select
                              value={data.project_id}
                              onChange={handleProjectChange}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                            <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldStyle}`}>
                              Inspection Date
                            </label>
                            <input
                              type="date"
                              value={data.inspection_date}
                              onChange={(e) => setData('inspection_date', e.target.value)}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Inspection Items */}
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">Inspection Items</h3>
                          <button
                            type="button"
                            onClick={addInspectionItem}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
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
                                <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldStyle}`}>
                                  Subcontractor Company
                                </label>
                                <select
                                  value={item.company_id}
                                  onChange={(e) => updateInspectionItem(item.id, 'company_id', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  required
                                  disabled={!data.project_id || availableCompanies.length === 0}
                                >
                                  <option value="">Select a subcontractor company</option>
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
                                  <p className="text-sm text-yellow-600 mt-1">No subcontractor companies assigned to this project</p>
                                )}
                              </div>

                              {/* Changed: Inspector Name (Role ID 7) - replaces Inspection Name */}
                              <div>
                                <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldStyle}`}>
                                  Inspection By
                                </label>
                                {/* Inspector Field - Auto-filled */}
                                <div>
                                  <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="text-sm font-medium">
                                      {auth_inspector?.name || auth?.user?.name || 'No inspector assigned'}
                                    </span>
                                    <span className="ml-auto text-xs text-gray-400 italic">Auto-filled</span>
                                  </div>

                                  {/* Hidden input to store the value */}
                                  <input
                                    type="hidden"
                                    name="inspector_id"
                                    value={auth_inspector?.id || ''}
                                  />
                                </div>
                                {!auth_inspector && (
                                  <p className="text-sm text-yellow-600 mt-1">No inspector profile linked to your account.</p>
                                )}
                                {!data.project_id && (
                                  <p className="text-sm text-gray-500 mt-1">Please select a project first.</p>
                                )}
                              </div>

                              <div>
                                <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldStyle}`}>
                                  Location
                                </label>
                                <input
                                  type="text"
                                  value={item.location}
                                  onChange={(e) => updateInspectionItem(item.id, 'location', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  placeholder="Enter location"
                                  required
                                />
                              </div>
                              <div>
                                <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldStyle}`}>
                                  Category
                                </label>
                                <select
                                  value={item.category_id || ''}
                                  onChange={(e) => {
                                    updateInspectionItem(item.id, 'category_id', e.target.value);
                                    updateInspectionItem(item.id, 'topic_id', '');
                                  }}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  required
                                >
                                  <option value="">Select a category</option>
                                  {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.code} · {cat.name}</option>
                                  ))}
                                </select>
                              </div>
                              {item.category_id && (
                                <div>
                                  <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldStyle}`}>
                                    Sub topic
                                  </label>
                                  <select
                                    value={item.topic_id}
                                    onChange={(e) => updateInspectionItem(item.id, 'topic_id', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                  >
                                    <option value="">Select a sub topic</option>
                                    {(categories.find(cat => String(cat.id) === String(item.category_id))?.items || []).map(t => (
                                      <option key={t.id} value={t.id}>{t.code} · {t.name}</option>
                                    ))}
                                  </select>
                                </div>
                              )}
                              <div>
                                <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldStyle}`}>
                                  Evaluation
                                </label>
                                <select
                                  value={item.evaluation}
                                  onChange={(e) => updateInspectionItem(item.id, 'evaluation', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                  required
                                >
                                  <option value="">Select evaluation</option>
                                  <option value="good">Good</option>
                                  <option value="poor">Poor</option>
                                  <option value="nonconformance">Nonconformance</option>
                                  <option value="clientcomplaint">Client Complaint</option>
                                </select>
                              </div>
                            </div>

                            <div className="mb-4">
                              <label className={`block text-sm font-medium text-gray-700 mb-2 ${requiredFieldStyle}`}>
                                Description
                              </label>
                              <textarea
                                value={item.description}
                                onChange={(e) => updateInspectionItem(item.id, 'description', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                                rows="3"
                                placeholder="Enter detailed inspection description..."
                                required
                              ></textarea>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Inspection Photos</label>
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors">
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
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
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
                          className="px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-ink-900 rounded-lg hover:from-brand-400 hover:to-brand-500 font-medium shadow-md hover:shadow-lg disabled:opacity-50"
                          disabled={processing}
                        >
                          {processing ? 'Saving...' : 'Save Inspection'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Filters and Table for Inspections */}
            <div className="flex justify-between items-center mb-5">
              <h1 className="text-2xl font-bold text-gray-800">Inspections</h1>
              <button
                className="sb-create"
                onClick={() => setIsCreatingNew(true)}
              >
                Create New Inspection
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

                  <div>
                    <label className="mr-2 text-sm text-gray-600">Evaluation</label>
                    <select
                      className="border border-gray-300 rounded px-3 py-1 text-sm"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="All">All</option>
                      <option value="good">Good</option>
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
                    <tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedInspections.length > 0 ? (
                      paginatedInspections.map((inspection, rowNo) => (
                        <tr key={inspection.id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{startIndex + rowNo + 1}</td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {inspection.project?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {inspection.inspector?.name}
                          </td>

                          <td className="px-6 py-4 text-sm text-gray-800">
                            {inspection.subconCompany?.name || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-800">
                            {inspection.location || '-'}
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
                        <td colSpan="9" className="px-6 py-4 text-center text-sm text-gray-500">
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
          </>
        )}
        </section>
          </div>
        </details>
      </div>
    </AppLayout>
  );
};

export default Inspection;