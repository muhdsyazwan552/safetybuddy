import React, { useState } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AppLayout from '@/Pages/Admin/Layout';
import dayjs from 'dayjs';

const ExecutorStaff = ({ title, company, staff }) => {
  const [showForm, setShowForm] = useState(false);
  const [showCreatePage, setShowCreatePage] = useState(false);
  
  const { data, setData, post, processing, errors, reset } = useForm({
    executor_company_id: company.id,
    name: '',
    role: '',
    email: '',
    contact: '',
    status: 'active',
  });

  const submit = (e) => {
    e.preventDefault();
    post('/executor-staff', {
      onSuccess: () => {
        reset();
        setShowForm(false);
      }
    });
  };

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
                onClick={() => setShowForm(true)}
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

          {/* Company info here (same as your code) */}

          {/* Add Staff Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                <h2 className="text-lg font-bold mb-4">Add New Staff</h2>
                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input 
                      type="text" 
                      value={data.name}
                      onChange={e => setData('name', e.target.value)}
                      className="mt-1 w-full border rounded p-2"
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Role</label>
                    <input 
                      type="text" 
                      value={data.role}
                      onChange={e => setData('role', e.target.value)}
                      className="mt-1 w-full border rounded p-2"
                    />
                    {errors.role && <p className="text-red-500 text-sm">{errors.role}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Email</label>
                    <input 
                      type="email" 
                      value={data.email}
                      onChange={e => setData('email', e.target.value)}
                      className="mt-1 w-full border rounded p-2"
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Contact</label>
                    <input 
                      type="text" 
                      value={data.contact}
                      onChange={e => setData('contact', e.target.value)}
                      className="mt-1 w-full border rounded p-2"
                    />
                    {errors.contact && <p className="text-red-500 text-sm">{errors.contact}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium">Status</label>
                    <select 
                      value={data.status}
                      onChange={e => setData('status', e.target.value)}
                      className="mt-1 w-full border rounded p-2"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button 
                      type="button" 
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={processing}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Staff Cards Grid (same as your code) */}
          <div className="p-6">
            {/* Company Information Card */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">{company.name}</h2>
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
                <div className="mt-2 flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {company.short_name}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">Reg: {company.registration_number}</span>
                </div>
              </div>
              
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm"><span className="font-medium">Email:</span> {company.email}</p>
                    <p className="text-sm"><span className="font-medium">Phone:</span> {company.contact}</p>
                    <p className="text-sm"><span className="font-medium">Address:</span> {company.address}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Company Details</h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm"><span className="font-medium">Established:</span> {company.established_date}</p>
                    <p className="text-sm"><span className="font-medium">Staff Count:</span> {staff.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Staff Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Staff Members</h2>
              <p className="text-sm text-gray-500 mt-1">Total {staff.length} staff members</p>
            </div>

            {/* Staff Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map(member => (
                <div key={member.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xl">
                        {member.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <h3 className="font-medium text-lg">{member.name}</h3>
                        <p className="text-sm text-blue-600">{member.role}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center text-sm">
                        <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {member.email}
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {member.contact}
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {member.department}
                      </div>
                      
                      <div className="flex items-center text-sm">
                        <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Joined on {dayjs(member.created_at).format('DD MMMM YYYY [at] hh:mm A')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                    <button className="text-sm text-blue-600 hover:text-blue-900">Edit</button>
                    <button className="text-sm text-red-600 hover:text-red-900">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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

// New component for the dedicated staff creation page
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
    
    // Clear error for this field when user starts typing
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
    
    // Basic validation
    let hasErrors = false;
    const validatedStaffList = staffList.map(staff => {
      const errors = {};
      
      if (!staff.name.trim()) {
        errors.name = 'Name is required';
        hasErrors = true;
      }
      
      if (!staff.role.trim()) {
        errors.role = 'Role is required';
        hasErrors = true;
      }
      
      if (!staff.email.trim()) {
        errors.email = 'Email is required';
        hasErrors = true;
      } else if (!/\S+@\S+\.\S+/.test(staff.email)) {
        errors.email = 'Email is invalid';
        hasErrors = true;
      }
      
      return { ...staff, errors };
    });
    
    if (hasErrors) {
      setStaffList(validatedStaffList);
      return;
    }
    
    // Submit the form
    post('/executor-staff/bulk', {
      data: { 
        staff: staffList,
        executor_company_id: company.id
      },
      onSuccess: () => {
        onSuccess();
      },
      onError: (errors) => {
        // Handle server-side errors
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
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
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
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
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
                    <label className="block text-sm font-medium mb-1">Email *</label>
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
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
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