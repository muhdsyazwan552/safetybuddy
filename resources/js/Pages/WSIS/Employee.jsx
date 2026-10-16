import { useEffect, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/Pages/WSIS/Layout';
import axios from 'axios';
import { showAlert } from '@/Helpers/alert';

// The three working tiers from the system document (Section 2).
// Role ids come from the `roles` table: 3 = Manager, 4 = Supervisor, 7 = Inspector.
const TIERS = {
  3: {
    tier: '1st Tier',
    name: 'Manager',
    action: 'Approves',
    detail: 'Company, projects and settings; contractor approval; final inspection, NC/CC and monthly approvals.',
    badge: 'bg-ink-900 text-brand-400',
  },
  4: {
    tier: '2nd Tier',
    name: 'Supervisor',
    action: 'Verifies',
    detail: 'Verifies inspections, NC/CC responses and monthly reports before they reach the Manager.',
    badge: 'bg-brand-500 text-ink-900',
  },
  7: {
    tier: '3rd Tier',
    name: 'Inspector',
    action: 'Creates',
    detail: 'Creates inspections and toolbox talks, collects evidence and issues NC/CC.',
    badge: 'bg-brand-100 text-brand-900',
  },
};

// dropdowns show the plain role name (no tier prefix)
const tierLabel = (id, fallback) => (TIERS[id] ? TIERS[id].name : fallback);

function TierBadge({ roleId, fallback }) {
  const t = TIERS[roleId];
  if (!t) {
    return (
      <span className="inline-flex flex-col">
        <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
          {fallback || 'No role'}
        </span>
        {roleId ? <span className="mt-1 text-[11px] text-amber-700">Role not recognised – please choose one</span> : null}
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col">
      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${t.badge}`}>
        {t.name}
      </span>
      <span className="mt-1 text-[11px] text-gray-500">{t.action} inspections &amp; reports</span>
    </span>
  );
}

const StaffManagement = ({ title }) => {
  // Get all props from Inertia
  const { props } = usePage();
  const { staff: initialStaff, roles, auth } = props;

  const [staffMembers, setStaffMembers] = useState(initialStaff || []);

  const [searchTerm, setSearchTerm] = useState('');
  const [entriesToShow, setEntriesToShow] = useState(10);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
 
  // New staff form state - use 'contact' instead of 'phone'
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    role_id: '',
    contact: '',  // Changed from 'phone' to 'contact'
    company_id: auth.user?.company_id || ''
  });

  // Filter staff based on search term
  const filteredStaff = staffMembers.filter(staff =>
    staff.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.contact?.toLowerCase().includes(searchTerm.toLowerCase())  // Added contact search
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
      // a role that is not Manager / Supervisor / Inspector must be re-assigned
      role_id: TIERS[Number(staff.role_id)] ? staff.role_id : '',
      contact: staff.contact || ''  // Changed from 'phone' to 'contact'
    });
  };

  const handleSaveEdit = async (id) => {
    if (!editValues.role_id) {
      showAlert.warning('Choose the role for this staff member first (Manager, Supervisor or Inspector).', 'Role required');
      return;
    }
    try {
      const response = await axios.put(`/staff/${id}`, {
        name: editValues.name,
        email: editValues.email,
        role_id: editValues.role_id,
        contact: editValues.contact,  // Changed from 'phone' to 'contact'
        company_id: auth.user.company_id
      });
      
      if (response.data.success) {
        setStaffMembers(staffMembers.map(item => 
          item.id === id
            ? { ...item, ...editValues, role: roles?.find((r) => String(r.id) === String(editValues.role_id)) || item.role }
            : item
        ));
        setEditingId(null);
        showAlert.success('Staff member updated successfully!');
      }
    } catch (error) {
      console.error('Error updating staff:', error);
      showAlert.error('Failed to update staff member. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    const ok = await showAlert.confirmDelete(
      'This staff member will be permanently removed.',
      'Delete this staff member?'
    );
    if (ok) {
      try {
        await axios.delete(`/staff/${id}`);
        setStaffMembers(staffMembers.filter(item => item.id !== id));
        showAlert.success('Staff member deleted successfully!');
      } catch (error) {
        console.error('Error deleting staff:', error);
        showAlert.error(error.response?.data?.message || 'Failed to delete staff member. Please try again.', 'Cannot delete');
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
        contact: newStaff.contact,  // Changed from 'phone' to 'contact'
        role_id: newStaff.role_id,
        company_id: auth.user.company_id,
      };

      const response = await axios.post('/staff', payload);
      
      if (response.data.success) {
        setStaffMembers([...staffMembers, response.data.staff]);
        setNewStaff({
          name: '',
          email: '',
          role_id: '',
          contact: '',  // Changed from 'phone' to 'contact'
          company_id: auth.user.company_id
        });
        setIsAdding(false);
        showAlert.success('Staff member added successfully!');
      }
    } catch (error) {
      console.error('Error adding staff:', error);
      if (error.response && error.response.data.errors) {
        const errorMessages = Object.values(error.response.data.errors).join('\n');
        showAlert.error(errorMessages);
      } else {
        showAlert.error('Failed to add staff member. Please try again.');
      }
    }
  };

  const closeModal = () => {
    setIsAdding(false);
    setNewStaff({
      name: '',
      email: '',
      role_id: '',
      contact: '',  // Changed from 'phone' to 'contact'
      company_id: auth.user.company_id
    });
  };

  // Debug: Log staff data to console
  useEffect(() => {
    console.log('Staff Data:', staffMembers);
    console.log('Roles:', roles);
  }, [staffMembers, roles]);

  return (
    <AppLayout>
      <Head title={title} />
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-5">
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
          <button 
            className="sb-create"
            onClick={() => setIsAdding(true)}
          >
            Add New Staff
          </button>
        </div>

        {/* Who does what */}
        <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[3, 4, 7].map((id) => (
            <div key={id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${TIERS[id].badge}`}>{TIERS[id].tier} · {TIERS[id].name}</span>
                <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{TIERS[id].action}</span>
              </div>
              <p className="mt-2 text-sm text-gray-600">{TIERS[id].detail}</p>
            </div>
          ))}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>  {/* Changed from Phone to Contact */}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedStaff.length > 0 ? (
                  paginatedStaff.map((staff, index) => (
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
                        {editingId === staff.id ? (
                          <select
                            name="role_id"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={editValues.role_id}
                            onChange={(e) => setEditValues({...editValues, role_id: e.target.value})}
                          >
                            <option value="">Select role</option>
                            {roles?.map(role => (
                              <option key={role.id} value={role.id}>
                                {tierLabel(role.id, role.display_name)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <TierBadge roleId={Number(staff.role_id)} fallback={staff.role?.display_name} />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingId === staff.id ? (
                          <input
                            type="tel"
                            name="contact"  // Changed from 'phone' to 'contact'
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            value={editValues.contact}  // Changed from editValues.phone
                            onChange={(e) => setEditValues({...editValues, contact: e.target.value})}  // Changed to contact
                          />
                        ) : (
                          staff.contact || '-'  // Changed from staff.phone to staff.contact
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No staff members found
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
          )}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                    <select
                      name="role_id"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={newStaff.role_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select role</option>
                      {roles?.map(role => (
                        <option key={role.id} value={role.id}>
                          {tierLabel(role.id, role.display_name)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>  {/* Changed label */}
                    <input
                      type="tel"
                      name="contact"  // Changed from 'phone' to 'contact'
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter contact number"
                      value={newStaff.contact}  // Changed from newStaff.phone
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