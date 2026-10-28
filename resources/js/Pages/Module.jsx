import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CalendarClock, Check, ChevronDown, LockKeyhole,
    LogOut, Pencil, UserRound,
} from 'lucide-react';
import { confirmLogout } from '@/Helpers/logout';

const moduleArtwork = {
    'SB360-WSIS': { label: 'Safety', image: '/images/landing/module-wsis.jpg', path: '/dashboard' },
    'SB360-PS': { label: 'Products & Services', image: '/images/landing/module-ps.jpg' },
    'SB360-C': { label: 'Careers', image: '/images/landing/module-careers.jpg' },
    'SB360-T': { label: 'Training', image: '/images/landing/serve-toolbox.jpg' },
    'SB360-N': { label: 'News', image: '/images/landing/module-news.jpg' },
    'SB360-A': { label: 'Assist', image: '/images/landing/serve-inspection.jpg' },
};

function stateOf(module) {
    const artwork = moduleArtwork[module.code] ?? { label: module.name, image: '/images/landing/hero.jpg' };
    if (!module.is_released) return { artwork, status: 'unreleased' };
    if (module.is_available && artwork.path) return { artwork, status: 'active' };
    if (module.has_subscribed_before) return { artwork, status: 'expired' };
    return { artwork, status: 'locked' };
}

function AccountMenu({ user, company }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);
    const displayName = company?.name || user?.name || 'Account';

    useEffect(() => {
        const closeOutside = event => { if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false); };
        const closeEscape = event => { if (event.key === 'Escape') setOpen(false); };
        document.addEventListener('pointerdown', closeOutside);
        document.addEventListener('keydown', closeEscape);
        return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeEscape); };
    }, []);

    return <div className="relative" ref={menuRef}>
        <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-label="Account menu" className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2 py-1.5 text-white transition hover:border-white/40 hover:bg-white/10">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-400 text-xs font-black text-ink-950">{displayName.trim().charAt(0).toUpperCase()}</span>
            <span className="hidden max-w-[130px] truncate text-sm font-semibold sm:block">{displayName}</span>
            <ChevronDown className={`h-4 w-4 text-white/60 transition ${open ? 'rotate-180' : ''}`}/>
        </button>
        {open && <div className="absolute right-0 z-30 mt-3 w-64 rounded-2xl border border-white/15 bg-[#1E1B1D] p-2 text-white shadow-2xl">
            <div className="border-b border-white/10 px-3 py-3"><p className="truncate text-sm font-bold">{displayName}</p><p className="truncate text-xs text-white/50">{user?.email}</p></div>
            <Link href="/profile" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"><UserRound className="h-4 w-4"/> {company ? 'Profile & company' : 'Profile'}</Link>
            <Link href="/plans" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/80 hover:bg-white/10 hover:text-white"><Pencil className="h-4 w-4"/> Manage packages</Link>
            <button type="button" onClick={() => confirmLogout()} className="mt-1 flex w-full items-center gap-3 border-t border-white/10 px-3 py-3 text-left text-sm text-rose-300 hover:bg-white/10"><LogOut className="h-4 w-4"/> Log out</button>
        </div>}
    </div>;
}

function ModuleTile({ module }) {
    const { artwork, status } = stateOf(module);
    const active = status === 'active';
    const unreleased = status === 'unreleased';
    const statusText = { active: 'Active', unreleased: 'Coming soon', expired: 'Expired', locked: 'Locked' }[status];
    const StatusIcon = { active: Check, unreleased: LockKeyhole, expired: CalendarClock, locked: LockKeyhole }[status];

    const onSelect = () => {
        if (active) return router.visit(artwork.path);
        return router.visit('/plans');
    };

    return <button type="button" onClick={onSelect} disabled={unreleased} aria-label={`${artwork.label}: ${statusText}`} className={`group flex min-w-0 flex-col items-center text-center focus:outline-none ${unreleased ? 'cursor-not-allowed' : ''}`}>
        <span className={`relative block aspect-square w-full overflow-hidden rounded-2xl border-[3px] bg-ink-800 shadow-[0_18px_45px_rgba(0,0,0,0.25)] transition duration-300 ${unreleased ? '' : 'group-hover:-translate-y-2 group-hover:border-brand-400 group-hover:shadow-[0_25px_55px_rgba(0,0,0,0.4)] group-focus-visible:border-brand-400'} ${active ? 'border-white/25' : unreleased ? 'border-white/5' : 'border-white/10'}`}>
            <img src={artwork.image} alt="" className={`h-full w-full object-cover transition duration-500 ${unreleased ? 'grayscale blur-[2px] brightness-[0.48]' : `group-hover:scale-110 ${status === 'locked' || status === 'expired' ? 'brightness-75' : ''}`}`}/>
            <span className={`absolute inset-0 ${unreleased ? 'bg-slate-950/40' : 'bg-gradient-to-t from-black/60 via-transparent to-transparent'}`}/>
            {unreleased && <span className="absolute inset-0 flex items-center justify-center"><span className="rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/85 backdrop-blur-sm">Coming soon</span></span>}
            <span className={`absolute bottom-3 left-3 flex h-7 w-7 items-center justify-center rounded-lg backdrop-blur-sm ${active ? 'bg-emerald-500 text-white' : 'bg-black/55 text-white'}`}><StatusIcon className="h-4 w-4" strokeWidth={2.5}/></span>
        </span>
        <span className={`mt-5 flex h-12 items-center justify-center text-lg font-bold leading-tight sm:text-xl ${unreleased ? 'text-white/35' : 'text-white/65 transition group-hover:text-white group-focus-visible:text-white'}`}>{artwork.label}</span>
        <span className={`mt-1 text-xs font-semibold ${active ? 'text-brand-300' : 'text-white/40'}`}>{statusText}</span>
    </button>;
}

export default function Module() {
    const { modules = [], auth } = usePage().props;
    const user = auth?.user;
    const company = user?.company ?? null;

    return <><Head title="Choose a module · Safety Buddy"/><div className="relative flex min-h-screen flex-col overflow-hidden bg-[#160F11] text-white" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 19%, #421B20 0%, #241114 45%, #120E11 100%)' }}>
        <header className="relative z-10 flex items-start justify-between gap-4 px-5 pt-6 sm:px-10 sm:pt-9 lg:px-16">
            <Link href="/module" className="flex items-center gap-3">
                <img src="/images/sbc-logo.png" alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-400/50 sm:h-14 sm:w-14"/>
                <span className="hidden text-xl font-black tracking-tight text-brand-400 sm:block">SAFETY BUDDY</span>
            </Link>
            <p className="absolute left-1/2 top-10 hidden -translate-x-1/2 text-sm font-medium tracking-wide text-white/60 lg:block">Control. Performance. Report.</p>
            <AccountMenu user={user} company={company}/>
        </header>

        <main className="relative z-0 mx-auto flex w-full max-w-[1390px] flex-1 flex-col items-center justify-center px-5 pb-16 pt-16 text-center sm:px-10 sm:pb-20 lg:pt-10">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-brand-400">Your workspace</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Choose a module</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/55 sm:text-base">Safety is available now. Other modules are shown as a preview and will open in the future.</p>

            {modules.length ? <div className="mt-12 grid w-full max-w-[1280px] grid-cols-2 gap-x-5 gap-y-11 sm:grid-cols-3 sm:gap-x-7 lg:grid-cols-6 lg:gap-x-6 xl:gap-x-8">
                {modules.map(module => <ModuleTile key={module.id} module={module}/>)}
            </div> : <p className="mt-12 rounded-xl border border-white/15 px-6 py-5 text-white/60">No modules are available yet.</p>}

            <Link href="/plans" className="mt-16 inline-flex items-center justify-center gap-3 rounded-full border border-white/35 bg-black/25 px-6 py-3 text-sm font-bold text-white transition hover:border-brand-400 hover:bg-brand-400 hover:text-ink-950 sm:text-base"><Pencil className="h-5 w-5"/> Manage Packages</Link>
        </main>
    </div></>;
}
