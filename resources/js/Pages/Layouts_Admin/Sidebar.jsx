
import { Link, usePage } from '@inertiajs/react'; // Fixed import
import { useState, useRef, useEffect } from 'react'; // For Navbar
import {
  FaBars, FaCogs, FaExclamationCircle, FaWrench,
  FaHardHat, FaSearch, FaBan, FaFlag,
  FaHome, FaHourglass, FaBiohazard,
  FaRegBuilding,
  FaCalendar,
  FaCalendarWeek,
  FaUser,
  FaPeopleCarry,
  FaLayerGroup,
  FaObjectGroup,
  FaParagraph,
  FaChartLine
} from 'react-icons/fa';

// Make sure navigation is properly defined as an array
const NAVIGATION = [  // Changed to uppercase constant
       {
    category: '',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: FaHome },
    ],
  },
  {
    category: 'Performance Metric Setting',
    items: [
      { name: 'Compliance Metrics', href: '/compliance-metrics', icon: FaCogs },
      { name: 'Penalty Settings', href: '/penalty-settings', icon: FaExclamationCircle },
    ],
  },
  {
    category: 'Project Setting',
    items: [
      { name: 'Project', href: '/manage-project', icon: FaHardHat },
      { name: 'Employee', href: '/manage-employee', icon: FaUser },
      { name: 'Executor', href: '/executor-project', icon: FaPeopleCarry },
    ],
  },
  {
    category: 'Inspection',
    items: [
      { name: 'Inspection', href: '/inspection', icon: FaSearch },
      // { name: 'Dashboard', href: '/dashboard-inspection', icon: FaChartLine },
    ],
  },
  {
    category: 'NC & CC',
    items: [
      { name: 'Non-Conformance', href: '/non-conformance', icon: FaBiohazard },
      { name: 'Client Complaint', href: '/client-complaint', icon: FaFlag },
    ],
  },
  {
    category: 'INCIDENT STATISTICS',
    items: [
      { name: 'Incident Statistic', href: '/incident-statistic', icon: FaRegBuilding },
     
    ],
  },
    {
    category: 'MAN-HOUR',
    items: [
      { name: 'Company Manhours', href: '/man-hour', icon: FaHourglass },
      { name: 'Overall Manhours', href: '/man-hour/overall', icon: FaChartLine },
     
    ],
  },
   {
    category: 'REPORTS',
    items: [
      { name: 'Daily Reports', href: '/daily-reports', icon: FaCalendar },
      { name: 'Monthly Reports', href: '/monthly-reports', icon: FaCalendarWeek },
     
    ],
  },
  {
    category: 'FEEDBACK',
    items: [
      { name: 'Feedback', href: '/e', icon: FaBan },
     
    ],
  },
];

export default function Sidebar({ 
  collapsed, 
  setCollapsed,
  mobileSidebarOpen,
  setMobileSidebarOpen 
}) {
  

  const { url } = usePage(); // Now properly imported

  const isActive = (href) => {
    // Special case for dashboard/home
    if (href === '/dashboard') {
      return url === href;
    }
    return url.startsWith(href);
  };

  return (
     <aside className={`h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out
      ${collapsed ? 'w-24' : 'w-64'} px-4 py-6 flex flex-col`}>
      
      <div className='flex items-center justify-center mb-4'>
        {!collapsed && (
          <div className="mb-6 px-3 text-center">
            <img
              className="block w-auto h-12"
              src="https://djati.com.my/wp-content/uploads/2024/08/Symbol-D.png"
            />
          </div>
        )}

        {/* Only show toggle button when sidebar is expanded */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-600 mb-6 focus:outline-none"
          >
            <FaBars className="w-5 h-5 mx-auto" />
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 ${collapsed ? 'space-y-4' : 'space-y-6'}`}>
        {NAVIGATION.map((section, index) => ( // Using NAVIGATION constant
          <div key={index}>
            {!collapsed && section.category && (
              <div className="text-xs font-semibold text-gray-400 uppercase mb-2">
                {section.category}
              </div>
            )}
            <ul className="space-y-1">
              {section.items.map((item, idx) => (
                <li key={idx}>
                  <Link
                    href={item.href}
                    className={`flex items-center px-2 py-2 text-sm rounded transition-colors
                      ${collapsed ? 'justify-center' : ''}
                      ${
                        isActive(item.href)
                          ? 'bg-blue-50 text-blue-600 font-medium border-l-4 border-blue-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-500'}`} />
                    {!collapsed && <span className="ml-3">{item.name}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
