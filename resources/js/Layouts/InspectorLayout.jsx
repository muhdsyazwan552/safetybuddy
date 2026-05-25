// resources/js/Layouts/InspectorLayout.jsx

import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutDashboard, 
    HardHat, 
    ClipboardCheck, 
    Settings, 
    LogOut,
    Menu,
    X,
    Building2,
    Users,
    BarChart3
} from 'lucide-react';

export default function InspectorLayout({ children, user }) {
    const { url } = usePage();

    // Bottom Menu Items (Mobile/Tablet Focused)
    const bottomNav = [
        { name: 'Dashboard', href: '/inspector/dashboard', icon: LayoutDashboard },
        { name: 'Talks', href: '/inspector/toolbox-talks', icon: HardHat },
        { name: 'Inspect', href: '/inspector/inspections', icon: ClipboardCheck },
        { name: 'Settings', href: '/inspector/settings', icon: Settings },
    ];

    // Full Navigation (Sidebar/Desktop)
    const sidebarNav = [
        ...bottomNav.slice(0, 3), // First three
        { name: 'Projects', href: '/inspector/projects', icon: Building2 },
        { name: 'Subcontractors', href: '/inspector/subcon-companies', icon: Users },
        { name: 'Reports', href: '/inspector/reports', icon: BarChart3 },
        bottomNav[3], // Settings
    ];

    const isActive = (href) => {
        return url === href || url.startsWith(href + '/');
    };

    const handleLogout = (e) => {
        e.preventDefault();
        window.location.href = '/logout';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
            
            {/* Desktop Sidebar (Only visible on lg screens) */}
            <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200">
                <div className="p-6">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Inspector Portal
                    </h1>
                </div>
                
                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {sidebarNav.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
                                isActive(item.href)
                                    ? 'bg-blue-50 text-blue-700 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400'}`} />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Desktop User Profile */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-2xl">
                        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
                            {user?.name?.charAt(0) || 'I'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Inspector</p>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-rose-500 transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Mobile/Tablet Content Wrapper */}
            <div className="flex-1 lg:pl-72 pb-24 lg:pb-0">
                
                {/* Mobile Top Header */}
                <header className="lg:hidden bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100 px-4 py-3 flex justify-end items-center">
                    
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold uppercase">
                        {user?.name?.charAt(0)}
                    </div>
                </header>

                <main className="min-h-screen">
                    {children}
                </main>
            </div>

            {/* Floating Bottom Navigation (Visible on Mobile/Tablet) */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent">
                <nav className="bg-gray-900 shadow-2xl shadow-black/20 rounded-2xl flex items-center justify-around p-2 border border-white/10">
                    {bottomNav.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all"
                        >
                            <item.icon className={`w-6 h-6 transition-colors ${
                                isActive(item.href) ? 'text-blue-400 scale-110' : 'text-gray-400'
                            }`} />
                            <span className={`text-[10px] mt-1 font-medium ${
                                isActive(item.href) ? 'text-white' : 'text-gray-500'
                            }`}>
                                {item.name}
                            </span>
                            {isActive(item.href) && (
                                <div className="absolute -bottom-1 w-1 h-1 bg-blue-400 rounded-full" />
                            )}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}