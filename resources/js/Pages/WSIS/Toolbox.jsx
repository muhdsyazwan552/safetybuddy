import React, { useState, useRef, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react'; // Add usePage here
import AppLayout from '@/Pages/WSIS/Layout';

const Toolbox = ({ title, projects = [], toolboxTopics, toolboxTalks: talksFromLaravel, stafftoolbox }) => {

  // Get auth user from page props
  const { auth } = usePage().props;

  const [isTopicDropdownOpen, setIsTopicDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [statusFilter, setStatusFilter] = useState('All');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const dropdownRef = useRef(null);
  const [toolboxTalks, setToolboxTalks] = useState(talksFromLaravel || []);

  // Form handling
  const { data, setData, post, processing, errors, reset } = useForm({
    project_id: '',
    inspection_date: '',
    inspection_by: auth?.user?.id ?? '',
    conducted: 'yes',
    attendance: '',
    topics: [],
    attendance_photo: null,
    group_photo: null
  });


//   useEffect(() => {
//    console.log('=== TOOLBOX PROPS ===');
// console.log('toolboxTalks:', toolboxTalks);
// console.log('toolboxTopics:', toolboxTopics);
// console.log('projects:', projects);

// // Check if staff names are in the data
// if (toolboxTalks && toolboxTalks.length > 0) {
//     toolboxTalks.forEach((talk, idx) => {
//         console.log(`Talk ${idx}:`, {
//             id: talk.id,
//             staff_name: talk.staffinpection, // This should have the staff name
//             project: talk.project,
//             date: talk.date
//         });
//     });
// } else {
//       console.log('No toolbox talks found');
//     }

//     // Check auth user
//     console.log('Auth user:', auth?.user);
//   }, [toolboxTalks]); // Add toolboxTalks as dependency

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsTopicDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-hide success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleTopicSelection = (topicId) => {
    const currentTopics = [...data.topics];
    const topicIndex = currentTopics.indexOf(topicId);

    if (topicIndex === -1) {
      currentTopics.push(topicId);
    } else {
      currentTopics.splice(topicIndex, 1);
    }

    setData('topics', currentTopics);
  };

  const selectAllTopics = () => {
    const allTopicIds = toolboxTopics.map(topic => topic.id);
    setData('topics', allTopicIds);
  };

  const clearAllTopics = () => {
    setData('topics', []);
  };

  // Filter toolbox talks
  const filteredToolboxTalks = toolboxTalks.filter(talk => {
    const matchesSearch =
      (talk.name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (talk.project ?? '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'All' || talk.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).slice(0, entriesToShow);

  const handleDelete = (id) => {
    setToolboxTalks(toolboxTalks.filter(item => item.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (data.conducted === 'yes' && data.topics.length === 0) {
      alert('Please select at least one topic');
      return;
    }

    // Create temporary ID for optimistic update
    const tempId = Date.now();

    // Optimistically add to UI immediately
    const newToolboxTalk = {
      id: tempId,
      name: auth?.user?.name ?? 'Unknown',
      date: data.inspection_date,
      project: projects.find(p => p.id == data.project_id)?.name || 'N/A',
      topics: toolboxTopics.filter(topic => data.topics.includes(topic.id)).map(t => t.name),
      attendance: data.attendance,
      status: data.conducted,
      isOptimistic: true // flag for temporary item
    };

    setToolboxTalks(prev => [newToolboxTalk, ...prev]);

    const formData = new FormData();
    formData.append('project_id', data.project_id);
    formData.append('inspection_date', data.inspection_date);
    formData.append('inspection_by', data.inspection_by);
    formData.append('conducted', data.conducted);
    formData.append('attendance', data.attendance || 0);

    data.topics.forEach(topicId => {
      formData.append('topics[]', topicId);
    });

    if (data.attendance_photo) {
      formData.append('attendance_photo', data.attendance_photo);
    }
    if (data.group_photo) {
      formData.append('group_photo', data.group_photo);
    }

    post(route('toolbox.store'), formData, {
      onSuccess: (page) => {
        setIsCreatingNew(false);
        reset();
        setCustomTopic('');
        setSuccessMessage('Toolbox talk created successfully!');

        // Replace optimistic item with real data from server
        if (page.props.toolboxTalks) {
          setToolboxTalks(page.props.toolboxTalks);
        } else {
          // Fallback: remove optimistic item and let page update naturally
          setToolboxTalks(prev => prev.filter(item => item.id !== tempId));
        }
      },
      onError: (errors) => {
        console.log('Errors:', errors);
      }
    });
  };

  return (

    <div className="p-0">
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <div className="flex space-x-3">
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-800 transition-colors shadow-sm"
            onClick={() => setIsCreatingNew(true)}
          >
            Create New Toolbox Talk
          </button>
        </div>
      </div>

      {/* Create New Toolbox Talk Modal */}
      {isCreatingNew && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Create New Toolbox Talk</h2>
                  <p className="text-sm text-gray-600 mt-1">Fill in the details below</p>
                </div>
                <button
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  onClick={() => {
                    setIsCreatingNew(false);
                    reset();
                    setCustomTopic('');
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
                        onChange={(e) => setData('project_id', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        required
                      >
                        <option value="">Choose a project</option>
                        {projects.map(project => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ToolboxTalk By</label>
                      <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 flex items-center gap-2">
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-medium">{auth?.user?.name ?? 'Unknown User'}</span>
                        {/* <span className="ml-auto text-xs text-gray-400 italic">Auto-filled</span> */}
                      </div>
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

                {/* Toolbox Talk Details */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Toolbox Talk Details
                  </h3>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Was the toolbox talk conducted?</label>
                    <div className="flex space-x-6">
                      <label className="flex items-center p-3 border-2 border-transparent rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-200 bg-gray-50">
                        <input
                          type="radio"
                          name="conducted"
                          value="yes"
                          checked={data.conducted === 'yes'}
                          onChange={() => setData('conducted', 'yes')}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center p-3 border-2 border-transparent rounded-lg cursor-pointer transition-all duration-200 hover:border-gray-200 bg-gray-50">
                        <input
                          type="radio"
                          name="conducted"
                          value="no"
                          checked={data.conducted === 'no'}
                          onChange={() => setData('conducted', 'no')}
                          className="h-4 w-4 text-gray-600 focus:ring-gray-500"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">No</span>
                      </label>
                    </div>
                  </div>

                  {data.conducted === 'yes' && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Multi-select topic dropdown */}
                        <div className="col-span-2">
                          <div ref={dropdownRef} className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Topics</label>

                            {/* Dropdown trigger */}
                            <button
                              type="button"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-left flex justify-between items-center"
                              onClick={() => setIsTopicDropdownOpen(!isTopicDropdownOpen)}
                            >
                              <span>
                                {data.topics.length === 0
                                  ? 'Select topics'
                                  : `${data.topics.length} topic${data.topics.length !== 1 ? 's' : ''} selected`
                                }
                              </span>
                              <svg
                                className={`h-5 w-5 text-gray-400 transform transition-transform ${isTopicDropdownOpen ? 'rotate-180' : ''}`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            </button>

                            {/* Dropdown menu */}
                            {isTopicDropdownOpen && (
                              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                <div className="p-2 border-b border-gray-200 bg-gray-50 flex justify-between">
                                  <button
                                    type="button"
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                    onClick={selectAllTopics}
                                  >
                                    Select All
                                  </button>
                                  <button
                                    type="button"
                                    className="text-xs text-gray-600 hover:text-gray-800"
                                    onClick={clearAllTopics}
                                  >
                                    Clear All
                                  </button>
                                </div>

                                <div className="p-2">

                                  {toolboxTopics.map((topicObj, index) => (
                                    <label key={index} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={data.topics.includes(topicObj.id)} // Check by ID
                                        onChange={() => handleTopicSelection(topicObj.id)} // Pass ID
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                      />
                                      <span className="ml-2 text-sm text-gray-700">{topicObj.name}</span>
                                    </label>
                                  ))}

                                </div>
                              </div>
                            )}

                            {/* Selected topics preview */}

                            {data.topics.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {data.topics.map((topicId, index) => {
                                  const topic = toolboxTopics.find(t => t.id === topicId);
                                  return (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {topic ? topic.name : 'Unknown Topic'} {/* Show name */}
                                      <button
                                        type="button"
                                        onClick={() => handleTopicSelection(topicId)}
                                        className="ml-1.5 inline-flex rounded-full flex-shrink-0 p-0.5 text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                                      >
                                        <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                                          <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                                        </svg>
                                      </button>
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Total Attendance</label>
                          <input
                            type="number"
                            value={data.attendance}
                            onChange={(e) => setData('attendance', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Number of attendees"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Attendance Form Photo</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors duration-200">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setData('attendance_photo', e.target.files[0])}
                              className="hidden"
                              id="attendance-photo"
                            />
                            <label htmlFor="attendance-photo" className="cursor-pointer">
                              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm text-gray-600">Click to upload attendance form</span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Group Photo</label>
                          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors duration-200">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => setData('group_photo', e.target.files[0])}
                              className="hidden"
                              id="group-photo"
                            />
                            <label htmlFor="group-photo" className="cursor-pointer">
                              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm text-gray-600">Click to upload group photo</span>
                            </label>
                          </div>
                        </div>
                      </div>

                    </>
                  )}

                  {data.conducted === 'no' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="text-yellow-800 text-sm">
                          No additional information required for non-conducted toolbox talks.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
                    onClick={() => {
                      setIsCreatingNew(false);
                      reset();
                      setCustomTopic('');
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-ink-900 rounded-lg hover:from-brand-400 hover:to-brand-500 transition-all duration-200 font-medium shadow-md hover:shadow-lg disabled:opacity-50"
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
                      'Save Toolbox Talk'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Rest of your component remains the same */}
      {/* Filters and Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Table Header with Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-200 space-y-4 md:space-y-0">
          <div className="flex flex-wrap items-center space-x-4">
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

            <div>
              <label className="mr-2 text-sm text-gray-600">Conducted</label>
              <select
                className="border border-gray-300 rounded px-3 py-1 text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search toolbox talks..."
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  INSPECTION NAME
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Topic
                </th>
                <th scope="col" className="px-0 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TOTAL ATTENDED
                </th>
                <th scope="col" className="px-0 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CONDUCTED
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredToolboxTalks.map((talk, index) => (
                <tr key={talk.id} className="hover:bg-gray-50"><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {new Date(talk.date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {talk.project}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {talk.staffinpection || 'Unknown Inspector'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {talk.topics.join(', ') || '-'}
                  </td>
                  <td className="px-12 py-4 text-sm text-gray-800">
                    {talk.attendance || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${talk.status === 'yes'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                      }`}>
                      {talk.status === 'yes' ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-4">
                      <button className="text-blue-600 hover:text-blue-800">
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-800">
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => handleDelete(talk.id)}
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
            Showing 1 to {filteredToolboxTalks.length} of {toolboxTalks.length} entries
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

  );
};

export default Toolbox;