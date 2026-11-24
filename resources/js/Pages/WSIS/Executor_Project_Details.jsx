import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/Pages/WSIS/Layout';
import BackLink from '@/Components/shared/BackLink';
import DateInput from '@/Components/shared/DateInput';
import { showAlert } from '@/Helpers/alert'; // Import Sweet Alert helper

export default function ExecutorProjectDetails({
    project,
    assignments,
    availableStaff,
    availableSubconStaff,
    availableCompSub,
    projectTypes = [],
    flash
}) {
    const [showModal, setShowModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const [openNote, setOpenNote] = useState(null);
    const [showEditProject, setShowEditProject] = useState(false);

    const dataCounts = project?.data_counts || {};
    const hasData = Object.keys(dataCounts).length > 0;
    const isInactive = project?.status === 'inactive';

    // Edit project
    const { data: projData, setData: setProjData, put: putProject, processing: projProcessing, errors: projErrors, reset: resetProj } = useForm({
        name: '', location: '', start_date: '', end_date: '', status: 'pending', project_type_id: ''
    });

    const openEditProject = () => {
        setProjData({
            name: project?.name || '',
            location: project?.location || '',
            start_date: (project?.start_date || '').slice(0, 10),
            end_date: (project?.end_date || '').slice(0, 10),
            status: project?.status || 'pending',
            project_type_id: project?.project_type_id || '',
        });
        setShowEditProject(true);
    };

    const submitEditProject = (e) => {
        e.preventDefault();
        putProject(route('admin.projects.update', project.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowEditProject(false);
                showAlert.success('Project updated successfully');
            },
            onError: () => showAlert.error('Please check the project details and try again.'),
        });
    };

    // Delete when there is no data, set inactive when the project already has data
    const handleDeleteProject = async () => {
        const name = project?.name ? `"${project.name}"` : 'this project';
        const ok = hasData
            ? await showAlert.confirmDelete(
                `${name} already has recorded data, so it cannot be deleted. It will be set to inactive: its records stay, and no new visits can be created for it.`,
                'Set this project to inactive?',
                {
                    confirmText: 'Yes, set inactive',
                    details: Object.entries(dataCounts).map(([label, n]) => `${label}: ${n}`),
                }
            )
            : await showAlert.confirmDelete(
                `${name} has no recorded data. It will be deleted permanently from the database, together with its inspector and contractor assignments.`,
                'Delete this project permanently?',
                { confirmText: 'Yes, delete project' }
            );
        if (!ok) return;

        router.delete(route('admin.projects.destroy', project.id), {
            preserveScroll: true,
            onError: () => showAlert.error('The project could not be changed. Nothing was removed.', 'Action failed'),
        });
    };

    // Form for creating new assignment
    const { data: createData, setData: setCreateData, post, processing: createProcessing, errors: createErrors, reset: resetCreate } = useForm({
        executor_id: '',
        entity_type: 'staff',
        role_assignment: '',
        notes: ''
    });

    // Form for updating assignment
    const { data: updateData, setData: setUpdateData, put, processing: updateProcessing, errors: updateErrors, reset: resetUpdate } = useForm({
        executor_id: '',
        entity_type: 'staff',
        role_assignment: '',
        notes: ''
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
            role_assignment: assignment.role_assignment || '',
            notes: assignment.notes || ''
        });
        setShowModal(true);
    };

    // Handle remove assignment with confirmation
    const handleRemoveAssignment = async (assignmentId) => {
        const confirmed = await showAlert.confirmDelete(
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

    const handleNotesChange = (value) => {
        if (isEditMode) {
            setUpdateData('notes', value);
        } else {
            setCreateData('notes', value);
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

    const statusKey = project?.status?.toLowerCase().replace(/[\s-]+/g, '_');
    const statusStyles = {
        pending: 'bg-amber-50 text-amber-700 ring-amber-200',
        planning: 'bg-amber-50 text-amber-700 ring-amber-200',
        in_progress: 'bg-blue-50 text-blue-700 ring-blue-200',
        completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        on_hold: 'bg-orange-50 text-orange-700 ring-orange-200',
        cancelled: 'bg-rose-50 text-rose-700 ring-rose-200',
        inactive: 'bg-gray-100 text-gray-600 ring-gray-300',
    };
    const statusLabel = statusKey
        ? statusKey.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
        : 'Unknown';

    // Compare calendar dates in local time so date-only values do not shift by timezone.
    const parseDate = (value) => {
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || '');
        if (!match) return null;
        const [, year, month, day] = match.map(Number);
        const date = new Date(year, month - 1, day);
        return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
            ? Date.UTC(year, month - 1, day) : null;
    };
    const startDate = parseDate(project?.start_date);
    const endDate = parseDate(project?.end_date);
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const hasTimeline = startDate !== null && endDate !== null && endDate >= startDate;
    const timelineProgress = hasTimeline
        ? endDate === startDate ? (today >= endDate ? 100 : 0)
            : Math.round(Math.min(100, Math.max(0, (today - startDate) / (endDate - startDate) * 100)))
        : 0;
    const timelineCaption = !hasTimeline ? 'Set valid start and end dates to view the timeline'
        : today < startDate ? `Starts in ${Math.ceil((startDate - today) / 86400000)} days`
        : today > endDate ? 'Scheduled period ended'
        : today === endDate ? 'Scheduled to end today'
        : `${Math.ceil((endDate - today) / 86400000)} days remaining`;
    const formatDate = (value) => parseDate(value) !== null
        ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(parseDate(value))
        : 'Not specified';

    const inspectorCount = assignments?.filter(a => a.entity_type === 'staff').length || 0;
    const contractorCount = assignments?.filter(a => a.entity_type === 'compsub').length || 0;

    return (
        <AppLayout>
            <Head title={`Project Details - ${project?.name || 'Project'}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <BackLink href="/manage-project" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-800">
                        <ArrowLeft className="h-4 w-4" /> Back
                    </BackLink>

                    {/* Remove the old success/error message divs - they are replaced by Sweet Alert */}

                    {/* Project Header */}
                    <section className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3 sm:px-5">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-1 rounded-full bg-brand-500" />
                                <div>
                                    <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Project overview</p>
                                    <h1 className="text-lg font-bold tracking-tight text-gray-900">{project?.name}</h1>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-500">Status</span>
                                <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[statusKey] || 'bg-gray-50 text-gray-600 ring-gray-200'}`}>
                                    <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
                                    {statusLabel}
                                </span>
                                <button
                                    type="button"
                                    onClick={openEditProject}
                                    className="ml-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Edit project
                                </button>
                                {!isInactive && (
                                    <button
                                        type="button"
                                        onClick={handleDeleteProject}
                                        className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                                    >
                                        {hasData ? 'Set inactive' : 'Delete project'}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className={`border-b px-4 py-2 text-xs sm:px-5 ${isInactive ? 'border-gray-200 bg-gray-100 text-gray-700' : 'border-gray-100 bg-gray-50 text-gray-500'}`}>
                            {isInactive
                                ? <>This project is <b>inactive</b>. Its records are kept, but no new visits can be created for it. Use Edit project to make it active again.</>
                                : hasData
                                    ? 'This project already has recorded data, so it can only be set to inactive, not deleted.'
                                    : 'This project has no recorded data, so it can be deleted permanently.'}
                        </div>
                        <div className="grid items-center gap-4 px-4 py-3 sm:px-5 md:grid-cols-2">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="mb-0.5 text-xs font-medium text-gray-500">Location</p>
                                    <p className="text-sm font-semibold text-gray-900">{project?.location || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="mb-0.5 text-xs font-medium text-gray-500">Project Type</p>
                                    <p className="text-sm font-semibold text-gray-900">{project?.type_name || 'Not specified'}</p>
                                </div>
                            </div>
                            <div className="min-w-0 md:border-l md:border-gray-100 md:pl-5">
                                <div className="mb-1 flex items-start justify-between gap-4">
                                    <div>
                                        <p className="mb-0.5 text-xs font-medium text-gray-500">Start Date</p>
                                        <p className="text-sm font-semibold text-gray-900">{formatDate(project?.start_date)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="mb-0.5 text-xs font-medium text-gray-500">End Date</p>
                                        <p className="text-sm font-semibold text-gray-900">{formatDate(project?.end_date)}</p>
                                    </div>
                                </div>
                                <div className="mb-1 flex items-center justify-between text-xs">
                                    <span className="font-medium text-gray-600">Timeline elapsed</span>
                                    <span className="font-semibold tabular-nums text-gray-900">{hasTimeline ? `${timelineProgress}%` : 'Unavailable'}</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-gray-200" role={hasTimeline ? 'progressbar' : undefined} aria-label="Project timeline elapsed" aria-valuemin={hasTimeline ? 0 : undefined} aria-valuemax={hasTimeline ? 100 : undefined} aria-valuenow={hasTimeline ? timelineProgress : undefined}>
                                    <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-500" style={{ width: `${timelineProgress}%` }} />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">{timelineCaption}</p>
                            </div>
                        </div>
                    </section>

                    {/* Assignments */}
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">Inspector &amp; Contractor</h3>
                                    <p className="text-sm text-gray-500">
                                        {inspectorCount} inspector{inspectorCount === 1 ? '' : 's'} · {contractorCount} contractor{contractorCount === 1 ? '' : 's'}
                                    </p>
                                </div>
                                <div className="relative flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowInfo((v) => !v)}
                                        onBlur={() => setShowInfo(false)}
                                        aria-label="About assignments"
                                        className="p-1.5 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                    >
                                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </button>
                                    {showInfo && (
                                        <div className="absolute right-0 top-full mt-2 w-72 z-20 rounded-lg bg-white p-3 text-xs text-gray-600 shadow-xl ring-1 ring-black/10">
                                            <p className="mb-1"><span className="font-semibold text-gray-800">Inspector:</span> active inspectors who can inspect this project.</p>
                                            <p className="mb-1"><span className="font-semibold text-gray-800">Contractor:</span> active contractors working on this project.</p>
                                            <p><span className="font-semibold text-gray-800">Notes:</span> add instructions or scope for each assignment; edit them any time.</p>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => {
                                            setEditingAssignment(null);
                                            resetCreate();
                                            setShowModal(true);
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        + Assign
                                    </button>
                                </div>
                            </div>

                            {assignments && assignments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {assignments.map((assignment, rowNo) => {
                                                const isStaff = assignment.entity_type === 'staff';
                                                const person = isStaff ? assignment.staff_member : assignment.compsub_company;
                                                return (
                                                    <tr key={assignment.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{rowNo + 1}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${isStaff ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                                {isStaff ? 'Inspector' : 'Contractor'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900">{person?.name}</div>
                                                            <div className="text-sm text-gray-500">{person?.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                                            {assignment.notes ? (
                                                                <div className="flex items-start gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setOpenNote(openNote === assignment.id ? null : assignment.id)}
                                                                        title="Show full note"
                                                                        className="mt-0.5 shrink-0 text-blue-600 hover:text-blue-800"
                                                                    >
                                                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                    </button>
                                                                    <span className={openNote === assignment.id ? 'whitespace-pre-wrap break-words' : 'truncate block'}>
                                                                        {assignment.notes}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-gray-400">No notes</span>
                                                            )}
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
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <h3 className="text-sm font-medium text-gray-900">Nobody assigned yet</h3>
                                    <p className="mt-1 text-sm text-gray-500">Assign an inspector or an active contractor to this project.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit project modal */}
            {showEditProject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <form onSubmit={submitEditProject} className="p-6 space-y-4">
                            <h2 className="text-xl font-semibold">Edit Project</h2>
                            {[
                                ['name', 'Project Name*'],
                                ['location', 'Location*'],
                            ].map(([key, label]) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                    <input type="text" value={projData[key]} onChange={(e) => setProjData(key, e.target.value)} required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    {projErrors[key] && <p className="text-red-500 text-xs mt-1">{projErrors[key]}</p>}
                                </div>
                            ))}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[['start_date', 'Start Date*'], ['end_date', 'End Date*']].map(([key, label]) => (
                                    <div key={key}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                        <DateInput  value={projData[key]} onChange={(e) => setProjData(key, e.target.value)} required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                        {projErrors[key] && <p className="text-red-500 text-xs mt-1">{projErrors[key]}</p>}
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status*</label>
                                <select value={projData.status} onChange={(e) => setProjData('status', e.target.value)} required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="pending">Pending</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                                {projErrors.status && <p className="text-red-500 text-xs mt-1">{projErrors.status}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Type</label>
                                <select value={projData.project_type_id} onChange={(e) => setProjData('project_type_id', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Select type</option>
                                    {projectTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => { setShowEditProject(false); resetProj(); }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</button>
                                <button type="submit" disabled={projProcessing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                                    {projProcessing ? 'Saving...' : 'Update Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                        <span className="ml-2 text-sm text-gray-700">Inspector</span>
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
                                        <span className="ml-2 text-sm text-gray-700">Contractor</span>
                                    </label>
                                </div>
                            </div>

                            {/* Executor Selection */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {currentData.entity_type === 'staff'
                                        ? 'Select Inspector'
                                        : 'Select Contractor (active)'}
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

                            {/* Notes */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    rows={3}
                                    maxLength={1000}
                                    value={currentData.notes}
                                    onChange={(e) => handleNotesChange(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                    placeholder={currentData.entity_type === 'staff' ? 'e.g., Weekly site inspection every Monday' : 'e.g., Scope of work for this contractor'}
                                />
                                {currentErrors.notes && (
                                    <p className="mt-1 text-sm text-red-600">{currentErrors.notes}</p>
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
