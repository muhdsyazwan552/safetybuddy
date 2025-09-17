// resources/js/Pages/Admin/PublicStaffForm.jsx
import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';

const PublicStaffForm = ({ company, title = "Add Staff Member" }) => {
  const [submitted, setSubmitted] = useState(false);

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
    post('/public/staff', {
      onSuccess: () => {
        reset();
        setSubmitted(true);
      }
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h2 className="mt-4 text-xl font-bold text-gray-800">Successfully Submitted!</h2>
            <p className="mt-2 text-gray-600">Staff information has been successfully submitted to {company.name}.</p>
            <p className="mt-4 text-sm text-gray-500">You can close this window now.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <Head title={title} />
      
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-xl font-bold text-white">{company.name} - Add Staff Member</h1>
          <p className="text-blue-100 text-sm mt-1">Please fill out the form below to add a staff member</p>
        </div>
        
        <form onSubmit={submit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input 
              type="text" 
              required
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter full name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role/Position *</label>
            <input 
              type="text" 
              required
              value={data.role}
              onChange={e => setData('role', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter role or position"
            />
            {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address *</label>
            <input 
              type="email" 
              required
              value={data.email}
              onChange={e => setData('email', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Contact Number</label>
            <input 
              type="text" 
              value={data.contact}
              onChange={e => setData('contact', e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter contact number"
            />
            {errors.contact && <p className="text-red-500 text-sm mt-1">{errors.contact}</p>}
          </div>

          <input type="hidden" value={data.status} />

          <div className="bg-gray-50 px-4 py-3 rounded">
            <p className="text-xs text-gray-500">
              By submitting this form, you confirm that the information provided is accurate and that you have permission to add this staff member.
            </p>
          </div>

          <div>
            <button 
              type="submit" 
              disabled={processing}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {processing ? 'Submitting...' : 'Submit Staff Information'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicStaffForm;