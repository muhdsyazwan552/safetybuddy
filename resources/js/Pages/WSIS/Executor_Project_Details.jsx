import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import { showAlert } from '@/Helpers/alert'; // Import Sweet Alert helper

export default function ExecutorProjectDetails({
    project,
    assignments,
    availableStaff,
    availableSubconStaff,
    availableCompSub,
    flash
}) {
    const [showModal, setShowModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Form for creating new assignment
    const { data: createData, setData: setCreateData, post, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm({
        executor_id: '',
        entity_type: 'staff',
        role_assignment: ''
    });

    // Form for updating assignment
    const { data: updateData, setData: setUpdateData, put, processing: updateProcessing, errors: updateErrors, reset: resetUpdate } = useForm({
        executor_id: '',
        entity_type: 'staff',
        role_assignment: ''
    });

    // Show Sweet Alert messages from flash
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

    // Debug logging
    useEffect(() => {
        console.log('=== ExecutorProjectDetails Debug ===');
        console.log('Project:', project);
        console.log('Assignments:', assignments);
        console.log('Available Staff:', availableStaff);
        console.log('Available Subcon Staff:', availableSubconStaff);
        console.log('Available Company Subcontractor Staff:', availableCompSub);
        console.log('Flash:', flash);
    }, [project, assignments, availableStaff, availableSubconStaff, availableCompSub, flash]);

    // Submit new assignment
    const submitCreate = (e) => {
        e.preventDefault();
        post(route('projects.add-executor', project.id), {
            onSuccess: () => {
                setShowModal(false);
                resetCreate();
                showAlert.success('Executor assigned successfully');
            },
            onError: (errors) => {
                console.error('Assignment error:', errors);
                showAlert.error('Failed to assign executor. Please check the form and try again.');
            }
        });
    };

    // Submit update assignment
    const submitUpdate = (e) => {
        e.preventDefault();
        put(route('projects.update-assignment', editingAssignment.id), {
            onSuccess: () => {
                setShowModal(false);
                setEditingAssignment(null);
                resetUpdate();
                showAlert.success('Assignment updated successfully');
            },
            onError: (errors) => {
                console.error('Update error:', errors);
                showAlert.error('Failed to update assignment. Please try again.');
            }
        });
    };

    // Handle edit button click
    const handleEditAssignment = (assignment) => {
        setEditingAssignment(assignment);
        setUpdateData({
            executor_id: assignment.entity_id,
            entity_type: assignment.entity_type,
            role_assignment: assignment.role_assignment || ''
        });
        setShowModal(true);
    };

    // Handle remove assignment with confirmation
    const handleRemoveAssignment = async (assignmentId) => {
        const confirmed = await showAlert.confirm(
            'Are you sure you want to remove this assignment?',
            'Confirm Removal'
        );
        
        if (confirmed) {
            router.delete(route('projects.remove-assignment', assignmentId), {
                onSuccess: () => {
                    showAlert.success('Assignment removed successfully');
                },
                onError: () => {
                    showAlert.error('Error removing assignment');
                }
            });
        }
    };

    const isEditMode = !!editingAssignment;
    const currentData = isEditMode ? updateData : createData;
    const currentErrors = isEditMode ? updateErrors : createErrors;
    const currentProcessing = isEditMode ? updateProcessing : createProcessing;

    const handleEntityTypeChange = (value) => {
        if (isEditMode) {
            setUpdateData('entity_type', value);
            setUpdateData('executor_id', '');
        } else {
            setCreateData('entity_type', value);
            setCreateData('executor_id', '');
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

    // Get available options based on entity type
    const getAvailableOptions = () => {
        switch (currentData.entity_type) {
            case 'staff':
                return availableStaff;
            case 'subcon':
                return availableSubconStaff;
            case 'compsub':
                return availableCompSub;
            default:
                return [];
        }
    };

    // Get display label for options
    const getOptionLabel = (item, type) => {
        switch (type) {
            case 'staff':
                return `${item.name} - ${item.role?.name || 'N/A'}`;
            case 'subcon':
                return `${item.name} - ${item.subcon_company?.name || 'N/A'}`;
            case 'compsub':
                return `${item.name}`;
            default:
                return item.name;
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'planning': return 'bg-yellow-100 text-yellow-800';
            case 'on_hold': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Calculate project progress
    const progress = project?.progress || 0;

    return (
        <AppLayout>
            <Head title={`Project Details - ${project?.name || 'Project'}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Remove the old success/error message divs - they are replaced by Sweet Alert */}

                    {/* Project Header */}
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
                        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
                            <h1 className="text-2xl font-bold text-white">{project?.name}</h1>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="text-sm text-gray-500">Location</label>
                                    <p className="font-medium text-gray-900">{project?.location || 'Not specified'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Start Date</label>
                                    <p className="font-medium text-gray-900">{project?.start_date || 'Not specified'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">End Date</label>
                                    <p className="font-medium text-gray-900">{project?.end_date || 'Not specified'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Status</label>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(project?.status)}`}>
                                        {project?.status?.replace('_', ' ') || 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                        <div className="border-b border-gray-200">
                            <nav className="flex -mb-px">
                                <button
                                    onClick={() => setActiveTab('overview')}
                                    className={`py-4 px-6 text-sm font-medium ${activeTab === 'overview'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Overview
                                </button>
                                <button
                                    onClick={() => setActiveTab('assignments')}
                                    className={`py-4 px-6 text-sm font-medium ${activeTab === 'assignments'
                                        ? 'border-b-2 border-blue-500 text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    Assignments ({assignments?.length || 0})
                                </button>
                            </nav>
                        </div>

                        <div className="p-6">
                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">Project Details</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Description</h4>
                                                <p className="mt-1 text-gray-900">
                                                    {project?.description || 'No description provided'}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Budget</h4>
                                                <p className="mt-1 text-gray-900">
                                                    {project?.budget ? `$${project.budget.toLocaleString()}` : 'Not specified'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Project Manager</h4>
                                                <p className="mt-1 text-gray-900">
                                                    {project?.project_manager || 'Not assigned'}
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-gray-500">Created At</h4>
                                                <p className="mt-1 text-gray-900">
                                                    {project?.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Statistics Cards */}
                                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
                                        <div className="bg-blue-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {assignments?.filter(a => a.entity_type === 'staff').length || 0}
                                            </div>
                                            <div className="text-sm text-gray-600">Main Staff Assigned</div>
                                        </div>
                                        <div className="bg-green-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-green-600">
                                                {assignments?.filter(a => a.entity_type === 'subcon').length || 0}
                                            </div>
                                            <div className="text-sm text-gray-600">Subcontractor Staff</div>
                                        </div>
                                        <div className="bg-purple-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-purple-600">
                                                {assignments?.filter(a => a.entity_type === 'compsub').length || 0}
                                            </div>
                                            <div className="text-sm text-gray-600">Company Subcontractor</div>
                                        </div>
                                        <div className="bg-orange-50 rounded-lg p-4">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {assignments?.length || 0}
                                            </div>
                                            <div className="text-sm text-gray-600">Total Assignments</div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Assignments Tab */}
                            {activeTab === 'assignments' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-lg font-medium text-gray-900">Project Assignments</h3>
                                        <button
                                            onClick={() => {
                                                setEditingAssignment(null);
                                                setShowModal(true);
                                                resetCreate();
                                            }}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            + Add Assignment
                                        </button>
                                    </div>

                                    {assignments && assignments.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Type
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Name
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Role
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Company
                                                        </th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {assignments.map((assignment) => (
                                                        <tr key={assignment.id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${assignment.entity_type === 'staff'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : assignment.entity_type === 'subcon'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-purple-100 text-purple-800'
                                                                    }`}>
                                                                    {assignment.entity_type === 'staff'
                                                                        ? 'Main Staff'
                                                                        : assignment.entity_type === 'subcon'
                                                                            ? 'Subcontractor'
                                                                            : 'Company Subcontractor'}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {assignment.entity_type === 'staff'
                                                                        ? assignment.staff_member?.name
                                                                        : assignment.entity_type === 'subcon'
                                                                            ? assignment.subcon_staff?.name
                                                                            : assignment.compsub_company?.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    {assignment.entity_type === 'staff'
                                                                        ? assignment.staff_member?.email
                                                                        : assignment.entity_type === 'subcon'
                                                                            ? assignment.subcon_staff?.email
                                                                            : assignment.compsub_company?.email}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="text-sm text-gray-900">
                                                                    {assignment.role_assignment || 'No role specified'}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <div className="text-sm text-gray-900">
                                                                    {assignment.entity_type === 'staff'
                                                                        ? assignment.staff_member?.company_name
                                                                        : assignment.entity_type === 'subcon'
                                                                            ? assignment.subcon_staff?.company_name
                                                                            : assignment.compsub_company?.name}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                                <button
                                                                    onClick={() => handleEditAssignment(assignment)}
                                                                    className="text-blue-600 hover:text-blue-900 mr-3"
                                                                >
                                                                    Edit
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRemoveAssignment(assignment.id)}
                                                                    className="text-red-600 hover:text-red-900"
                                                                >
                                                                    Remove
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                            </svg>
                                            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments</h3>
                                            <p className="mt-1 text-sm text-gray-500">Get started by adding a new assignment.</p>
                                            <div className="mt-6">
                                                <button
                                                    onClick={() => setShowModal(true)}
                                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    Add Assignment
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal - same as before */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                {isEditMode ? 'Edit Assignment' : 'Add New Assignment'}
                            </h3>
                            <button
                                onClick={handleModalClose}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={isEditMode ? submitUpdate : submitCreate}>
                            {/* Entity Type */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Assignment Type
                                </label>
                                <div className="flex space-x-4">
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            value="staff"
                                            checked={currentData.entity_type === 'staff'}
                                            onChange={() => handleEntityTypeChange('staff')}
                                            className="h-4 w-4 text-blue-600"
                                            disabled={isEditMode}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Main Staff</span>
                                    </label>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            value="compsub"
                                            checked={currentData.entity_type === 'compsub'}
                                            onChange={() => handleEntityTypeChange('compsub')}
                                            className="h-4 w-4 text-blue-600"
                                            disabled={isEditMode}
                                        />
                                        <span className="ml-2 text-sm text-gray-700">Company Subcontractor</span>
                                    </label>
                                </div>
                            </div>

                            {/* Executor Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {currentData.entity_type === 'staff'
                                        ? 'Select Staff'
                                        : currentData.entity_type === 'subcon'
                                            ? 'Select Subcontractor Staff'
                                            : 'Select Company Subcontractor'}
                                </label>
                                <select
                                    value={currentData.executor_id}
                                    onChange={(e) => handleExecutorIdChange(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    required
                                    disabled={isEditMode}
                                >
                                    <option value="">Select...</option>
                                    {getAvailableOptions()?.map(item => (
                                        <option key={item.id} value={item.id}>
                                            {getOptionLabel(item, currentData.entity_type)}
                                        </option>
                                    ))}
                                </select>
                                {currentErrors.executor_id && (
                                    <p className="mt-1 text-sm text-red-600">{currentErrors.executor_id}</p>
                                )}
                            </div>

                            {/* Role Assignment */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Responsibility
                                </label>
                                <input
                                    type="text"
                                    value={currentData.role_assignment}
                                    onChange={(e) => handleRoleAssignmentChange(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder="e.g., Project Manager, Site Supervisor, Electrician"
                                    required
                                />
                                {currentErrors.role_assignment && (
                                    <p className="mt-1 text-sm text-red-600">{currentErrors.role_assignment}</p>
                                )}
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleModalClose}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={currentProcessing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {currentProcessing
                                        ? (isEditMode ? 'Updating...' : 'Adding...')
                                        : (isEditMode ? 'Update' : 'Add')
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}