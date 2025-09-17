import { useState, useEffect } from 'react';
import AppLayout from '@/Pages/Admin/Layout';
import Modal from '@/Components/Modal';
import { Head, useForm, router } from '@inertiajs/react';


export default function ExecutorProjectDetails({
    auth = {},
    title = '',
    project = {},
    executors = [],
    assignments = [],
    assignmentsPagination = {},
    availableExecutors = [],
    companies = [],
    availableEmployees = [],
    flash = {}
}) {
    const [showModal, setShowModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [successMessage, setSuccessMessage] = useState(flash.success || '');

    // Separate forms for create and update
    const { data: createData, setData: setCreateData, post, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm({
        executor_id: '',
        entity_type: 'CP',
        role_assignment: ''
    });

    const { data: updateData, setData: setUpdateData, put, processing: updateProcessing, errors: updateErrors, reset: resetUpdate } = useForm({
        executor_id: '',
        entity_type: 'CP',
        role_assignment: ''
    });

        const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Calculate pagination data
    const totalItems = assignmentsPagination?.total || assignments.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const currentAssignments = assignments.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (e) => {
        setItemsPerPage(Number(e.target.value));
        setCurrentPage(1); // Reset to first page when changing items per page
    };


    useEffect(() => {
        if (flash.success) {
            setSuccessMessage(flash.success);
            const timer = setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    const submitCreate = (e) => {
        e.preventDefault();
        post(route('projects.add-executor', project.id), {
            onSuccess: () => {
                setShowModal(false);
                resetCreate();
            },
            onError: (errors) => {
                console.error('Form submission errors:', errors);
            }
        });
    };

    const submitUpdate = (e) => {
        e.preventDefault();
        put(route('projects.update-assignment', editingAssignment.id), {
            onSuccess: () => {
                setShowModal(false);
                setEditingAssignment(null);
                resetUpdate();
            },
            onError: (errors) => {
                console.error('Form submission errors:', errors);
            }
        });
    };

    const handleEditAssignment = (assignment) => {
        setEditingAssignment(assignment);
        setUpdateData({
            executor_id: assignment.executor_id,
            entity_type: assignment.entity_type,
            role_assignment: assignment.role_assignment
        });
        setShowModal(true);
    };

    const handleRemoveAssignment = (assignmentId) => {
        if (confirm('Are you sure you want to remove this assignment?')) {
            router.delete(route('projects.remove-assignment', assignmentId), {
                onSuccess: () => {
                    setSuccessMessage('Assignment removed successfully');
                    const timer = setTimeout(() => {
                        setSuccessMessage('');
                    }, 3000);
                    return () => clearTimeout(timer);
                },
                onError: (errors) => {
                    console.error('Error removing assignment:', errors);
                    alert('Error removing assignment. Please try again.');
                }
            });
        }
    };

    // Check if we're in edit mode
    const isEditMode = !!editingAssignment;
    const currentData = isEditMode ? updateData : createData;
    const currentErrors = isEditMode ? updateErrors : createErrors;
    const currentProcessing = isEditMode ? updateProcessing : createProcessing;

    const handleEntityTypeChange = (value) => {
        if (isEditMode) {
            setUpdateData('entity_type', value);
        } else {
            setCreateData('entity_type', value);
        }
    };

    const handleExecutorIdChange = (value) => {
        if (isEditMode) {
            setUpdateData('executor_id', value);
        } else {
            setCreateData('executor_id', value);
        }
    };

    const handleRoleAssignmentChange = (value) => {
        if (isEditMode) {
            setUpdateData('role_assignment', value);
        } else {
            setCreateData('role_assignment', value);
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingAssignment(null);
        resetCreate();
        resetUpdate();
    };

    // Safely calculate project progress
    const progress = project?.progress || 0;

    // Safely calculate total people assigned
    const totalPeople = (executors || []).reduce((sum, executor) => sum + (executor?.staff_count || 0), 0);

    // Safely get project dates
    const startDate = project?.start_date || 'Not specified';
    const endDate = project?.end_date || 'Not specified';
    const status = project?.status || 'unknown';

    return (
        <AppLayout
            user={auth.user}
            header={<h2 className="font-semibold text-xl text-gray-800 leading-tight">{title}</h2>}
        >
            <Head title={title} />

            {/* Add Executor Button */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={() => {
                        setEditingAssignment(null);
                        setShowModal(true);
                        reset();
                    }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 active:bg-blue-900 focus:outline-none focus:border-blue-900 focus:ring focus:ring-blue-300 disabled:opacity-25 transition"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Executor
                </button>
            </div>

            <div className="py-6">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Project Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        {/* Project Status Card */}
                        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900 truncate">
                                        {project?.name || 'Unnamed Project'}
                                    </h2>
                                    <span
                                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${status === 'completed'
                                            ? 'bg-green-100 text-green-800'
                                            : status === 'in_progress'
                                                ? 'bg-blue-100 text-blue-800 animate-pulse'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                    >
                                        {status === 'in_progress' && (
                                            <svg
                                                className="mr-1.5 h-2 w-2"
                                                fill="currentColor"
                                                viewBox="0 0 8 8"
                                            >
                                                <circle cx="4" cy="4" r="3" />
                                            </svg>
                                        )}
                                        {status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="flex items-center text-gray-700 mb-6">
                                    <svg
                                        className="flex-shrink-0 mr-2 h-5 w-5 text-gray-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                    <span className="truncate">
                                        {project?.location || 'Location not specified'}
                                    </span>
                                </div>

                                <div
                                    className={`p-4 rounded-lg ${status === 'completed'
                                        ? 'bg-green-50 text-green-800'
                                        : status === 'in_progress'
                                            ? 'bg-blue-50 text-blue-800'
                                            : 'bg-yellow-50 text-yellow-800'
                                        }`}
                                >
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            {status === 'completed' ? (
                                                <svg
                                                    className="h-5 w-5 text-green-600"
                                                    fill="currentColor"
                                                    viewBox="0 0 20 20"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            ) : status === 'in_progress' ? (
                                                <svg
                                                    className="h-5 w-5 text-blue-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                                    />
                                                </svg>
                                            ) : (
                                                <svg
                                                    className="h-5 w-5 text-yellow-600"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                                    />
                                                </svg>
                                            )}
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm font-medium">
                                                {status === 'completed'
                                                    ? 'Project completed successfully on ' + endDate
                                                    : status === 'in_progress'
                                                        ? 'Project in progress - ' +
                                                        Math.round(
                                                            (new Date() - new Date(startDate)) /
                                                            (1000 * 60 * 60 * 24)
                                                        ) +
                                                        ' days elapsed'
                                                        : 'Project not yet started - begins ' + startDate}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-gray-500">Start Date</p>
                                        <p className="font-medium text-gray-900">{startDate}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">End Date</p>
                                        <p className="font-medium text-gray-900">{endDate}</p>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Project Progress Card */}
                        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Project Progress</h3>
                                <div className="flex justify-center">
                                    <div className="relative w-32 h-32">
                                        <svg className="w-full h-full" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#E5E7EB"
                                                strokeWidth="3"
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none"
                                                stroke="#3B82F6"
                                                strokeWidth="3"
                                                strokeDasharray={`${progress}, 100`}
                                                strokeLinecap="round"
                                                className="transition-all duration-1000 ease-out"
                                                style={{
                                                    transform: 'rotate(-90deg)',
                                                    transformOrigin: '50% 50%',
                                                }}
                                            />
                                        </svg>
                                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                                            <span className="text-2xl font-bold text-gray-900">{progress}%</span>
                                            <span className="block text-xs text-gray-500 mt-1">completed</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Start Date</span>
                                        <span className="font-medium">{startDate}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Target Date</span>
                                        <span className="font-medium">{endDate}</span>
                                    </div>
                                    <div className="pt-2">
                                        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Total People Card */}
                        <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Team Members</h3>
                                <div className="mt-2 flex items-baseline">
                                    <span className="text-3xl font-extrabold text-gray-900">{totalPeople}</span>
                                    <span className="ml-2 text-sm font-medium text-gray-500">people assigned</span>
                                </div>
                                <div className="mt-4">
                                    <span className="text-sm text-gray-500">
                                        Across {(executors || []).length} executor companies
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Executors Section */}
                    {/* <div className="bg-white shadow sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">Assigned Executors</h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">Companies responsible for this project</p>
                        </div>
                        <div className="border-t border-gray-200">
                            <ul className="divide-y divide-gray-200">
                                {(executors || []).length > 0 ? (
                                    (executors || []).map((executor) => (
                                        <li key={executor?.id}>
                                            <div className="px-4 py-4 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center">
                                                                <p className="text-sm font-medium text-blue-600 truncate">
                                                                    {executor?.name || 'Unnamed Executor'}
                                                                </p>
                                                                <p className="ml-2 flex-shrink-0 text-xs text-gray-500">
                                                                    {executor?.short_name || ''}
                                                                </p>
                                                            </div>
                                                            <div className="mt-2 flex">
                                                                <div className="flex items-center text-sm text-gray-500">
                                                                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                                                    </svg>
                                                                    <span>{executor?.email || 'No email'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="ml-2 flex-shrink-0 flex">
                                                        <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            {executor?.staff_count || 0} staff
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <div className="flex text-sm text-gray-500">
                                                        <div className="flex items-center mr-4">
                                                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                                            </svg>
                                                            {executor?.address || 'Address not specified'}
                                                        </div>
                                                        <div className="flex items-center">
                                                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                                            </svg>
                                                            {executor?.contact || 'Contact not specified'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                                        No executors assigned to this project
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div> */}

                    {/* Assignments with Roles Section */}
                    <div className="bg-white shadow-lg rounded-xl border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-gray-100 to-indigo-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Role Assignments</h3>
                        <p className="text-sm text-gray-600 mt-1">Detailed responsibilities for each executor</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-3 sm:mt-0">
                        <div className="flex items-center">
                            <label htmlFor="itemsPerPage" className="text-sm text-gray-600 mr-2">
                                Show:
                            </label>
                            <select
                                id="itemsPerPage"
                                value={itemsPerPage}
                                onChange={handleItemsPerPageChange}
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="20">20</option>
                                <option value="50">50</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/80 backdrop-blur-sm">
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Executor
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Role
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Staff
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                        {currentAssignments.length > 0 ? (
                            currentAssignments.map((assignment) => {
                                const isCompany = assignment.entity_type === 'CP';
                                const company = assignment.executor_company || {};
                                const employee = assignment.employee || {};

                                return (
                                    <tr key={assignment.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                                                    {isCompany ? (
                                                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-6 0H5m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {isCompany ? company?.name || 'Unassigned Company' : employee?.name || 'Unassigned Employee'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {isCompany ? company?.email || 'No email' : employee?.email || 'No email'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900 font-medium max-w-xs truncate">
                                                {assignment.role_assignment || 'No role specified'}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            {isCompany ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    {company?.staff_count ?? 0}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    Individual
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            {isCompany ? (
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${company?.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    <svg className={`w-3 h-3 mr-1 ${company?.status === 'active' ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    {company?.status || 'unknown'}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {employee?.status || 'active'}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleEditAssignment(assignment)}
                                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                                                    title="Edit role assignment"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-150"
                                                    title="Remove assignment"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-4 py-8 text-center">
                                    <div className="text-gray-400">
                                        <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm">No role assignments found</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                        <div className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of{' '}
                            <span className="font-medium">{totalItems}</span> results
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            
                            <div className="flex items-center space-x-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                    if (page > totalPages) return null;
                                    
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => handlePageChange(page)}
                                            className={`w-8 h-8 text-sm rounded-md transition-colors ${
                                                currentPage === page
                                                    ? 'bg-blue-600 text-white'
                                                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                
                                {totalPages > 5 && currentPage < totalPages - 2 && (
                                    <span className="px-2 text-gray-500">...</span>
                                )}
                                
                                {totalPages > 5 && currentPage < totalPages - 1 && (
                                    <button
                                        onClick={() => handlePageChange(totalPages)}
                                        className="w-8 h-8 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        {totalPages}
                                    </button>
                                )}
                            </div>
                            
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

                </div>
            </div>

            {/* Add/Edit Executor Modal */}
            <Modal show={showModal} onClose={handleModalClose}>
                <div className="p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                        {isEditMode ? 'Edit Assignment' : 'Add Executor to Project'}
                    </h2>

                    <form onSubmit={isEditMode ? submitUpdate : submitCreate}>
                        {/* Entity Type Selection (Company or Employee) */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Executor Type</label>
                            <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="entity_type"
                                        value="CP"
                                        checked={currentData.entity_type === 'CP'}
                                        onChange={() => handleEntityTypeChange('CP')}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        required
                                        disabled={isEditMode}
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Company</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="radio"
                                        name="entity_type"
                                        value="EM"
                                        checked={currentData.entity_type === 'EM'}
                                        onChange={() => handleEntityTypeChange('EM')}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                        disabled={isEditMode}
                                    />
                                    <span className="ml-2 text-sm text-gray-700">Employee</span>
                                </label>
                            </div>
                        </div>

                        {/* Dynamic Selector for Company/Employee */}
                        <div className="mb-4">
                            <label htmlFor="executor_id" className="block text-sm font-medium text-gray-700 mb-1">
                                {currentData.entity_type === 'CP' ? 'Select Company' : 'Select Employee'}
                            </label>
                            <select
                                id="executor_id"
                                name="executor_id"
                                value={currentData.executor_id}
                                onChange={(e) => handleExecutorIdChange(e.target.value)}
                                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                required
                                disabled={isEditMode}
                            >
                                <option value="">Select {currentData.entity_type === 'CP' ? 'a company' : 'an employee'}</option>

                                {currentData.entity_type === 'CP' ? (
                                    <>
                                        {(availableExecutors || []).map((executor) => (
                                            <option key={executor.id} value={executor.id}>
                                                {executor.name} ({executor.short_name})
                                            </option>
                                        ))}
                                    </>
                                ) : (
                                    (availableEmployees || []).map((employee) => (
                                        <option key={employee.id} value={employee.id}>
                                            {employee.name}
                                        </option>
                                    ))
                                )}
                            </select>
                            {currentErrors.executor_id && <p className="mt-1 text-sm text-red-600">{currentErrors.executor_id}</p>}
                        </div>

                        {/* Role Assignment */}
                        <div className="mb-4">
                            <label htmlFor="role_assignment" className="block text-sm font-medium text-gray-700 mb-1">
                                Role/Responsibility
                            </label>
                            <input
                                type="text"
                                id="role_assignment"
                                name="role_assignment"
                                value={currentData.role_assignment}
                                onChange={(e) => handleRoleAssignmentChange(e.target.value)}
                                className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md shadow-sm"
                                placeholder={currentData.entity_type === 'CP'
                                    ? "e.g., Electrical Contractor, Plumbing Subcontractor"
                                    : "e.g., Site Supervisor, Project Engineer"}
                                required
                            />
                            {currentErrors.role_assignment && <p className="mt-1 text-sm text-red-600">{currentErrors.role_assignment}</p>}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="button"
                                onClick={handleModalClose}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={currentProcessing}
                                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                {currentProcessing
                                    ? (isEditMode ? 'Updating...' : 'Adding...')
                                    : (isEditMode ? 'Update Assignment' : 'Add Executor')
                                }
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AppLayout>
    );
}