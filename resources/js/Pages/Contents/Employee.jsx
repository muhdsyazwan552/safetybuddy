import { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Pages/Admin/Layout';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const StaffManagement = ({ title }) => {
  // Get all props from Inertia
  const { props } = usePage();
  const { staff: initialStaff, roles, auth } = props;

  // Filter staff by company_id and role_id = 4
  const [staffMembers, setStaffMembers] = useState(
    initialStaff.filter(user => 
      user.role_id === '4' && // Filter by role_id = 4
      user.company_id === auth.user.company_id
    )
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
 
  // New staff form state - include company_id and set role_id to 4 by default
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role_id: 4, // Set default role_id to 4
    phone: '',
    company_id: auth.user.company_id
  });

  // Filter staff based on search term
  const filteredStaff = staffMembers.filter(staff =>
    staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredStaff.length / entriesToShow);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * entriesToShow,
    currentPage * entriesToShow
  );

  const handleEdit = (staff) => {
    setEditingId(staff.id);
    setEditValues({
      name: staff.name,
      email: staff.email,
      role_id: staff.role_id,
      phone: staff.phone || ''
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const response = await axios.put(`/staff/${id}`, {
        ...editValues,
        company_id: auth.user.company_id
      });
      
      if (response.data.success) {
        setStaffMembers(staffMembers.map(item => 
          item.id === id ? { ...item, ...editValues } : item
        ));
        setEditingId(null);
        toast.success('Staff member updated successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      toast.error('Failed to update staff member. Please try again.', {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      try {
        await axios.delete(`/staff/${id}`);
        setStaffMembers(staffMembers.filter(item => item.id !== id));
        toast.success('Staff member deleted successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
      } catch (error) {
        console.error('Error deleting staff:', error);
        toast.error('Failed to delete staff member. Please try again.', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStaff(prev => ({ ...prev, [name]: value }));
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: newStaff.name,
        email: newStaff.email,
        phone: newStaff.phone,
        role_id: 4,
        company_id: auth.user.company_id,
      };

      const response = await axios.post('/staff', payload);
      
      if (response.data.success) {
        setStaffMembers([...staffMembers, response.data.staff]);
        setNewStaff({
          name: '',
          email: '',
          role_id: 4, // Reset to 4
          phone: '',
          company_id: auth.user.company_id
        });
        setIsAdding(false);
        toast.success('Staff member added successfully!', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      if (error.response && error.response.data.errors) {
        const errorMessages = Object.values(error.response.data.errors).join('\n');
        toast.error(errorMessages, {
          position: "top-right",
          autoClose: 5000,
        });
      } else {
        toast.error('Failed to add staff member. Please try again.', {
          position: "top-right",
          autoClose: 3000,
        });
      }
    }
  };

  const closeModal = () => {
    setIsAdding(false);
    setNewStaff({
      name: '',
      email: '',
      role_id: 4,
      phone: '',
      company_id: auth.user.company_id
    });
  };

  return (
    <AppLayout>
      <Head title={title} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <button 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-800 transition-colors shadow-sm"
            onClick={() => setIsAdding(true)}
          >
            Add New Staff
          </button>
        </div>

        <div className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'>
          {/* Search and filter controls */}
          <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-gray-200">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div>
                <label className="mr-2 text-sm text-gray-600">Show</label>
                <select 
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                  value={entriesToShow}
                  onChange={(e) => {
                    setEntriesToShow(Number(e.target.value));
                    setCurrentPage(1); // Reset to first page when changing entries
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
                  setCurrentPage(1); // Reset to first page when searching
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedStaff.map((staff, index) => (
                  <tr key={staff.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(currentPage - 1) * entriesToShow + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {editingId === staff.id ? (
                        <input
                          type="text"
                          name="name"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={editValues.name}
                          onChange={(e) => setEditValues({...editValues, name: e.target.value})}
                        />
                      ) : (
                        staff.name
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === staff.id ? (
                        <input
                          type="email"
                          name="email"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={editValues.email}
                          onChange={(e) => setEditValues({...editValues, email: e.target.value})}
                        />
                      ) : (
                        staff.email
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {staff.role?.display_name || 'Role 4'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingId === staff.id ? (
                        <input
                          type="tel"
                          name="phone"
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          value={editValues.phone}
                          onChange={(e) => setEditValues({...editValues, phone: e.target.value})}
                        />
                      ) : (
                        staff.phone || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === staff.id ? (
                        <>
                          <button 
                            onClick={() => handleSaveEdit(staff.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            Save
                          </button>
                          <button 
                            onClick={() => setEditingId(null)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => handleEdit(staff)}
                            className="text-blue-600 hover:text-blue-900 mr-3 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(staff.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              className="h-5 w-5" 
                              viewBox="0 0 20 20" 
                              fill="currentColor"
                            >
                              <path 
                                fillRule="evenodd" 
                                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" 
                                clipRule="evenodd" 
                              />
                            </svg>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Previous
              </button>

              <span className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                {currentPage}
              </span>

              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Add Staff Modal */}
        {isAdding && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">Add New Staff Member</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAddStaff} className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter full name"
                      value={newStaff.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter email"
                      value={newStaff.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter phone number"
                      value={newStaff.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Add Staff
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StaffManagement;