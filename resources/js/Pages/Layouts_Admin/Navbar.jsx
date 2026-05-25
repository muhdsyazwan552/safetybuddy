import { FaBars, FaUserCircle, FaChevronDown, FaSignOutAlt, FaHome, FaExchangeAlt, FaUser, FaBuilding, FaShieldAlt, FaHeartbeat, FaLeaf, FaBook, FaExclamationTriangle, FaChartLine } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { FiAlignLeft } from 'react-icons/fi';

export default function Navbar({ 
  collapsed, 
  setCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen  
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const { auth, title } = usePage().props;
  const user = auth?.user;
  const company = user?.company_id ? user.company : null;

  // Check if user role is 2 (company)
  const isCompanyUser = user?.role_id === 2;
  
  // Display name based on role
  const displayName = isCompanyUser && user?.company?.name 
    ? user.company.name 
    : user?.name;
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    router.post('/logout');
  };

  const handleModuleChange = (modulePath) => {
    router.get(modulePath);
    setIsDropdownOpen(false);
  };

  // Available modules with their respective icons
  const modules = [
    { name: 'Safety Module', path: '/module', icon: <FaShieldAlt className="mr-2 text-blue-500" /> },
    { name: 'Health Module', path: '/module/health', icon: <FaHeartbeat className="mr-2 text-green-500" /> },
    { name: 'Environment Module', path: '/module/environment', icon: <FaLeaf className="mr-2 text-emerald-500" /> },
    { name: 'Training Module', path: '/module/training', icon: <FaBook className="mr-2 text-purple-500" /> },
    { name: 'Incident Module', path: '/module/incident', icon: <FaExclamationTriangle className="mr-2 text-red-500" /> },
    { name: 'Audit Module', path: '/module/audit', icon: <FaChartLine className="mr-2 text-indigo-500" /> },
  ];

  return (
    <header className="bg-white shadow px-6 py-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Mobile toggle button (always visible on mobile) */}
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="text-gray-700 text-xl focus:outline-none md:hidden mr-2"
        >
          <FaBars />
        </button>

        {/* Desktop toggle button (only visible when sidebar is collapsed) */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-600 hidden md:block focus:outline-none mr-2"
          >
            <FiAlignLeft className="w-5 h-5" />
          </button>
        )}

        {/* Breadcrumb Navigation */}
        <div className="flex items-center text-sm text-gray-600">
          <a href="/dashboard" className="flex items-center hover:text-blue-600">
            <FaHome className="mr-1" />
            <span>Home</span>
          </a>
          <span className="mx-2">/</span>
          <span className="text-gray-800 font-medium">{title || 'Dashboard'}</span>
        </div>
      
      </div>

      {/* User Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="group flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-all duration-200 focus:outline-none"
        >
          <FaUserCircle className="text-gray-500 group-hover:text-blue-600 text-2xl transition-colors duration-200" />
          <span className="hidden md:inline text-sm font-medium text-gray-700 group-hover:text-blue-600">
            {displayName}
          </span>
          <FaChevronDown
            className={`text-gray-400 text-sm transition-transform duration-300 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50">
            {/* User Info Section */}
            <div className="px-4 py-2 border-b bg-gray-50 rounded-t-md">
              <p className="text-sm font-semibold text-gray-900">
                {isCompanyUser ? user?.company?.name : user?.name}
              </p>
              <p className="text-xs text-gray-500">
                {isCompanyUser ? 'Company Account' : `Role: ${user?.role?.name || 'User'}`}
              </p>
              {!isCompanyUser && user?.email && (
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {user.email}
                </p>
              )}
              {isCompanyUser && company?.email && (
                <p className="text-xs text-gray-400 mt-1 truncate">
                  {company.email}
                </p>
              )}
            </div>

            {/* Module Switcher Section */}
            <div className="border-b">
              <div className="">
                
                <button
                onClick={() => router.get('/module')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-150"
              >
                <FaExchangeAlt className="mr-2 text-blue-500" />
                Module Switcher
              </button>
              </div>
             
            </div>

            {/* Profile & Account Section */}
            <div>
              <button
                onClick={() => router.get('/profile')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-150"
              >
                <FaUser className="mr-2 text-blue-500" />
                Profile
              </button>
              
              {isCompanyUser && (
                <button
                  onClick={() => router.get('/company-details')}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-150"
                >
                  <FaBuilding className="mr-2 text-purple-500" />
                  Company Details
                </button>
              )}
              
              <button
                onClick={() => router.get('/account-details')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-150"
              >
                <FaUserCircle className="mr-2 text-gray-500" />
                Account Details
              </button>
            </div>

            {/* Divider */}
            <div className="border-t my-1"></div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors duration-150"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}