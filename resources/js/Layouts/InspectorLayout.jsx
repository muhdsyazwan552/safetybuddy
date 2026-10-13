// resources/js/Layouts/InspectorLayout.jsx
// Mobile-app style shell for the Inspector portal:
//  - phones/tablets: dark app bar on top + docked bottom tab bar with a centre "+" action
//  - desktop (lg+): dark sidebar, same content
import React, { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';

const TITLES = [
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
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    const title = (TITLES.find(([p]) => path === p || path.startsWith(p + '/')) || [null, 'Inspector'])[1];
    const isTopLevel = ['/inspector/dashboard', '/inspector/inspections', '/inspector/toolbox-talks', '/profile', '/inspector/projects', '/inspector/subcon-companies', '/inspector/reports'].includes(path);

    // Tabs on the phone bottom bar (the centre slot is the "+" action)
    const tabsLeft = [
        { name: 'Home', href: '/inspector/dashboard', icon: LayoutDashboard },
        { name: 'Inspect', href: '/inspector/inspections', icon: ClipboardCheck },
    ];
    const tabsRight = [
        { name: 'Talks', href: '/inspector/toolbox-talks', icon: HardHat },
        { name: 'Projects', href: '/inspector/projects', icon: Building2 },
    ];

    const sidebarNav = [
        { name: 'Dashboard', href: '/inspector/dashboard', icon: LayoutDashboard },
        { name: 'Inspections', href: '/inspector/inspections', icon: ClipboardCheck },
        { name: 'Toolbox Talks', href: '/inspector/toolbox-talks', icon: HardHat },
        { name: 'Projects', href: '/inspector/projects', icon: Building2 },
        { name: 'Subcontractors', href: '/inspector/subcon-companies', icon: Users },
        { name: 'My Profile', href: '/profile', icon: Settings },
    ];

    const isActive = (href) => path === href || path.startsWith(href + '/');

    const handleLogout = (e) => {
        e?.preventDefault();
        router.post('/logout');
    };

    useEffect(() => {
        setMenuOpen(false);
    }, [url]);

    useEffect(() => {
        const close = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', close);
        document.addEventListener('touchstart', close);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('touchstart', close);
        };
    }, []);

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

            {/* ───────── Content column ───────── */}
            <div className="flex-1 min-w-0 lg:pl-72 flex flex-col">
                {/* App bar (phones / tablets) */}
                <header
                    className="lg:hidden sticky top-0 z-40 bg-ink-900 text-white border-b-2 border-brand-500"
                    style={{ paddingTop: 'env(safe-area-inset-top)' }}
                >
                    <div className="h-14 px-3 flex items-center gap-2">
                        {isTopLevel ? (
                            <img src="/images/logo.png" alt="Safety Buddy" className="h-9 w-9 rounded-full ring-2 ring-brand-500 shrink-0" />
                        ) : (
                            <button
                                onClick={() => window.history.back()}
                                className="h-9 w-9 -ml-1 flex items-center justify-center rounded-full text-brand-400 active:bg-white/10"
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

                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen((o) => !o)}
                                className="h-9 w-9 rounded-full bg-brand-500 text-ink-900 text-sm font-bold flex items-center justify-center active:scale-95 transition"
                                aria-label="Account"
                            >
                                {initial}
                            </button>
                            {menuOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                                    <div className="px-4 py-3 bg-gray-50 border-b">
                                        <p className="text-sm font-bold truncate">{authUser?.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{authUser?.email || 'Inspector'}</p>
                                    </div>
                                    <Link href="/profile" className="flex items-center gap-2 px-4 py-3 text-sm hover:bg-gray-50">
                                        <Settings className="w-4 h-4 text-gray-500" /> My Profile
                                    </Link>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 border-t">
                                        <LogOut className="w-4 h-4" /> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page content – leave room for the bottom tab bar on phones */}
                <main className="flex-1 pb-28 lg:pb-0">{children}</main>
            </div>

            <Toast />

            {/* ───────── Bottom tab bar (phones / tablets) ───────── */}
            <nav
                className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-ink-900 border-t border-white/10 shadow-[0_-6px_20px_rgba(0,0,0,0.25)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="relative grid grid-cols-5 items-end h-16 max-w-xl mx-auto">
                    {tabsLeft.map((t) => (
                        <Tab key={t.name} tab={t} active={isActive(t.href)} />
                    ))}

                    {/* centre action */}
                    <div className="flex justify-center">
                        <Link
                            href="/inspector/inspections/create"
                            className="-mt-6 h-14 w-14 rounded-full bg-brand-500 text-ink-900 flex items-center justify-center shadow-lg shadow-black/40 ring-4 ring-ink-900 active:scale-95 transition"
                            aria-label="New inspection"
                        >
                            <Plus className="w-7 h-7" strokeWidth={3} />
                        </Link>
                    </div>

                    {tabsRight.map((t) => (
                        <Tab key={t.name} tab={t} active={isActive(t.href)} />
                    ))}
                </div>
            </nav>
        </div>
    );
}

function Tab({ tab, active }) {
    return (
        <Link
            href={tab.href}
            className="flex flex-col items-center justify-center h-full gap-1 active:bg-white/5 transition-colors"
        >
            <span className={`flex items-center justify-center h-7 w-12 rounded-full transition-colors ${active ? 'bg-brand-500/20' : ''}`}>
                <tab.icon className={`w-5 h-5 ${active ? 'text-brand-400' : 'text-ink-300'}`} />
            </span>
            <span className={`text-[10px] leading-none font-semibold ${active ? 'text-brand-400' : 'text-ink-300'}`}>
                {tab.name}
            </span>
        </Link>
    );
}
