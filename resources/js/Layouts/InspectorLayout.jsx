// resources/js/Layouts/InspectorLayout.jsx
// Mobile-app style shell for the Inspector portal on every screen size:
//  - dark app bar on top (back button on inner pages)
//  - bottom tab bar on the main pages, with a centre button to start a site visit
//    and a "More" sheet for the less used pages
import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Toast from '@/Components/Toast';
import {
    LayoutDashboard,
    Settings,
    LogOut,
    Building2,
    Users,
    ChevronLeft,
    Plus,
    ClipboardList,
    MoreHorizontal,
    X,
    CalendarCheck,
    Siren,
} from 'lucide-react';
import { confirmLogout } from '@/Helpers/logout';

const TITLES = [
    ['/inspector/incidents/create', 'Report Incident'],
    ['/inspector/visits/create', 'Site Visit'],
    ['/inspector/visits', 'Site Visits'],
    ['/inspector/incidents', 'Incidents'],
    ['/inspector/attendance', 'Attendance'],
    ['/inspector/inspections/create', 'New Inspection'],
    ['/inspector/inspections', 'Inspection'],
    ['/inspector/toolbox-talks/create', 'New Toolbox Talk'],
    ['/inspector/toolbox-talks', 'Toolbox Talk'],
    ['/inspector/projects', 'Projects'],
    ['/inspector/subcon-companies', 'Subcontractors'],
    ['/inspector/reports', 'Reports'],
    ['/profile', 'My Profile'],
    ['/inspector/dashboard', 'Dashboard'],
];

// pages that show the bottom tab bar instead of a back button
const TOP_LEVEL = ['/inspector/dashboard', '/inspector/visits', '/inspector/attendance', '/inspector/incidents', '/profile', '/inspector/projects', '/inspector/subcon-companies', '/inspector/reports'];

const TABS = [
    { name: 'Home', href: '/inspector/dashboard', icon: LayoutDashboard },
    { name: 'Site Visits', href: '/inspector/visits', icon: ClipboardList },
    null, // centre button: new site visit
    { name: 'Incidents', href: '/inspector/incidents', icon: Siren },
];

const MORE = [
    { name: 'Attendance', href: '/inspector/attendance', icon: CalendarCheck },
    { name: 'Projects', href: '/inspector/projects', icon: Building2 },
    { name: 'Subcontractors', href: '/inspector/subcon-companies', icon: Users },
    { name: 'My Profile', href: '/profile', icon: Settings },
];

export default function InspectorLayout({ children, user }) {
    const { url, props } = usePage();
    const authUser = user || props?.auth?.user;
    const path = url.split('?')[0];
    const [moreOpen, setMoreOpen] = useState(false);

    const title = (TITLES.find(([p]) => path === p || path.startsWith(p + '/')) || [null, 'Inspector'])[1];
    const isTopLevel = TOP_LEVEL.includes(path);

    const isActive = (href) => path === href || path.startsWith(href + '/');
    const moreActive = MORE.some((m) => isActive(m.href));

    const handleLogout = (e) => {
        e?.preventDefault();
        setMoreOpen(false);
        confirmLogout();
    };

    useEffect(() => {
        setMoreOpen(false);
    }, [url]);

    const initial = (authUser?.name || 'I').charAt(0).toUpperCase();

    return (
        <div className="inspector-app min-h-[100dvh] bg-gray-100 flex flex-col">
            {/* App bar */}
            <header
                className="sticky top-0 z-40 bg-ink-900 text-white border-b-2 border-brand-500"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-2 sm:px-4">
                    {isTopLevel ? (
                        <img src="/images/logo.png" alt="Safety Buddy" className="ml-1 h-9 w-9 shrink-0 rounded-full ring-2 ring-brand-500" />
                    ) : (
                        <button
                            onClick={() => window.history.back()}
                            className="h-10 w-10 flex shrink-0 items-center justify-center rounded-full text-brand-400 hover:bg-white/5 active:bg-white/10"
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

                    <Link
                        href="/profile"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-ink-900"
                        aria-label="My profile"
                    >
                        {initial}
                    </Link>
                </div>
            </header>

            <main className={`flex-1 ${isTopLevel ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]' : ''}`}>{children}</main>

            {/* Bottom tab bar */}
            {isTopLevel && (
                <nav
                    className="fixed inset-x-0 bottom-0 z-50 border-t border-black/30 bg-ink-900"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                    <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
                        {TABS.map((item) =>
                            item ? (
                                <TabLink key={item.href} item={item} active={isActive(item.href)} />
                            ) : (
                                <div key="new" className="flex items-start justify-center">
                                    <Link
                                        href="/inspector/visits/create"
                                        className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-ink-900 shadow-lg ring-4 ring-gray-100 transition active:scale-95"
                                        aria-label="New site visit"
                                    >
                                        <Plus className="h-7 w-7" strokeWidth={3} />
                                    </Link>
                                </div>
                            )
                        )}
                        <button
                            type="button"
                            onClick={() => setMoreOpen(true)}
                            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${moreActive ? 'text-brand-400' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <MoreHorizontal className="h-6 w-6" />
                            More
                        </button>
                    </div>
                </nav>
            )}

            {/* "More" sheet */}
            <div className={`fixed inset-0 z-[60] ${moreOpen ? '' : 'pointer-events-none'}`} aria-hidden={!moreOpen}>
                <div
                    className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${moreOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setMoreOpen(false)}
                />
                <div
                    className={`absolute inset-x-0 bottom-0 mx-auto max-w-lg rounded-t-3xl bg-ink-900 shadow-2xl transition-transform duration-200 ${moreOpen ? 'translate-y-0' : 'translate-y-full'}`}
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-bold text-ink-900">{initial}</div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-white">{authUser?.name}</p>
                            <p className="truncate text-[10px] uppercase tracking-widest text-ink-300">{authUser?.email || 'Inspector'}</p>
                        </div>
                        <button onClick={() => setMoreOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 active:bg-white/10" aria-label="Close">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <nav className="grid grid-cols-4 gap-2 px-4 py-5">
                        {MORE.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col items-center gap-2 rounded-2xl px-1 py-3 text-center text-[11px] font-semibold transition ${
                                        active ? 'bg-brand-500 text-ink-900' : 'text-gray-300 hover:bg-white/5 active:bg-white/5'
                                    }`}
                                >
                                    <item.icon className={`h-6 w-6 ${active ? 'text-ink-900' : 'text-brand-400'}`} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="border-t border-white/10 p-4">
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white/5 py-3 text-sm font-bold text-red-400 active:bg-white/10"
                        >
                            <LogOut className="h-5 w-5" /> Logout
                        </button>
                    </div>
                </div>
            </div>

            <Toast />
        </div>
    );
}

function TabLink({ item, active }) {
    return (
        <Link
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${active ? 'text-brand-400' : 'text-gray-400 hover:text-gray-200'}`}
        >
            <item.icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
            {item.name}
        </Link>
    );
}
