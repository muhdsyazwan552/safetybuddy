// resources/js/Layouts/InspectorLayout.jsx
// Mobile-app style shell for the Inspector portal:
//  - phones/tablets: dark app bar on top with a menu button that opens the sidebar as a slide-in drawer
//  - desktop (lg+): dark sidebar always visible, same content
import React, { useEffect, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import Toast from '@/Components/Toast';
import {
    LayoutDashboard,
    HardHat,
    ClipboardCheck,
    Settings,
    LogOut,
    Building2,
    Users,
    BarChart3,
    ChevronLeft,
    Plus,
    ClipboardList,
    Menu,
    X,
    CalendarCheck,
    Siren,
} from 'lucide-react';
import { confirmLogout } from '@/Helpers/logout';

const TITLES = [
    ['/inspector/incidents/create', 'Report Incident'],
    ['/inspector/visits', 'Site Visits'],
    ['/inspector/incidents', 'Incidents'],
    ['/inspector/attendance', 'Attendance'],
    ['/inspector/visits/create', 'Site Visit'],
    ['/inspector/inspections/create', 'New Inspection'],
    ['/inspector/inspections', 'Inspections'],
    ['/inspector/toolbox-talks/create', 'New Toolbox Talk'],
    ['/inspector/toolbox-talks', 'Toolbox Talks'],
    ['/inspector/projects', 'Projects'],
    ['/inspector/subcon-companies', 'Subcontractors'],
    ['/inspector/reports', 'Reports'],
    ['/profile', 'My Profile'],
    ['/inspector/dashboard', 'Dashboard'],
];

export default function InspectorLayout({ children, user }) {
    const { url, props } = usePage();
    const authUser = user || props?.auth?.user;
    const path = url.split('?')[0];
    const [drawerOpen, setDrawerOpen] = useState(false);

    const title = (TITLES.find(([p]) => path === p || path.startsWith(p + '/')) || [null, 'Inspector'])[1];
    const isTopLevel = ['/inspector/dashboard', '/inspector/visits', '/inspector/inspections', '/inspector/toolbox-talks', '/inspector/attendance', '/inspector/incidents', '/profile', '/inspector/projects', '/inspector/subcon-companies', '/inspector/reports'].includes(path);

    const sidebarNav = [
        { name: 'Dashboard', href: '/inspector/dashboard', icon: LayoutDashboard },
        { name: 'Site Visits', href: '/inspector/visits', icon: ClipboardList },
        { name: 'Inspections', href: '/inspector/inspections', icon: ClipboardCheck },
        { name: 'Toolbox Talks', href: '/inspector/toolbox-talks', icon: HardHat },
        { name: 'Attendance', href: '/inspector/attendance', icon: CalendarCheck },
        { name: 'Incidents', href: '/inspector/incidents', icon: Siren },
        { name: 'Projects', href: '/inspector/projects', icon: Building2 },
        { name: 'Subcontractors', href: '/inspector/subcon-companies', icon: Users },
        { name: 'My Profile', href: '/profile', icon: Settings },
    ];

    const isActive = (href) => path === href || path.startsWith(href + '/');

    const handleLogout = (e) => {
        e?.preventDefault();
        confirmLogout();
    };

    useEffect(() => {
        setDrawerOpen(false);
    }, [url]);

    const initial = (authUser?.name || 'I').charAt(0).toUpperCase();

    return (
        <div className="inspector-app min-h-[100dvh] bg-gray-100 lg:flex">
            {/* ───────── Desktop sidebar ───────── */}
            <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 bg-ink-900 border-r border-black/30">
                <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10">
                    <img src="/images/logo.png" alt="Safety Buddy" className="h-10 w-10 rounded-full ring-2 ring-brand-500" />
                    <div className="leading-tight">
                        <p className="text-base font-extrabold text-white">Safety Buddy</p>
                        <p className="text-[10px] font-semibold tracking-wider text-brand-400 uppercase">Inspector Portal</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto sb-scroll">
                    {sidebarNav.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all border-l-4 ${
                                    active
                                        ? 'bg-brand-500 text-ink-900 font-bold border-brand-300'
                                        : 'text-gray-300 hover:bg-white/5 hover:text-white border-transparent'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 ${active ? 'text-ink-900' : 'text-brand-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 p-2 bg-white/5 rounded-2xl">
                        <div className="h-10 w-10 rounded-xl bg-brand-500 flex items-center justify-center text-ink-900 font-bold">
                            {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{authUser?.name}</p>
                            <p className="text-[10px] text-ink-300 uppercase tracking-widest">Inspector</p>
                        </div>
                        <button onClick={handleLogout} className="p-2 text-ink-300 hover:text-red-400 transition-colors" aria-label="Logout">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ───────── Mobile drawer (same menu as the sidebar) ───────── */}
            <div className={`lg:hidden fixed inset-0 z-[60] ${drawerOpen ? '' : 'pointer-events-none'}`} aria-hidden={!drawerOpen}>
                <div
                    className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setDrawerOpen(false)}
                />
                <aside
                    className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-ink-900 shadow-2xl transition-transform duration-200 ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
                    style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4">
                        <img src="/images/logo.png" alt="Safety Buddy" className="h-10 w-10 rounded-full ring-2 ring-brand-500" />
                        <div className="min-w-0 flex-1 leading-tight">
                            <p className="text-base font-extrabold text-white">Safety Buddy</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">Inspector Portal</p>
                        </div>
                        <button onClick={() => setDrawerOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 active:bg-white/10" aria-label="Close menu">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="px-3 pt-4">
                        <Link
                            href="/inspector/visits/create"
                            className="flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-3.5 text-sm font-extrabold text-ink-900 active:scale-95 transition"
                        >
                            <Plus className="h-5 w-5" strokeWidth={3} /> New site visit
                        </Link>
                    </div>

                    <nav className="sb-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
                        {sidebarNav.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-xl border-l-4 px-4 py-3.5 text-[15px] transition-all ${
                                        active
                                            ? 'border-brand-300 bg-brand-500 font-bold text-ink-900'
                                            : 'border-transparent text-gray-300 active:bg-white/5'
                                    }`}
                                >
                                    <item.icon className={`h-5 w-5 ${active ? 'text-ink-900' : 'text-brand-400'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="shrink-0 border-t border-white/10 p-4">
                        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-bold text-ink-900">{initial}</div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-white">{authUser?.name}</p>
                                <p className="truncate text-[10px] uppercase tracking-widest text-ink-300">{authUser?.email || 'Inspector'}</p>
                            </div>
                            <button onClick={handleLogout} className="p-2 text-ink-300 active:text-red-400" aria-label="Logout">
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {/* ───────── Content column ───────── */}
            <div className="flex-1 min-w-0 lg:pl-72 flex flex-col">
                {/* App bar (phones / tablets) */}
                <header
                    className="lg:hidden sticky top-0 z-40 bg-ink-900 text-white border-b-2 border-brand-500"
                    style={{ paddingTop: 'env(safe-area-inset-top)' }}
                >
                    <div className="h-14 px-2 flex items-center gap-1">
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="h-10 w-10 flex shrink-0 items-center justify-center rounded-full text-brand-400 active:bg-white/10"
                            aria-label="Open menu"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        {!isTopLevel && (
                            <button
                                onClick={() => window.history.back()}
                                className="h-10 w-10 flex shrink-0 items-center justify-center rounded-full text-brand-400 active:bg-white/10"
                                aria-label="Back"
                            >
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                        )}

                        <div className="flex-1 min-w-0">
                            <h1 className="text-base font-bold leading-tight truncate">{title}</h1>
                            {isTopLevel && (
                                <p className="text-[10px] font-semibold tracking-wider text-brand-400 uppercase leading-none">
                                    Safety Buddy
                                </p>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1">{children}</main>
            </div>

            <Toast />
        </div>
    );
}
