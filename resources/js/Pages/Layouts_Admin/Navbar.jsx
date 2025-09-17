import { FaBars, FaUserCircle, FaChevronDown, FaSignOutAlt, FaHome, FaAlignRight, FaArrowsAlt, FaArrowsAltH, FaLongArrowAltLeft, FaArrowLeft, FaArrowAltCircleLeft } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { FiAlignLeft } from 'react-icons/fi';

export default function Navbar({ 
  collapsed, 
  setCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen  }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const { auth, title } = usePage().props;
  const user = auth?.user;
  
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

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="group flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-100 transition-all duration-200 focus:outline-none"
        >
          <FaUserCircle className="text-gray-500 group-hover:text-blue-600 text-2xl transition-colors duration-200" />
          <span className="hidden md:inline text-sm font-medium text-gray-700 group-hover:text-blue-600">
            {user.name}
          </span>
          <FaChevronDown
            className={`text-gray-400 text-sm transition-transform duration-300 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>


        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50">
            <div className="px-4 py-2 border-b">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.company}</p>
            </div>
            <a
              href="#profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Profile
            </a>
            <a
              href="#account-details"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Account Details
            </a>
            <a
              href="#logout"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </a>
          </div>
        )}
      </div>
    </header>
  );
}