
import { Link, usePage } from '@inertiajs/react'; // Fixed import
import { useEffect } from 'react';
import {
  FaTimes, FaAngleDoubleLeft, FaAngleDoubleRight, FaCogs, FaExclamationCircle, FaWrench,
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
      { name: 'Inspections', href: '/inspection', icon: FaSearch },
      { name: 'Toolbox Talks', href: '/toolbox-talks', icon: FaHardHat },
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
  setMobileSidebarOpen,
}) {
  const { url } = usePage();

  const isActive = (href) => {
    if (href === '/dashboard') return url === href;
    return url.startsWith(href);
  };

  // Close the mobile drawer after navigating, and lock body scroll while open
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [url]);

  useEffect(() => {
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileSidebarOpen]);

  // The mobile drawer always renders the full (non-compact) sidebar.
  const renderContent = (compact) => (
    <>
      <div className={`flex items-center ${compact ? 'justify-center' : 'justify-between'} px-4 h-16 shrink-0 border-b border-white/10`}>
        <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
          <img src="/images/logo.png" alt="Safety Buddy" className="h-10 w-10 rounded-full shrink-0 ring-2 ring-brand-500" />
          {!compact && (
            <span className="leading-tight min-w-0">
              <span className="block text-base font-extrabold text-white truncate">Safety Buddy</span>
              <span className="block text-[10px] font-semibold tracking-wider text-brand-400 uppercase truncate">Control. Performance. Report.</span>
            </span>
          )}
        </Link>
        {!compact && (
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden p-2 -mr-2 text-ink-300 hover:text-white"
            aria-label="Close menu"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className={`flex-1 overflow-y-auto sb-scroll px-3 py-4 ${compact ? 'space-y-3' : 'space-y-5'}`}>
        {NAVIGATION.map((section, index) => (
          <div key={index}>
            {!compact && section.category && (
              <div className="px-2 mb-2 text-[11px] font-bold tracking-wider text-ink-300 uppercase">
                {section.category}
              </div>
            )}
            {compact && section.category && index > 0 && <div className="mx-2 mb-2 border-t border-white/10" />}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={compact ? item.name : undefined}
                      className={`flex items-center rounded-lg px-3 py-2.5 text-sm transition-colors border-l-4
                        ${compact ? 'justify-center px-0' : ''}
                        ${active
                          ? 'bg-brand-500 text-ink-900 font-bold border-brand-300 shadow'
                          : 'text-gray-300 hover:bg-white/5 hover:text-white border-transparent'}`}
                    >
                      <item.icon className={`w-5 h-5 shrink-0 ${active ? 'text-ink-900' : 'text-brand-400'}`} />
                      {!compact && <span className="ml-3 truncate">{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="hidden lg:block shrink-0 border-t border-white/10 p-3">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs text-ink-300 hover:bg-white/5 hover:text-white"
        >
          {collapsed ? <FaAngleDoubleRight /> : <><FaAngleDoubleLeft /><span>Collapse</span></>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar (>= lg) */}
      <aside
        className={`hidden lg:flex flex-col h-full shrink-0 bg-ink-900 border-r border-black/30 transition-[width] duration-300
          ${collapsed ? 'w-20' : 'w-64'}`}
      >
        {renderContent(collapsed)}
      </aside>

      {/* Mobile / tablet drawer (< lg) */}
      <div className={`lg:hidden fixed inset-0 z-50 ${mobileSidebarOpen ? '' : 'pointer-events-none'}`} aria-hidden={!mobileSidebarOpen}>
        <div
          onClick={() => setMobileSidebarOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${mobileSidebarOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <aside
          className={`absolute inset-y-0 left-0 flex flex-col w-72 max-w-[85vw] bg-ink-900 shadow-2xl transition-transform duration-300
            ${mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {renderContent(false)}
        </aside>
      </div>
    </>
  );
}
