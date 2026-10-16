// Shell for the Supervisor / Manager review portal, mobile-app style on every screen size:
//  - dark app bar on top (back button on inner pages)
//  - bottom tab bar on the main pages, with a "More" sheet for the less used pages
import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Toast from '@/Components/Toast';
import { confirmLogout } from '@/Helpers/logout';
import {
    LayoutDashboard, ClipboardCheck, AlertTriangle, LogOut, Settings, Siren, BarChart3, X, Users, ChevronLeft, MoreHorizontal,
} from 'lucide-react';

const TABS = [
    { name: 'Home', href: '/review/dashboard', icon: LayoutDashboard },
    { name: 'Site visits', href: '/review/visits', icon: ClipboardCheck },
    { name: 'NC / CC', href: '/review/cases', icon: AlertTriangle },
    { name: 'Incidents', href: '/review/incidents', icon: Siren },
];

const MORE = [
    { name: 'Reports', href: '/review/reports', icon: BarChart3 },
    { name: 'Subcontractors', href: '/review/subcons', icon: Users },
    { name: 'My profile', href: '/profile', icon: Settings },
];

// pages that show the bottom tab bar instead of a back button
const TOP_LEVEL = ['/review/dashboard', '/review/visits', '/review/cases', '/review/incidents', '/review/reports', '/review/subcons', '/review/performance', '/review/inspections', '/review/toolbox', '/profile'];

export default function ReviewLayout({ title = 'Review', children }) {
    const { url, props } = usePage();
    const user = props?.auth?.user;
    const path = url.split('?')[0];
    const roleName = Number(user?.role_id) === 3 ? 'Manager' : 'Supervisor';
    const initial = (user?.name || 'U').charAt(0).toUpperCase();
    const [moreOpen, setMoreOpen] = useState(false);

    const isTopLevel = TOP_LEVEL.includes(path);
    const isActive = (href) => path === href || path.startsWith(href + '/');
    const moreActive = MORE.some((m) => isActive(m.href));

    useEffect(() => setMoreOpen(false), [url]);

    return (
        <div className="inspector-app min-h-[100dvh] bg-gray-100 flex flex-col">
            {/* App bar */}
            <header className="sticky top-0 z-40 border-b-2 border-brand-500 bg-ink-900 text-white" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-2 sm:px-4">
                    {isTopLevel ? (
                        <img src="/images/logo.png" alt="Safety Buddy" className="ml-1 h-9 w-9 shrink-0 rounded-full ring-2 ring-brand-500" />
                    ) : (
                        <button
                            onClick={() => window.history.back()}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-400 hover:bg-white/5 active:bg-white/10"
                            aria-label="Back"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </button>
                    )}
                    <div className="min-w-0 flex-1">
                        <h1 className="truncate text-base font-bold leading-tight">{title}</h1>
                        <p className="text-[10px] font-semibold uppercase leading-none tracking-wider text-brand-400">{roleName}</p>
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

            <main className={`min-w-0 flex-1 overflow-x-hidden ${isTopLevel ? 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]' : ''}`}>{children}</main>

            {/* Bottom tab bar */}
            {isTopLevel && (
                <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-black/30 bg-ink-900" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    <div className="mx-auto grid h-16 max-w-lg grid-cols-5">
                        {TABS.map((item) => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition ${active ? 'text-brand-400' : 'text-gray-400 hover:text-gray-200'}`}
                                >
                                    <item.icon className="h-6 w-6" strokeWidth={active ? 2.5 : 2} />
                                    {item.name}
                                </Link>
                            );
                        })}
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
                <div className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${moreOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMoreOpen(false)} />
                <div
                    className={`absolute inset-x-0 bottom-0 mx-auto max-w-lg rounded-t-3xl bg-ink-900 shadow-2xl transition-transform duration-200 ${moreOpen ? 'translate-y-0' : 'translate-y-full'}`}
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                    <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-bold text-ink-900">{initial}</div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-white">{user?.name}</p>
                            <p className="truncate text-[10px] uppercase tracking-widest text-ink-300">{roleName}</p>
                        </div>
                        <button onClick={() => setMoreOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 active:bg-white/10" aria-label="Close">
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <nav className="grid grid-cols-3 gap-2 px-4 py-5">
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
                            onClick={() => { setMoreOpen(false); confirmLogout(); }}
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
