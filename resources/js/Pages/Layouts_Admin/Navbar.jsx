import { FaBars, FaUserCircle, FaChevronDown, FaSignOutAlt, FaHome, FaCog } from 'react-icons/fa';
import { useState, useRef, useEffect } from 'react';
import { usePage, router, Link } from '@inertiajs/react';
import { FiAlignLeft } from 'react-icons/fi';
import { confirmLogout } from '@/Helpers/logout';
import CompanyAvatar from '@/Components/CompanyAvatar';
import { NAVIGATION, TRAINEES_SECTION } from './Sidebar';

export default function Navbar({ 
  collapsed, 
  setCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen  
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const { auth, title } = usePage().props;
  const { url } = usePage();
  const path = (url || '').split('?')[0].replace(/\/+$/, '') || '/';
  // a page that sits inside a menu section: Home / Section (link back to the section) / this page
  const section = [...NAVIGATION, TRAINEES_SECTION].flatMap((group) => group.items)
    .filter((item) => item.href !== '/dashboard' && (path === item.href || path.startsWith(`${item.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0];
  const deeper = section && path !== section.href;
  const sectionLabel = section ? (section.crumb || section.name) : null;
  const user = auth?.user;

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
    confirmLogout();
  };

  const openAccountPage = (url) => {
    setIsDropdownOpen(false);
    router.get(url);
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
          <Link href="/dashboard" className="hidden sm:flex items-center hover:text-brand-400">
            <FaHome className="mr-1" />
            <span>Home</span>
          </Link>
          <span className="mx-2 hidden sm:inline">/</span>
          {deeper && sectionLabel !== title && (
            <>
              <Link href={section.href} className="hidden sm:inline truncate hover:text-brand-400">{sectionLabel}</Link>
              <span className="mx-2 hidden sm:inline">/</span>
            </>
          )}
          <span className="text-white font-semibold truncate">{title || sectionLabel || 'Dashboard'}</span>
        </div>
      </div>

      {/* User Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className={`group flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/10 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${isCompanyUser ? 'sm:pr-2' : 'sm:px-3'}`}
          aria-label={isCompanyUser ? 'Open company settings menu' : 'Open account menu'}
          aria-expanded={isDropdownOpen}
        >
          {isCompanyUser ? <CompanyAvatar name={displayName} logoUrl={user?.company?.logo_url} className="h-10 w-10 text-base ring-1 ring-brand-400/60" /> : <FaUserCircle className="text-brand-400 text-2xl transition-colors duration-200" />}
          {!isCompanyUser && <span className="hidden max-w-[12rem] truncate text-sm font-medium text-gray-100 group-hover:text-brand-400 md:inline">{displayName}</span>}
          <FaChevronDown
            className={`hidden sm:block text-ink-300 text-sm transition-transform duration-300 ${
              isDropdownOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl bg-white text-gray-800 shadow-xl ring-1 ring-black/5 z-50">
            {/* User Info Section */}
            <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-sm font-bold text-gray-900">
                {isCompanyUser ? user?.company?.name : user?.name}
              </p>
              <p className="text-xs text-gray-500">
                {isCompanyUser ? 'Company Account' : `Role: ${user?.role?.name || 'User'}`}
              </p>
            </div>

            {/* Settings */}
            <div>
              <button
                onClick={() => openAccountPage('/settings')}
                className="flex w-full items-center px-4 py-2.5 text-left text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50"
              >
                <FaCog className="mr-2 text-gray-500" />
                Settings
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200"></div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex w-full items-center px-4 py-3 text-left text-sm text-red-600 transition-colors duration-150 hover:bg-red-50"
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
