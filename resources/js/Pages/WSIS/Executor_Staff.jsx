import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import dayjs from 'dayjs';
import { showAlert } from '@/Helpers/alert';
import ShareSubconLink from '@/Components/shared/ShareSubconLink';

const ExecutorStaff = ({ title, company, staff }) => {
  const [showForm, setShowForm] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { data, setData, post, put, processing, errors, reset } = useForm({
    company_id: company.id,  // ✅ Changed from executor_company_id to company_id
    name: '',
    role: '',
    email: '',
    contact: '',
    status: 'active',
  });

  const submit = (e) => {
    e.preventDefault();
    
    if (editingStaff) {
      put(`/executor-staff/${editingStaff.id}`, {
        onSuccess: () => {
          reset();
          setShowForm(false);
          setEditingStaff(null);
        }
      });
    } else {
      post('/executor-staff', {  // Make sure this route matches your backend
        onSuccess: () => {
          reset();
          setShowForm(false);
        },
        onError: (errors) => {
          console.log('Validation errors:', errors);
        }
      });
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setData({
      company_id: company.id,  // ✅ Changed here too
      name: staffMember.name || '',
      role: staffMember.role || '',
      email: staffMember.email || '',
      contact: staffMember.contact || '',
      status: staffMember.status || 'active',
    });
    setShowForm(true);
  };

  // Rest of your code remains the same...
  const handleDelete = async (id) => {
    const ok = await showAlert.confirmDelete(
      'The staff member will be removed from this company. Their project assignments are removed too.',
      'Delete this staff member?'
    );
    if (ok) {
      router.delete(`/executor-staff/${id}`, {
        onSuccess: () => {
          // Staff will be removed from list via Inertia refresh
        }
      });
    }
  };

  // Filter staff based on search term
  const filteredStaff = staff?.filter(member =>
    member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Pagination logic
  const totalPages = Math.ceil(filteredStaff.length / entriesToShow);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * entriesToShow,
    currentPage * entriesToShow
  );

  // Render the main company and staff view
  if (!showCreatePage) {
    return (
      <AppLayout>
        <Head title={title} />

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Company Details</h1>
            <div className="space-x-3">
              <button 
                onClick={() => {
                  setEditingStaff(null);
                  reset();
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add Single Staff
              </button>
              <button 
                onClick={() => setShowCreatePage(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                + Add Multiple Staff
              </button>
            </div>
          </div>

          {/* Company Information Card */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-800">{company.name}</h2>
                <button
                  type="button"
                  onClick={() => setShowShare(true)}
                  className="mr-3 ml-auto inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-extrabold text-ink-900 shadow-sm hover:bg-brand-400 active:scale-95 transition"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  Share link
                </button>
                <span
                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    company.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {company.status}
                </span>
              </div>
              {company.short_name && (
                <div className="mt-2 flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {company.short_name}
                  </span>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm"><span className="font-medium">Email:</span> {company.email || 'N/A'}</p>
                  <p className="text-sm"><span className="font-medium">Phone:</span> {company.contact || 'N/A'}</p>
                  <p className="text-sm"><span className="font-medium">Address:</span> {company.address || 'N/A'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Company Details</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm"><span className="font-medium">Staff Count:</span> {staff?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Staff Section */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Staff Members</h2>
            <p className="text-sm text-gray-500 mt-1">Total {staff?.length || 0} staff members</p>
          </div>

          {/* Search and filter controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                  placeholder="Search staff..."
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

            {/* Staff Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedStaff.length > 0 ? (
                    paginatedStaff.map((member, index) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(currentPage - 1) * entriesToShow + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-sm">
                              {member.name?.charAt(0) || '?'}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{member.role || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{member.email || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{member.contact || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${
                            member.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {member.status || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {member.created_at ? dayjs(member.created_at).format('DD MMM YYYY') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => handleEdit(member)}
                            className="text-blue-600 hover:text-blue-900 mr-3 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(member.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                        {searchTerm ? 'No staff members match your search.' : 'No staff members found. Click "Add Single Staff" or "Add Multiple Staff" to get started.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredStaff.length > 0 && (
              <div className="flex flex-col md:flex-row justify-between items-center p-4 border-t border-gray-200 bg-gray-50">
                <div className="mb-4 md:mb-0 text-sm text-gray-600">
                  Showing {(currentPage - 1) * entriesToShow + 1} to{" "}
                  {Math.min(currentPage * entriesToShow, filteredStaff.length)} of{" "}
                  {filteredStaff.length} entries
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                    {currentPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Staff Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-lg font-bold mb-4">{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h2>
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium">Name *</label>
                  <input 
                    type="text" 
                    value={data.name}
                    onChange={e => setData('name', e.target.value)}
                    className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium">Role *</label>
                  <input 
                    type="text" 
                    value={data.role}
                    onChange={e => setData('role', e.target.value)}
                    className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <input 
                    type="email" 
                    value={data.email}
                    onChange={e => setData('email', e.target.value)}
                    className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium">Contact</label>
                  <input 
                    type="text" 
                    value={data.contact}
                    onChange={e => setData('contact', e.target.value)}
                    className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.contact && <p className="text-red-500 text-sm">{errors.contact}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium">Status</label>
                  <select 
                    value={data.status}
                    onChange={e => setData('status', e.target.value)}
                    className="mt-1 w-full border rounded p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingStaff(null);
                      reset();
                    }}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={processing}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Saving...' : (editingStaff ? 'Update' : 'Save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <ShareSubconLink company={company} open={showShare} onClose={() => setShowShare(false)} />
      </AppLayout>
    );
  }

  // Render the dedicated staff creation page
  return (
    <CreateStaffPage 
      company={company} 
      onCancel={() => setShowCreatePage(false)} 
      onSuccess={() => setShowCreatePage(false)}
    />
  );
};

// Component for the dedicated staff creation page
const CreateStaffPage = ({ company, onCancel, onSuccess }) => {
  const [staffList, setStaffList] = useState([
    { name: '', role: '', email: '', contact: '', status: 'active', errors: {} }
  ]);

  const addStaffField = () => {
    setStaffList([...staffList, { name: '', role: '', email: '', contact: '', status: 'active', errors: {} }]);
  };

  const removeStaffField = (index) => {
    if (staffList.length > 1) {
      const newStaffList = [...staffList];
      newStaffList.splice(index, 1);
      setStaffList(newStaffList);
    }
  };

  const handleInputChange = (index, field, value) => {
    const newStaffList = [...staffList];
    newStaffList[index][field] = value;
    
    if (newStaffList[index].errors && newStaffList[index].errors[field]) {
      const newErrors = {...newStaffList[index].errors};
      delete newErrors[field];
      newStaffList[index].errors = newErrors;
    }
    
    setStaffList(newStaffList);
  };

  const { post, processing } = useForm();

  const submit = (e) => {
    e.preventDefault();
    
    let hasErrors = false;
    const validatedStaffList = staffList.map(staff => {
      const errors = {};
      
      if (!staff.name?.trim()) {
        errors.name = 'Name is required';
        hasErrors = true;
      }
      
      if (!staff.role?.trim()) {
        errors.role = 'Role is required';
        hasErrors = true;
      }
      
      if (staff.email && !/\S+@\S+\.\S+/.test(staff.email)) {
        errors.email = 'Email is invalid';
        hasErrors = true;
      }
      
      return { ...staff, errors };
    });
    
    if (hasErrors) {
      setStaffList(validatedStaffList);
      return;
    }
    
    post('/executor-staff/bulk', {
      data: { 
        staff: staffList,
        company_id: company.id  // ✅ Changed here too
      },
      onSuccess: () => {
        onSuccess();
      },
      onError: (errors) => {
        console.log('Bulk save errors:', errors);
        if (errors.staff) {
          const newStaffList = staffList.map((staff, index) => {
            return {
              ...staff,
              errors: errors.staff[index] || {}
            };
          });
          setStaffList(newStaffList);
        }
      }
    });
  };

  return (
    <AppLayout>
      <Head title={`Add Multiple Staff - ${company.name}`} />

      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Add Multiple Staff Members</h1>
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Back to Company
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">{company.name}</h2>
            <p className="text-sm text-gray-500">Add multiple staff members at once</p>
          </div>
        </div>

        <form onSubmit={submit} className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">Staff Members</h3>
            <button 
              type="button"
              onClick={addStaffField}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              + Add Another
            </button>
          </div>

          <div className="p-6 space-y-6">
            {staffList.map((staff, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                {staffList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStaffField(index)}
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                
                <h4 className="font-medium mb-3">Staff Member #{index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input 
                      type="text" 
                      value={staff.name}
                      onChange={e => handleInputChange(index, 'name', e.target.value)}
                      className={`w-full border rounded p-2 ${staff.errors?.name ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {staff.errors?.name && <p className="text-red-500 text-xs mt-1">{staff.errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Role *</label>
                    <input 
                      type="text" 
                      value={staff.role}
                      onChange={e => handleInputChange(index, 'role', e.target.value)}
                      className={`w-full border rounded p-2 ${staff.errors?.role ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {staff.errors?.role && <p className="text-red-500 text-xs mt-1">{staff.errors.role}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input 
                      type="email" 
                      value={staff.email}
                      onChange={e => handleInputChange(index, 'email', e.target.value)}
                      className={`w-full border rounded p-2 ${staff.errors?.email ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {staff.errors?.email && <p className="text-red-500 text-xs mt-1">{staff.errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Contact</label>
                    <input 
                      type="text" 
                      value={staff.contact}
                      onChange={e => handleInputChange(index, 'contact', e.target.value)}
                      className="w-full border border-gray-300 rounded p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select 
                      value={staff.status}
                      onChange={e => handleInputChange(index, 'status', e.target.value)}
                      className="w-full border border-gray-300 rounded p-2"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {processing ? 'Saving...' : `Save ${staffList.length} Staff Members`}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};

export default ExecutorStaff;