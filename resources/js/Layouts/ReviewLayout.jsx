// Shell for the Supervisor / Manager review portal.
//  - phones / tablets: top bar with a menu button; the menu opens as a sidebar drawer
//  - desktop (lg+): sidebar always visible
import React, { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import Toast from '@/Components/Toast';
import { confirmLogout } from '@/Helpers/logout';
import {
    LayoutDashboard, ClipboardCheck, AlertTriangle, LogOut, Settings, Siren, BarChart3, Menu, X,
} from 'lucide-react';

const NAV = [
    { name: 'Home', href: '/review/dashboard', icon: LayoutDashboard },
    { name: 'Site visits', href: '/review/visits', icon: ClipboardCheck },
    { name: 'Incidents', href: '/review/incidents', icon: Siren },
    { name: 'NC / CC cases', href: '/review/cases', icon: AlertTriangle },
    { name: 'Reports', href: '/review/reports', icon: BarChart3 },
    { name: 'My profile', href: '/profile', icon: Settings },
];

function NavList({ path, large = false }) {
    const active = (href) => path === href || path.startsWith(href + '/');

    return NAV.map((n) => (
        <Link
            key={n.name}
            href={n.href}
            className={`flex items-center gap-3 rounded-xl border-l-4 px-4 ${large ? 'py-3.5 text-[15px]' : 'py-3 text-sm'} transition-all ${
                active(n.href) ? 'border-brand-300 bg-brand-500 font-bold text-ink-900' : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'
            }`}
        >
            <n.icon className={`h-5 w-5 ${active(n.href) ? 'text-ink-900' : 'text-brand-400'}`} />
            {n.name}
        </Link>
    ));
}

export default function ReviewLayout({ title = 'Review', children }) {
    const { url, props } = usePage();
    const user = props?.auth?.user;
    const path = url.split('?')[0];
    const roleName = Number(user?.role_id) === 3 ? 'Manager' : 'Supervisor';
    const initial = (user?.name || 'U').charAt(0).toUpperCase();
    const [drawer, setDrawer] = useState(false);

    useEffect(() => setDrawer(false), [url]);

    const account = (
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-bold text-ink-900">{initial}</div>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{user?.name}</p>
                <p className="truncate text-[10px] uppercase tracking-widest text-ink-300">{roleName}</p>
            </div>
            <button onClick={() => confirmLogout()} className="p-2 text-ink-300 hover:text-red-400" aria-label="Logout">
                <LogOut className="h-5 w-5" />
            </button>
        </div>
    );

    return (
        <div className="inspector-app min-h-[100dvh] bg-gray-100 lg:flex">
            {/* desktop sidebar */}
            <aside className="hidden border-r border-black/30 bg-ink-900 lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
                <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
                    <img src="/images/logo.png" alt="Safety Buddy" className="h-10 w-10 rounded-full ring-2 ring-brand-500" />
                    <div className="leading-tight">
                        <p className="text-base font-extrabold text-white">Safety Buddy</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">{roleName} Portal</p>
                    </div>
                </div>
                <nav className="sb-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4"><NavList path={path} /></nav>
                <div className="border-t border-white/10 p-4">{account}</div>
            </aside>

            {/* mobile drawer */}
            <div className={`fixed inset-0 z-[60] lg:hidden ${drawer ? '' : 'pointer-events-none'}`} aria-hidden={!drawer}>
                <div className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${drawer ? 'opacity-100' : 'opacity-0'}`} onClick={() => setDrawer(false)} />
                <aside
                    className={`absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-ink-900 shadow-2xl transition-transform duration-200 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}
                    style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                    <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4">
                        <img src="/images/logo.png" alt="Safety Buddy" className="h-10 w-10 rounded-full ring-2 ring-brand-500" />
                        <div className="min-w-0 flex-1 leading-tight">
                            <p className="text-base font-extrabold text-white">Safety Buddy</p>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-400">{roleName} Portal</p>
                        </div>
                        <button onClick={() => setDrawer(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-300 active:bg-white/10" aria-label="Close menu">
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className="sb-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4"><NavList path={path} large /></nav>
                    <div className="shrink-0 border-t border-white/10 p-4">{account}</div>
                </aside>
            </div>

            <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
                <header className="sticky top-0 z-40 border-b-2 border-brand-500 bg-ink-900 text-white lg:hidden" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                    <div className="flex h-14 items-center gap-1 px-2">
                        <button onClick={() => setDrawer(true)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-brand-400 active:bg-white/10" aria-label="Open menu">
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="min-w-0 flex-1 pl-1">
                            <h1 className="truncate text-base font-bold leading-tight">{title}</h1>
                            <p className="text-[10px] font-semibold uppercase leading-none tracking-wider text-brand-400">{roleName}</p>
                        </div>
                    </div>
                </header>
                <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
            </div>

            <Toast />
        </div>
    );
}
