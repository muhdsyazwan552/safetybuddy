import React, { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import { showAlert } from '@/Helpers/alert';
import { 
  FaBuilding, 
  FaUserCircle, 
  FaChevronDown, 
  FaSignOutAlt, 
  FaUser, 
  FaCreditCard, 
  FaCrown,
  FaExchangeAlt,
  FaShieldAlt,
  FaHeartbeat,
  FaLeaf,
  FaBook,
  FaExclamationTriangle,
  FaChartLine
} from 'react-icons/fa';

const iconMap = {
    'SB360-WSIS': '📊',
    'SB360-PS':   '✍️',
    'SB360-C':    '✅',
    'SB360-T':    '💰',
    'SB360-N':    '🤖',
    'SB360-A':    '🌐',
};

const accentMap = {
    'SB360-WSIS': { badge: 'bg-blue-100 text-blue-600' },
    'SB360-PS':   { badge: 'bg-emerald-100 text-emerald-600' },
    'SB360-C':    { badge: 'bg-amber-100 text-amber-600' },
    'SB360-T':    { badge: 'bg-rose-100 text-rose-600' },
    'SB360-N':    { badge: 'bg-purple-100 text-purple-600' },
    'SB360-A':    { badge: 'bg-cyan-100 text-cyan-600' },
};

const pathMap = {
    'SB360-WSIS': '/dashboard',
};

const ModuleCard = ({ module }) => {
    const icon      = iconMap[module.code] ?? '🔧';
    const accent    = accentMap[module.code] ?? { badge: 'bg-gray-100 text-gray-600' };
    const path      = pathMap[module.code]  ?? null;
    const isFree    = parseFloat(module.price) === 0;
    const available = module.is_available;

    // Subscription state
    const isExpired          = module.sub_status === 'expired';
    const hasSubscribedBefore = module.has_subscribed_before;
    const needsRenew         = isExpired && hasSubscribedBefore;
    const needsNew           = !available && !isFree && !hasSubscribedBefore;

    const handleClick = () => {
        if (available && path) {
            router.visit(path);
        }
    };

    const handleSubscribeClick = (e) => {
        e.stopPropagation();
        showAlert.info(`Please contact support to ${needsRenew ? 'renew' : 'subscribe to'} ${module.code}.`, needsRenew ? 'Renew module' : 'Subscribe to module');
    };

    return (
        <div
            onClick={handleClick}
            className={`
                group relative backdrop-blur-xl rounded-2xl border p-5
                flex flex-col items-center text-center
                transition-all duration-500
                ${available
                    ? 'bg-gray-200 border-gray-300 hover:shadow-2xl hover:shadow-gray-200/50 ' + (path ? 'cursor-pointer' : 'cursor-default')
                    : 'bg-gray-100 border-gray-200 opacity-80 cursor-default'
                }
            `}
        >
            {/* Top-right status badge */}
            {!available && !isFree && (
                <div className="absolute top-3 right-3 z-20">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                        needsRenew
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-800 text-white'
                    }`}>
                        {needsRenew ? '⚠️ Expired' : '🔒 Locked'}
                    </span>
                </div>
            )}

            <div className="relative z-10 w-full flex flex-col items-center">

                {/* Icon */}
                <div className="flex flex-col items-center mb-4 gap-2 w-full">
                    <div className={`text-4xl p-3 rounded-2xl shadow-inner mb-2 ${
                        available ? 'bg-white' : 'bg-gray-200 grayscale'
                    }`}>
                        {icon}
                    </div>

                    {/* Status badge */}
                    <span className={`text-[10px] uppercase tracking-wider font-bold px-3 py-0.5 rounded-full border border-white ${
                        isFree
                            ? 'bg-green-100 text-green-600'
                            : available
                                ? accent.badge
                                : needsRenew
                                    ? 'bg-orange-100 text-orange-500'
                                    : 'bg-gray-200 text-gray-400'
                    }`}>
                        {isFree
                            ? '✓ Free'
                            : available
                                ? '● Active'
                                : needsRenew
                                    ? '↻ Expired'
                                    : `RM ${parseFloat(module.price).toFixed(2)}`
                        }
                    </span>
                </div>

                {/* Module Code */}
                <h3 className={`text-md font-bold tracking-tight mb-1 transition-colors ${
                    available ? 'text-gray-800 group-hover:text-indigo-600' : 'text-gray-400'
                }`}>
                    {module.code}
                </h3>

                {/* Module Name */}
                <p className={`text-xs font-semibold mb-1 ${available ? 'text-gray-700' : 'text-gray-400'}`}>
                    {module.name}
                </p>

                {/* Description */}
                <p className={`text-xs leading-relaxed mb-3 min-h-[40px] ${available ? 'text-gray-500' : 'text-gray-400'}`}>
                    {module.description || '—'}
                </p>

                {/* End date hint for active subscriptions */}
                {available && !isFree && module.sub_end_date && (
                    <p className="text-xs text-gray-500 mb-2">
                        Valid until {module.sub_end_date ? new Date(module.sub_end_date).toLocaleDateString('en-GB') : 'N/A'}
                    </p>
                )}

                {/* Action footer */}
                <div className="flex items-center justify-center pt-2 border-t border-gray-100 w-full mt-auto">
                    {available && path ? (
                        <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                            Enter <span className="text-sm">→</span>
                        </span>
                    ) : available && !path ? (
                        <span className="text-xs text-gray-400 font-medium">Coming Soon</span>
                    ) : isFree ? null : needsRenew ? (
                        <button
                            onClick={handleSubscribeClick}
                            className="text-xs bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-1.5 rounded-full transition-all"
                        >
                            ↻ Renew Now
                        </button>
                    ) : (
                        <button
                            onClick={handleSubscribeClick}
                            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-1.5 rounded-full transition-all"
                        >
                            + Subscribe
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const Module = () => {
    const { modules, auth } = usePage().props;
    const user = auth?.user;
    const company = user?.company_id ? user.company : null;
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const isCompanyUser = user?.role_id === 2;
    const displayName = isCompanyUser && company?.name ? company.name : user?.name;

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

    // Available modules for switcher
    const modulesList = [
        { name: 'Safety Module', path: '/module', icon: <FaShieldAlt className="mr-2 text-blue-500" /> },
        { name: 'Health Module', path: '/module/health', icon: <FaHeartbeat className="mr-2 text-green-500" /> },
        { name: 'Environment Module', path: '/module/environment', icon: <FaLeaf className="mr-2 text-emerald-500" /> },
        { name: 'Training Module', path: '/module/training', icon: <FaBook className="mr-2 text-purple-500" /> },
        { name: 'Incident Module', path: '/module/incident', icon: <FaExclamationTriangle className="mr-2 text-red-500" /> },
        { name: 'Audit Module', path: '/module/audit', icon: <FaChartLine className="mr-2 text-indigo-500" /> },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-tr from-gray-50 via-white to-blue-50">
            {/* Navbar */}
            <nav className="bg-white shadow-lg sticky top-0 z-50">
                <div className="max-w-[1600px] mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Left side - Logo and Company Info */}
                        <div className="flex items-center space-x-6">
                            {/* Logo */}
                            <div className="flex items-center space-x-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-brand-600 to-brand-800 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">SB</span>
                                </div>
                                <span className="font-bold text-gray-800 text-lg hidden sm:block">SafetyBuddy</span>
                            </div>

                            
                        </div>

                        {/* Right side - Profile Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={toggleDropdown}
                                className="group flex items-center gap-3 px-3 py-2 rounded-full hover:bg-gray-100 transition-all duration-200 focus:outline-none border border-gray-200"
                            >
                                <FaUserCircle className="text-gray-500 group-hover:text-indigo-600 text-2xl transition-colors duration-200" />
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-gray-700 group-hover:text-indigo-600">
                                        {displayName}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {isCompanyUser ? 'Company Account' : 'User Account'}
                                    </p>
                                </div>
                                <FaChevronDown
                                    className={`text-gray-400 text-sm transition-transform duration-300 ${
                                        isDropdownOpen ? 'rotate-180' : ''
                                    }`}
                                />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-72 max-w-[90vw] bg-white rounded-lg shadow-xl py-2 z-50 border border-gray-100">
                                    {/* User/Company Info Header */}
                                    <div className="px-4 py-3 border-b bg-gradient-to-r from-gray-50 to-white rounded-t-lg">
                                        {isCompanyUser && company ? (
                                            <>
                                                <p className="text-sm font-bold text-gray-900">{company.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{company.email}</p>
                                                {company.registration_no && (
                                                    <p className="text-xs text-gray-400 mt-1">Reg No: {company.registration_no}</p>
                                                )}
                                                <p className="text-xs text-indigo-600 mt-2 flex items-center">
                                                    <FaCrown className="mr-1 text-xs" />
                                                    Company Account
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm font-bold text-gray-900">{user?.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                                                <p className="text-xs text-gray-400 mt-1">Role: {user?.role?.name || 'User'}</p>
                                            </>
                                        )}
                                    </div>

                                    
                                   

                                    {/* Profile & Company Section */}
                                    <div className="border-b">
                                        <button
                                            onClick={() => router.get('/profile')}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-150"
                                        >
                                            <FaUser className="mr-3 text-blue-500" />
                                            Profile Details
                                        </button>
                                        
                                        {isCompanyUser && (
                                            <button
                                                onClick={() => router.get('/company-profile')}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-150"
                                            >
                                                <FaBuilding className="mr-3 text-purple-500" />
                                                Company Profile
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={() => router.get('/company-plan')}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-150"
                                        >
                                            <FaCreditCard className="mr-3 text-green-500" />
                                            Company Plan & Billing
                                        </button>
                                    </div>

                                    {/* Logout */}
                                    <div className="pt-1">
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors duration-150"
                                        >
                                            <FaSignOutAlt className="mr-3" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="py-12 px-6 flex items-center justify-center">
                <div className="max-w-[1600px] w-full mx-auto">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">
                            List{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-800">
                                Modules
                            </span>
                        </h1>
                        <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full mb-6"></div>
                        <p className="text-gray-500 text-sm md:text-lg max-w-2xl mx-auto font-medium">
                            Select a system module to begin your workflow
                        </p>
                    </div>

                    {/* Grid */}
                    {modules.length === 0 ? (
                        <p className="text-center text-gray-400">No active modules found.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                            {modules.map(module => (
                                <ModuleCard key={module.id} module={module} />
                            ))}
                        </div>
                    )}

                    {/* Footer */}
                    <div className="mt-40 text-center">
                        <p className="text-gray-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                            © 2024 SB360 Ecosystem • Modern Interface
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Module;