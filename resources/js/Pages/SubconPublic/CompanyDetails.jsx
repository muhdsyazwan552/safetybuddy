// resources/js/Pages/SubconPublic/CompanyDetails.jsx

import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import StaffList from './Components/StaffList';
import AddStaffModal from './Components/AddStaffModal';
import Swal from 'sweetalert2';

export default function CompanyDetails({ company, staffs, public_token, access_level, role }) {
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

    const isLeader = access_level === 'full';
    const canEdit = isLeader;
    const canDelete = isLeader;
    const canAdd = true; // Both roles can add staff

    // Separate forms for add and edit to avoid conflicts
    const addForm = useForm({
        name: '',
        email: '',
        contact: '',
        role: '',
    });

    const editForm = useForm({
        name: '',
        email: '',
        contact: '',
        role: '',
        status: 'active',
    });

    const handleAddStaff = () => {
        addForm.post(`/subcon/${public_token}/staff`, {
            preserveScroll: true,
            onSuccess: () => {
                addForm.reset();
                setShowAddModal(false);
                Swal.fire('Success!', 'Staff member added successfully', 'success');
            },
            onError: (errors) => {
                Swal.fire('Error!', 'Please check the form for errors', 'error');
            }
        });
    };

    const handleUpdateStaff = () => {
        editForm.put(`/subcon/${public_token}/staff/${editingStaff.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                editForm.reset();
                setEditingStaff(null);
                setShowAddModal(false);
                Swal.fire('Success!', 'Staff member updated successfully', 'success');
            },
            onError: (errors) => {
                Swal.fire('Error!', 'Please check the form for errors', 'error');
            }
        });
    };

    const handleDeleteStaff = (staffId, staffName) => {
        if (!canDelete) {
            Swal.fire('Access Denied', 'You do not have permission to delete staff members', 'error');
            return;
        }

        Swal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${staffName}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                router.delete(`/subcon/${public_token}/staff/${staffId}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire('Deleted!', 'Staff member has been deleted.', 'success');
                    }
                });
            }
        });
    };

    const openAddModal = () => {
        if (!canAdd) {
            Swal.fire('Access Denied', 'You do not have permission to add staff members', 'error');
            return;
        }
        setEditingStaff(null);
        addForm.reset();
        setShowAddModal(true);
    };

    const openEditModal = (staff) => {
        if (!canEdit) {
            Swal.fire('Access Denied', 'You do not have permission to edit staff members', 'error');
            return;
        }
        setEditingStaff(staff);
        editForm.setData({
            name: staff.name,
            email: staff.email,
            contact: staff.contact || '',
            role: staff.role || '',
            status: staff.status || 'active',
        });
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingStaff(null);
        addForm.reset();
        editForm.reset();
    };

    // Get role display name
    const getRoleDisplayName = () => {
        return role === 'leader' ? 'Team Leader' : 'Staff Member';
    };

    return (
        <>
            <Head title={`${company.name} - ${getRoleDisplayName()} Portal`} />

            <div className="min-h-screen bg-gray-100">
                {/* Role Banner */}
                <div className={`${isLeader ? 'bg-purple-600' : 'bg-blue-600'} text-white`}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-sm font-medium">
                                    Access Level: {getRoleDisplayName()}
                                </span>
                                {!isLeader && (
                                    <span className="ml-3 text-xs opacity-75">
                                        (View & Add Only)
                                    </span>
                                )}
                                {isLeader && (
                                    <span className="ml-3 text-xs opacity-75">
                                        (Full Access - Edit & Delete)
                                    </span>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`px-2 py-1 text-xs rounded ${
                                        viewMode === 'list' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                                    }`}
                                >
                                    List View
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`px-2 py-1 text-xs rounded ${
                                        viewMode === 'grid' ? 'bg-white bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                                    }`}
                                >
                                    Grid View
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        {/* Company Information Card */}
                        <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg mb-6">
                            <div className="p-6 bg-white border-b border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            Company Information
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {company.name}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                        company.status === 'active' 
                                            ? 'bg-green-100 text-green-800' 
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {company.status}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Email</label>
                                        <p className="mt-1 text-gray-900">{company.email}</p>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Contact</label>
                                        <p className="mt-1 text-gray-900">{company.contact || 'N/A'}</p>
                                    </div>
                                    
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700">Address</label>
                                        <p className="mt-1 text-gray-900">{company.address || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Staff Management Section */}
                        <div className="bg-white overflow-hidden shadow-xl sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            Staff Members
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Total: {staffs.length} staff members
                                        </p>
                                    </div>
                                    {canAdd && (
                                        <button
                                            onClick={openAddModal}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                                        >
                                            + Add Staff
                                        </button>
                                    )}
                                </div>

                                <StaffList 
                                    staffs={staffs}
                                    onEdit={openEditModal}
                                    onDelete={handleDeleteStaff}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                                    viewMode={viewMode}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Staff Modal */}
            <AddStaffModal
                isOpen={showAddModal}
                onClose={closeModal}
                onSubmit={editingStaff ? handleUpdateStaff : handleAddStaff}
                data={editingStaff ? editForm.data : addForm.data}
                setData={editingStaff ? editForm.setData : addForm.setData}
                errors={editingStaff ? editForm.errors : addForm.errors}
                processing={editingStaff ? editForm.processing : addForm.processing}
                isEditing={!!editingStaff}
                isLeader={isLeader}
            />
        </>
    );
}