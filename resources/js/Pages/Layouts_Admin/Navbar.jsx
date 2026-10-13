import { FaBars, FaUserCircle, FaChevronDown, FaSignOutAlt, FaHome, FaUser, FaBuilding } from 'react-icons/fa';
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

  return (
    <header className="bg-ink-900 text-white border-b-2 border-brand-500 shadow px-3 sm:px-6 h-16 shrink-0 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile / tablet: open drawer */}
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="lg:hidden p-2 -ml-2 text-brand-400 text-xl focus:outline-none"
          aria-label="Open menu"
        >
          <FaBars />
        </button>

        {/* Desktop: collapse / expand sidebar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:block p-2 text-brand-400 hover:text-brand-300 focus:outline-none"
          aria-label="Toggle sidebar"
        >
          <FiAlignLeft className="w-5 h-5" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-ink-300 min-w-0">
          <a href="/dashboard" className="hidden sm:flex items-center hover:text-brand-400">
            <FaHome className="mr-1" />
            <span>Home</span>
          </a>
          <span className="mx-2 hidden sm:inline">/</span>
          <span className="text-white font-semibold truncate">{title || 'Dashboard'}</span>
        </div>
      </div>

      {/* User Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="group flex items-center gap-2 px-2 sm:px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200 focus:outline-none"
        >
          <FaUserCircle className="text-brand-400 text-2xl transition-colors duration-200" />
          <span className="hidden md:inline max-w-[12rem] truncate text-sm font-medium text-gray-100 group-hover:text-brand-400">
            {displayName}
          </span>
          <FaChevronDown
            className={`hidden sm:block text-ink-300 text-sm transition-transform duration-300 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-white text-gray-800 rounded-md shadow-xl py-1 z-50">
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
                onClick={() => router.get('/settings')}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center transition-colors duration-150"
              >
                <FaUserCircle className="mr-2 text-gray-500" />
                Settings
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