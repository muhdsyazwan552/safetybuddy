import React, { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Menu, X } from 'lucide-react';

// hash links point at sections of the landing page, so on any other page they need the "/" in front
const NAV = [
    { label: 'Home', href: '#top' },
    { label: 'Training Provider', href: '/training-providers' },
    { label: 'Modules', href: '#modules' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Contact', href: '#contact' },
];

/** Header shared by the landing page and the public Training Provider directory. */
export default function PublicNavbar({ onLanding = false, current = null }) {
    const [menu, setMenu] = useState(false);
    const [stuck, setStuck] = useState(false);

    useEffect(() => {
        const on = () => setStuck(window.scrollY > 40);
        on();
        window.addEventListener('scroll', on, { passive: true });
        return () => window.removeEventListener('scroll', on);
    }, []);

    const link = (href) => (href.startsWith('#') && !onLanding ? `/${href}` : href);
    const linkClass = (item) => `relative transition hover:text-brand-700 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:bg-brand-500 after:transition-all hover:after:w-full ${current === item.label ? 'after:w-full' : 'after:w-0'}`;

    return (
        <header className={`sticky top-0 z-40 transition ${stuck ? 'bg-white/85 shadow-sm backdrop-blur-md' : 'bg-white'}`}>
            <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 sm:px-8">
                <a href={onLanding ? '#top' : '/'} className="flex shrink-0 items-center" aria-label="Safety Buddy home">
                    <img src="/images/sbc-header.png" alt="Safety Buddy – Cmeri" className="h-14 w-auto max-w-[180px] object-contain" />
                </a>

                <nav className="hidden items-center gap-8 text-[15px] font-medium text-ink-900 lg:flex">
                    {NAV.map((n) => <a key={n.label} href={link(n.href)} className={linkClass(n)}>{n.label}</a>)}
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                    <Link href="/login" className="rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-gray-100">Sign in</Link>
                    <Link href="/register-view" className="group flex items-center gap-2.5 rounded-full bg-gray-100 py-2 pl-2 pr-5 text-sm font-semibold transition hover:bg-gray-200">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-brand-400 transition group-hover:rotate-45"><ArrowUpRight className="h-4 w-4" /></span>
                        Get started
                    </Link>
                </div>

                <button onClick={() => setMenu(!menu)} className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 lg:hidden" aria-label="Menu">
                    {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            <AnimatePresence>
                {menu && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100 bg-white lg:hidden">
                        <div className="space-y-1 px-5 py-4">
                            {NAV.map((n) => <a key={n.label} href={link(n.href)} onClick={() => setMenu(false)} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-gray-50">{n.label}</a>)}
                            <div className="flex gap-2 pt-3">
                                <Link href="/login" className="flex-1 rounded-full border border-gray-200 py-3 text-center text-sm font-semibold">Sign in</Link>
                                <Link href="/register-view" className="flex-1 rounded-full bg-brand-500 py-3 text-center text-sm font-semibold text-ink-900">Get started</Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
