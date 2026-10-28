import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AnimatePresence, motion, useInView, useScroll, useTransform } from 'framer-motion';
import {
    ArrowUpRight, ArrowRight, Phone, Menu, X, ChevronDown, Check, Play, Quote, Star, ShieldCheck, ClipboardCheck,
    HardHat, AlertTriangle, MessageSquareWarning, BarChart3, Clock3, Users, Handshake, FileText, Smartphone,
    BadgeCheck, Gauge, Building2, Briefcase, GraduationCap, Newspaper, LifeBuoy, MapPin, Mail, Plus, Minus,
    CalendarDays, Sparkles, HardDrive,
} from 'lucide-react';

/* ──────────────────────────────────────────────────────────────
   Content (edit freely – images live in public/images/landing)
────────────────────────────────────────────────────────────── */
const CONTACT = { phone: '+60 16-886 5619', email: 'hello@safetybuddy.my', address: 'Kuala Lumpur, Malaysia' };

const NAV = [
    { label: 'About', href: '#about' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Modules', href: '#modules' },
    { label: 'Guides', href: '#guides' },
    { label: 'Contact', href: '#contact' },
];

const HERO_WORDS = ['safer', 'smarter', 'compliant', 'faster'];

const CAPABILITIES = [
    { icon: ClipboardCheck, label: 'Site inspections' },
    { icon: HardHat, label: 'Toolbox talks' },
    { icon: AlertTriangle, label: 'Non-conformance' },
    { icon: MessageSquareWarning, label: 'Client complaints' },
    { icon: BarChart3, label: 'Incident statistics' },
    { icon: Clock3, label: 'Man-hour tracking' },
    { icon: Gauge, label: 'Compliance metrics' },
    { icon: FileText, label: 'Daily & monthly reports' },
    { icon: Handshake, label: 'Subcontractor staff' },
];

const SERVICE_CHIPS = [
    { icon: ClipboardCheck, title: 'Site Inspections', sub: 'Fast. Photo-backed. Traceable.' },
    { icon: HardHat, title: 'Toolbox Talks', sub: 'Daily. Recorded. Signed off.' },
    { icon: AlertTriangle, title: 'Non-Conformance', sub: 'Raised. Tracked. Closed.' },
    { icon: BarChart3, title: 'Incident Statistics', sub: 'Clear. Monthly. Comparable.' },
    { icon: Clock3, title: 'Man-hour Records', sub: 'Accurate. Per project.' },
    { icon: Handshake, title: 'Subcontractors', sub: 'Registered. Complete. Ready.' },
];

const VOICES = [
    { name: 'Aisyah', role: 'Site Safety Officer', img: 'voice-1.jpg' },
    { name: 'Daniel', role: 'Project Manager', img: 'voice-2.jpg' },
    { name: 'Farid', role: 'Inspector', img: 'voice-3.jpg' },
    { name: 'Mei Ling', role: 'HSE Coordinator', img: 'voice-4.jpg' },
    { name: 'Kumar', role: 'Subcontractor Leader', img: 'voice-5.jpg' },
];

const VALUES = [
    { title: 'Reliability', text: 'Every record is saved the moment it happens — nothing lost in paper piles.' },
    { title: 'Site first', text: 'Built for phones and tablets so inspectors work where the risk is.' },
    { title: 'Care & precision', text: 'Photos, locations and evaluations captured in a consistent format.' },
    { title: 'Accountability', text: 'Every finding has an owner, a status and a closing date.' },
];

const SERVE = [
    { title: 'Inspections made simple', text: 'Record findings with photos, rate compliance and raise non-conformances in seconds.', img: 'serve-inspection.jpg', icon: ClipboardCheck },
    { title: 'Toolbox talks that count', text: 'Capture topics, attendance and photos so daily briefings are proven, not assumed.', img: 'serve-toolbox.jpg', icon: HardHat },
    { title: 'Incidents under control', text: 'Monthly incident statistics, man-hours and trends to keep leadership informed.', img: 'serve-incident.jpg', icon: BarChart3 },
];

const WHY = [
    { icon: ShieldCheck, title: 'Compliance ready', text: 'Metrics and penalty settings follow your own standards.' },
    { icon: Smartphone, title: 'Mobile inspector app', text: 'A fast, app-like experience for inspectors on site.' },
    { icon: BadgeCheck, title: 'Clear accountability', text: 'Owners and statuses for every non-conformance.' },
    { icon: Users, title: 'Subcontractor friendly', text: 'Staff register themselves with a simple shared link.' },
];

const ROLES = [
    { icon: Building2, title: 'Company admin', text: 'Projects, assignments, metrics, reports and subscriptions.' },
    { icon: ClipboardCheck, title: 'Inspector', text: 'Mobile inspections, toolbox talks and follow-ups.' },
    { icon: Handshake, title: 'Subcon leader', text: 'Manage company staff records and keep them complete.' },
    { icon: Users, title: 'Subcon staff', text: 'Register in seconds — no account needed.' },
];

const REVIEWS = [
    { text: 'We stopped chasing paper checklists. Everything from the site walk is in one place the same day.', name: 'Site Safety Officer', meta: 'Construction contractor' },
    { text: 'Toolbox talk attendance with photos gave us the evidence our client audit asked for.', name: 'HSE Coordinator', meta: 'Infrastructure project' },
    { text: 'Closing non-conformances with comments keeps every subcontractor accountable.', name: 'Project Manager', meta: 'Building works' },
    { text: 'The subcontractor registration link saved hours of back-and-forth with staff lists.', name: 'Safety Admin', meta: 'Mechanical & electrical' },
    { text: 'Inspectors love that it feels like a mobile app, not a form.', name: 'Lead Inspector', meta: 'Facilities management' },
    { text: 'Monthly incident statistics are finally accurate and easy to explain to management.', name: 'Operations Director', meta: 'Engineering services' },
];

const STEPS = [
    { title: 'Create your account', text: 'Register your company, sign in and choose a Safety Buddy package.' },
    { title: 'Set up your company', text: 'Add projects, staff, subcontractors and your compliance metrics.' },
    { title: 'Assign & invite', text: 'Assign inspectors to projects and share the registration link with subcontractors.' },
    { title: 'Inspect & report', text: 'Run inspections and toolbox talks on site, then pull reports in one click.' },
];

const MODULES = [
    { code: 'SB360-WSIS', title: 'Workplace Safety Inspection System', text: 'Inspections, toolbox talks, non-conformance, incidents and reports.', icon: ShieldCheck, img: 'module-wsis.jpg' },
    { code: 'SB360-PS', title: 'Products & Services', text: 'Showcase your products and services to the community.', icon: Briefcase, img: 'module-ps.jpg' },
    { code: 'SB360-C', title: 'Careers', text: 'Post roles and find safety professionals.', icon: GraduationCap, img: 'module-careers.jpg' },
    { code: 'SB360-N', title: 'News & Assist', text: 'Industry updates and help whenever you need it.', icon: Newspaper, img: 'module-news.jpg' },
];

const GUIDES = [
    { date: 'Jun 10, 2026', read: '5 min read', title: 'A 10-minute site walk checklist', text: 'What to look at first, how to rate it and how to document it properly.', img: 'guide-1.jpg' },
    { date: 'Jun 11, 2026', read: '4 min read', title: 'Run toolbox talks people remember', text: 'Short, specific and recorded — a simple structure that works.', img: 'guide-2.jpg' },
    { date: 'Jun 11, 2026', read: '6 min read', title: 'Closing non-conformances on time', text: 'Ownership, due dates and follow-up habits that stop repeat findings.', img: 'guide-3.jpg' },
];

const FAQ = [
    { q: 'How quickly can we start?', a: 'Most companies are up and running within a day. We set up your company, projects and metrics, then you invite inspectors and subcontractors.' },
    { q: 'Do subcontractor staff need an account?', a: 'No. Each subcontractor company gets a secure link where staff register themselves. Only the company leader can edit or remove staff.' },
    { q: 'Does it work on a phone?', a: 'Yes. Inspectors get a mobile app-style experience with large touch targets, camera upload and a quick-add button.' },
    { q: 'Can we use our own compliance standards?', a: 'Yes. Compliance metrics, evaluations and penalty settings are configurable per company.' },
    { q: 'Is our data safe?', a: 'Access is role-based and every company only sees its own projects, staff and records.' },
];

/* ──────────────────────────────────────────────────────────────
   Small building blocks
────────────────────────────────────────────────────────────── */
const ease = [0.22, 1, 0.36, 1];

function Reveal({ children, delay = 0, y = 28, className = '' }) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay, ease }}
        >
            {children}
        </motion.div>
    );
}

/** Photo with a styled fallback so the page looks good before real images are added */
function Photo({ src, alt, className = '', imageClassName = '', loading = 'lazy', tone = 'dark', children }) {
    const [failed, setFailed] = useState(false);
    const bg =
        tone === 'dark'
            ? 'bg-gradient-to-br from-ink-900 via-ink-800 to-ink-600'
            : 'bg-gradient-to-br from-brand-200 via-brand-300 to-brand-500';
    return (
        <div className={`relative overflow-hidden ${bg} ${className}`}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-brand-500/30 blur-3xl" />
            {!failed && (
                <img
                    src={`/images/landing/${src}`}
                    alt={alt}
                    loading={loading}
                    onError={() => setFailed(true)}
                    className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105 ${imageClassName}`}
                />
            )}
            {children}
        </div>
    );
}

/** Pill button – white pill with a round accent arrow (like the reference) */
function PillButton({ href = '#', children, tone = 'light', onClick, className = '' }) {
    const tones = {
        light: 'bg-white text-ink-900 hover:bg-gray-100',
        glass: 'bg-white/15 text-white backdrop-blur hover:bg-white/25',
        dark: 'bg-ink-900 text-white hover:bg-ink-800',
        accent: 'bg-brand-500 text-ink-900 hover:bg-brand-400',
    };
    const Tag = href.startsWith('/') && !href.startsWith('/#') ? Link : 'a';
    return (
        <Tag
            href={href}
            onClick={onClick}
            className={`group inline-flex items-center gap-3 rounded-full py-2 pl-2 pr-5 text-sm font-semibold transition ${tones[tone]} ${className}`}
        >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-ink-900 transition group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" strokeWidth={2.5} />
            </span>
            {children}
        </Tag>
    );
}

function SectionTag({ children }) {
    return <p className="mb-3 text-base font-medium text-gray-500">{children}</p>;
}

const H2 = ({ children, className = '' }) => (
    <h2 className={`font-geist text-[34px] font-medium leading-[1.1] tracking-[-0.06em] text-ink-950 sm:text-5xl ${className}`}>{children}</h2>
);

function TypeWord({ words }) {
    const [i, setI] = useState(0);
    const [text, setText] = useState('');
    const [del, setDel] = useState(false);

    useEffect(() => {
        const word = words[i];
        const speed = del ? 55 : 110;
        const t = setTimeout(() => {
            if (!del) {
                const next = word.slice(0, text.length + 1);
                setText(next);
                if (next === word) setTimeout(() => setDel(true), 1400);
            } else {
                const next = word.slice(0, text.length - 1);
                setText(next);
                if (next === '') {
                    setDel(false);
                    setI((i + 1) % words.length);
                }
            }
        }, speed);
        return () => clearTimeout(t);
    }, [text, del, i, words]);

    return (
        <span className="text-white/55">
            {text}
            <span className="sb-caret" />
        </span>
    );
}

/** words go from grey → black as the section scrolls through the viewport */
function ScrollWords({ text, className = '' }) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] });
    const words = text.split(' ');
    return (
        <p ref={ref} className={className}>
            {words.map((w, idx) => {
                const start = idx / words.length;
                const end = start + 1 / words.length;
                // eslint-disable-next-line react-hooks/rules-of-hooks
                const opacity = useTransform(scrollYProgress, [start, end], [0.18, 1]);
                return (
                    <motion.span key={idx} style={{ opacity }} className="mr-[0.28em] inline-block">
                        {w}
                    </motion.span>
                );
            })}
        </p>
    );
}

function Counter({ to, suffix = '+', duration = 1.8 }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-80px' });
    const [n, setN] = useState(0);
    useEffect(() => {
        if (!inView) return undefined;
        let raf;
        const start = performance.now();
        const tick = (t) => {
            const p = Math.min(1, (t - start) / (duration * 1000));
            setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [inView, to, duration]);
    return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

/* ──────────────────────────────────────────────────────────────
   Page
────────────────────────────────────────────────────────────── */
export default function Landing({ subscriptionPlans = [] }) {
    const [bar, setBar] = useState(true);
    const [menu, setMenu] = useState(false);
    const [stuck, setStuck] = useState(false);
    const [faq, setFaq] = useState(0);

    useEffect(() => {
        const on = () => setStuck(window.scrollY > 40);
        on();
        window.addEventListener('scroll', on, { passive: true });
        return () => window.removeEventListener('scroll', on);
    }, []);

    const plans = useMemo(
        () => subscriptionPlans.map(plan => ({
            name: plan.name,
            tag: `${plan.manager_limit} Manager · ${plan.supervisor_limit} Supervisor · ${plan.inspector_limit} Inspector${plan.inspector_limit > 1 ? 's' : ''}`,
            price: plan.price_yearly,
            popular: plan.code === 'PROFESSIONAL',
            items: [
                plan.daily_pdf_limit === null ? 'Unlimited Daily Report PDFs' : `${plan.daily_pdf_limit} Daily Report PDFs / month (shared)`,
                plan.monthly_pdf_limit === null ? 'Unlimited Monthly Report PDFs' : `${plan.monthly_pdf_limit} Monthly Report PDFs / month (shared)`,
                'All Safety Buddy features', 'Contractor Portal', 'Unlimited projects and contractor companies',
                'Unlimited safety inspections, toolbox talks and NCR/CC transactions',
            ],
        })),
        [subscriptionPlans]
    );

    return (
        <div className="font-geist min-h-screen bg-white text-ink-950 antialiased selection:bg-brand-300">
            <Head title="Safety Buddy – Control. Performance. Report." />

            {/* announcement bar */}
            <AnimatePresence>
                {bar && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-brand-500 text-ink-900">
                        <div className="relative mx-auto flex max-w-7xl items-center justify-center px-10 py-2.5 text-center text-xs font-medium sm:text-sm">
                            <span>
                                Digitise inspections & toolbox talks for every project.{' '}
                                <Link href="/register-view" className="font-semibold underline underline-offset-2">Create your account</Link>
                            </span>
                            <button onClick={() => setBar(false)} className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900/10 hover:bg-ink-900/20" aria-label="Close">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* nav */}
            <header className={`sticky top-0 z-40 transition ${stuck ? 'bg-white/85 shadow-sm backdrop-blur-md' : 'bg-white'}`}>
                <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-4 sm:px-8">
                    <a href="#top" className="flex shrink-0 items-center" aria-label="Safety Buddy home">
                        <img src="/images/sbc-header.png" alt="Safety Buddy – Cmeri" className="h-14 w-auto max-w-[180px] object-contain" />
                    </a>

                    <nav className="hidden items-center gap-8 text-[15px] font-medium text-ink-900 lg:flex">
                        {NAV.map((n) => (
                            <a key={n.label} href={n.href} className="relative transition hover:text-brand-700 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-brand-500 after:transition-all hover:after:w-full">
                                {n.label}
                            </a>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-3 lg:flex">
                        <a href={`tel:${CONTACT.phone}`} className="flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2.5 text-sm font-medium">
                            <Phone className="h-4 w-4 text-brand-700" /> {CONTACT.phone}
                        </a>
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
                                {NAV.map((n) => (
                                    <a key={n.label} href={n.href} onClick={() => setMenu(false)} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-gray-50">{n.label}</a>
                                ))}
                                <div className="flex gap-2 pt-3">
                                    <Link href="/login" className="flex-1 rounded-full border border-gray-200 py-3 text-center text-sm font-semibold">Sign in</Link>
                                    <Link href="/register-view" className="flex-1 rounded-full bg-brand-500 py-3 text-center text-sm font-semibold text-ink-900">Get started</Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <main id="top">
                {/* HERO */}
                <section className="px-1 sm:px-1.5">
                    <Photo src="hero.jpg" alt="Safety officer reviewing site records on a tablet" loading="eager" imageClassName="object-[34%_center] sm:object-center" className="min-h-[760px] rounded-[28px] lg:min-h-[880px]">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/10 lg:bg-gradient-to-l lg:from-black/85 lg:via-black/55 lg:to-black/0" />
                        <div className="relative mx-auto flex min-h-[760px] max-w-[1400px] items-end px-5 py-14 sm:px-8 lg:min-h-[880px] lg:items-center lg:justify-end lg:py-20">
                            <div className="max-w-3xl text-white">
                                <Reveal>
                                    <div className="mb-8 flex flex-wrap items-center gap-3">
                                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs backdrop-blur">
                                            Trusted safety platform in <MapPin className="h-3.5 w-3.5" /> <b className="font-semibold">Malaysia</b>
                                        </span>
                                        <span className="inline-flex items-center gap-2 text-xs text-white/80">
                                            <Star className="h-4 w-4 fill-brand-500 text-brand-500" /> Built with safety officers, for safety officers
                                        </span>
                                    </div>
                                </Reveal>

                                <Reveal delay={0.08}>
                                    <h1 className="text-[44px] font-medium leading-[1.03] tracking-[-0.06em] sm:text-6xl lg:text-[72px]">
                                        Let’s make every<br /> site <TypeWord words={HERO_WORDS} />
                                    </h1>
                                </Reveal>

                                <Reveal delay={0.16}>
                                    <p className="mt-6 max-w-lg text-base text-white/80">
                                        Inspections, toolbox talks, non-conformances and incident statistics in one place — so your team spends less time on paperwork and more time keeping people safe.
                                    </p>
                                </Reveal>

                                <Reveal delay={0.24}>
                                    <div className="mt-8 flex flex-wrap gap-3">
                                        <PillButton href="/register-view">Get started</PillButton>
                                        <Link href="/login" className="inline-flex items-center rounded-full bg-white/15 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25">
                                            Sign in
                                        </Link>
                                    </div>
                                </Reveal>

                                <Reveal delay={0.32}>
                                    <div className="mt-14 flex flex-wrap items-center gap-6 text-white">
                                        <p className="max-w-[170px] text-xs text-white/70">Everything your site safety team needs, on every device.</p>
                                        {[
                                            { k: '6', v: 'Core modules' },
                                            { k: '4', v: 'User roles' },
                                            { k: '1', v: 'Shared platform' },
                                        ].map((s) => (
                                            <div key={s.v} className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
                                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-bold text-ink-900">{s.k}</span>
                                                <span className="text-xs text-white/80">{s.v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Reveal>
                            </div>

                        </div>
                    </Photo>
                </section>

                {/* capability marquee */}
                <section className="overflow-hidden py-10">
                    <div className="sb-marquee-wrap relative">
                        <div className="sb-marquee slow">
                            {[...CAPABILITIES, ...CAPABILITIES, ...CAPABILITIES, ...CAPABILITIES].map((c, i) => (
                                <div key={i} className="mx-8 flex shrink-0 items-center gap-2.5 text-xl font-medium text-gray-400">
                                    <c.icon className="h-6 w-6" /> {c.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* intro + service chips */}
                <section id="features" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-16 sm:px-8">
                    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                        <div>
                            <Reveal><H2>We focus on the inspection.<br />You focus on the work.</H2></Reveal>
                            <Reveal delay={0.1}>
                                <p className="mt-5 max-w-xl text-base text-gray-500">
                                    We simplify site safety management, letting you focus on what matters. Our platform gives every role the tools they need — from the site walk to the monthly report.
                                </p>
                            </Reveal>
                        </div>
                        <Reveal delay={0.15}>
                            <Link href="/register-view" className="group inline-flex items-center gap-3 text-sm font-semibold">
                                Create an account
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-white transition group-hover:rotate-45"><ArrowUpRight className="h-4 w-4" /></span>
                            </Link>
                        </Reveal>
                    </div>

                    <div className="sb-marquee-wrap -mx-5 mt-12 overflow-hidden sm:-mx-8">
                        <div className="sb-marquee">
                            {[...SERVICE_CHIPS, ...SERVICE_CHIPS].map((c, i) => (
                                <div key={i} className="mx-2 flex w-[290px] shrink-0 items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:-translate-y-1 hover:shadow-lg">
                                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100"><c.icon className="h-5 w-5" /></span>
                                    <div>
                                        <p className="text-[15px] font-medium">{c.title}</p>
                                        <p className="text-xs text-gray-500">{c.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* voices */}
                <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
                    <Reveal><H2>Safety is about people</H2></Reveal>
                    <Reveal delay={0.1}><p className="mt-4 max-w-md text-gray-500">Hear from the people who use Safety Buddy every day. Their stories prove our promise of simpler, safer sites.</p></Reveal>

                    <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
                        {VOICES.map((v, i) => (
                            <Reveal key={v.name} delay={i * 0.07}>
                                <div className="group cursor-pointer">
                                    <Photo src={v.img} alt={v.name} className="aspect-[3/4] rounded-3xl">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                        <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ink-900/70 text-white backdrop-blur transition group-hover:scale-110 group-hover:bg-brand-500 group-hover:text-ink-900">
                                            <Play className="h-5 w-5 fill-current" />
                                        </span>
                                    </Photo>
                                    <p className="mt-3 text-[15px] font-medium">{v.name}</p>
                                    <p className="text-sm text-gray-500">{v.role}</p>
                                </div>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* about with scroll-reveal text */}
                <section id="about" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-20 sm:px-8">
                    <SectionTag>Know about us</SectionTag>
                    <ScrollWords
                        text="We help contractors run safer sites with precision. Our platform combines inspections, toolbox talks and reporting so every finding has an owner and every action is on record."
                        className="max-w-5xl font-geist text-[30px] font-medium leading-[1.12] tracking-[-0.05em] sm:text-5xl"
                    />

                    <div className="mt-14 grid gap-6 lg:grid-cols-2">
                        <Reveal>
                            <Photo src="about.jpg" alt="Safety team on site" className="group aspect-[4/3] rounded-3xl" />
                        </Reveal>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {VALUES.map((v, i) => (
                                <Reveal key={v.title} delay={i * 0.08}>
                                    <div className="h-full rounded-2xl bg-gray-50 p-5 transition hover:-translate-y-1 hover:bg-gray-100">
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-ink-900">{i + 1}</span>
                                        <p className="mt-4 text-lg font-medium">{v.title}</p>
                                        <p className="mt-1 text-sm text-gray-500">{v.text}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>

                    <Reveal>
                        <figure className="mt-10 flex flex-col gap-4 rounded-3xl bg-ink-900 p-7 text-white sm:flex-row sm:items-center sm:justify-between sm:p-10">
                            <div className="flex gap-4">
                                <Quote className="h-8 w-8 shrink-0 text-brand-500" />
                                <blockquote className="text-xl font-medium leading-snug tracking-tight sm:text-2xl">
                                    “Everything from the site walk is in one place the same day — no more chasing paper.”
                                </blockquote>
                            </div>
                            <figcaption className="shrink-0 text-sm text-gray-400">
                                <b className="block text-white">Site Safety Officer</b>Construction contractor
                            </figcaption>
                        </figure>
                    </Reveal>
                </section>

                {/* what we serve */}
                <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
                    <Reveal><SectionTag>What we serve</SectionTag></Reveal>
                    <Reveal delay={0.05}><H2>Structured safety workflows</H2></Reveal>
                    <Reveal delay={0.1}><p className="mt-4 max-w-md text-gray-500">Tailored tools for the way your site actually works — from the first inspection to the final report.</p></Reveal>

                    <div className="mt-10 grid gap-5 md:grid-cols-3">
                        {SERVE.map((s, i) => (
                            <Reveal key={s.title} delay={i * 0.1}>
                                <article className="group relative overflow-hidden rounded-3xl">
                                    <Photo src={s.img} alt={s.title} className="aspect-[4/5]">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                                        <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                                            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-ink-900"><s.icon className="h-5 w-5" /></span>
                                            <h3 className="text-2xl font-medium tracking-tight">{s.title}</h3>
                                            <p className="mt-2 text-sm text-white/75">{s.text}</p>
                                        </div>
                                    </Photo>
                                </article>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* pricing */}
                <section id="pricing" className="scroll-mt-20 bg-gray-50 py-20">
                    <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
                        <div className="text-center">
                            <Reveal><SectionTag>Simple pricing</SectionTag></Reveal>
                            <Reveal delay={0.05}><H2>Clear pricing, no surprises.</H2></Reveal>
                            <Reveal delay={0.1}><p className="mx-auto mt-4 max-w-md text-gray-500">Choose an annual Safety Buddy package. After your first purchase, explore all six modules.</p></Reveal>
                        </div>

                        <div className="mx-auto mt-12 grid max-w-6xl gap-5 md:grid-cols-3">
                            {plans.map((p, i) => (
                                <Reveal key={p.name} delay={i * 0.1}>
                                    <div className={`relative flex h-full flex-col rounded-[20px] p-7 transition hover:-translate-y-1.5 ${p.popular ? 'bg-ink-900 text-white shadow-2xl' : 'bg-white shadow-sm'}`}>
                                        {p.popular && (
                                            <span className="absolute right-5 top-5 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-ink-900">Popular</span>
                                        )}
                                        <p className="text-xl font-medium">{p.name}</p>
                                        <p className={`mt-1 text-sm ${p.popular ? 'text-gray-400' : 'text-gray-500'}`}>{p.tag}</p>
                                        <p className="mt-6 text-5xl font-medium tracking-[-0.06em]">
                                            {p.price === 0 ? 'Free' : <>RM {Number(p.price).toLocaleString()}</>}
                                            {p.price > 0 && <span className={`ml-1 text-base font-normal tracking-normal ${p.popular ? 'text-gray-400' : 'text-gray-500'}`}>/ year</span>}
                                        </p>
                                        <Link href="/register-view" className={`group mt-6 flex items-center justify-between rounded-full py-2 pl-5 pr-2 text-sm font-semibold transition ${p.popular ? 'bg-brand-500 text-ink-900 hover:bg-brand-400' : 'bg-gray-100 text-ink-900 hover:bg-gray-200'}`}>
                                            Get started
                                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-brand-400 transition group-hover:rotate-45"><ArrowUpRight className="h-4 w-4" /></span>
                                        </Link>
                                        <ul className="mt-7 space-y-3 text-sm">
                                            {p.items.map((it) => (
                                                <li key={it} className="flex items-start gap-2.5">
                                                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${p.popular ? 'text-brand-400' : 'text-brand-700'}`} strokeWidth={3} /> {it}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                        <p className="mx-auto mt-7 max-w-4xl text-center text-sm text-gray-500">Additional Inspector: RM800 per Inspector per year, prorated to the remaining subscription term. Self-learning user manual included; formal training certificate is not included.</p>
                    </div>
                </section>

                {/* why us */}
                <section className="mx-auto max-w-[1400px] px-5 py-20 sm:px-8">
                    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                        <div>
                            <Reveal><SectionTag>Trusted, every day</SectionTag></Reveal>
                            <Reveal delay={0.05}><H2>Why teams choose Safety Buddy</H2></Reveal>
                            <Reveal delay={0.1}><p className="mt-4 max-w-sm text-gray-500">We provide a smooth, low-friction safety workflow for every role on the project.</p></Reveal>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {WHY.map((w, i) => (
                                <Reveal key={w.title} delay={i * 0.08}>
                                    <div className="h-full rounded-3xl border border-gray-200 p-6 transition hover:-translate-y-1 hover:border-brand-500 hover:shadow-lg">
                                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-ink-900"><w.icon className="h-6 w-6" /></span>
                                        <p className="mt-5 text-xl font-medium tracking-tight">{w.title}</p>
                                        <p className="mt-1.5 text-sm text-gray-500">{w.text}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* roles */}
                <section className="bg-ink-900 py-20 text-white">
                    <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
                        <Reveal><p className="mb-3 text-base text-gray-400">Built for every role</p></Reveal>
                        <Reveal delay={0.05}><h2 className="font-geist text-[34px] font-medium leading-[1.1] tracking-[-0.06em] sm:text-5xl">One platform, four experiences</h2></Reveal>
                        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {ROLES.map((r, i) => (
                                <Reveal key={r.title} delay={i * 0.08}>
                                    <div className="h-full rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 transition hover:bg-white/10">
                                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-ink-900"><r.icon className="h-6 w-6" /></span>
                                        <p className="mt-5 text-xl font-medium">{r.title}</p>
                                        <p className="mt-2 text-sm text-gray-400">{r.text}</p>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* reviews marquee */}
                <section className="overflow-hidden py-20">
                    <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
                        <Reveal><H2>Trusted by safety teams<br />and contractors</H2></Reveal>
                    </div>
                    <div className="sb-marquee-wrap mt-10">
                        <div className="sb-marquee slow">
                            {[...REVIEWS, ...REVIEWS].map((r, i) => (
                                <div key={i} className="mx-2 flex w-[360px] shrink-0 flex-col justify-between rounded-3xl bg-gray-50 p-6">
                                    <div className="mb-3 flex gap-0.5">{[...Array(5)].map((_, k) => <Star key={k} className="h-4 w-4 fill-brand-500 text-brand-500" />)}</div>
                                    <p className="text-[15px] leading-relaxed">“{r.text}”</p>
                                    <div className="mt-5 flex items-center gap-3">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-brand-400">{r.name.charAt(0)}</span>
                                        <div>
                                            <p className="text-sm font-medium">{r.name}</p>
                                            <p className="text-xs text-gray-500">{r.meta}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* steps */}
                <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8">
                    <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
                        <div className="lg:sticky lg:top-28 lg:self-start">
                            <Reveal><SectionTag>How it works</SectionTag></Reveal>
                            <Reveal delay={0.05}><H2>Up and running in a day</H2></Reveal>
                            <Reveal delay={0.1}><p className="mt-4 max-w-sm text-gray-500">Tell us about your projects and get a clear, upfront setup plan.</p></Reveal>
                            <Reveal delay={0.15}><div className="mt-7"><PillButton href="/register-view" tone="dark">Create my account</PillButton></div></Reveal>
                        </div>
                        <div className="space-y-4">
                            {STEPS.map((s, i) => (
                                <Reveal key={s.title} delay={i * 0.08}>
                                    <div className="flex gap-5 rounded-3xl border border-gray-200 p-6 transition hover:border-brand-500 hover:shadow-lg">
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-900 text-lg font-semibold text-brand-400">{i + 1}</span>
                                        <div>
                                            <p className="text-xl font-medium tracking-tight">{s.title}</p>
                                            <p className="mt-1 text-sm text-gray-500">{s.text}</p>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* modules (coverage) */}
                <section id="modules" className="scroll-mt-20 bg-gray-50 py-20">
                    <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
                        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                            <div>
                                <Reveal><SectionTag>One account, many modules</SectionTag></Reveal>
                                <Reveal delay={0.05}><H2>Choose what fits<br />your business</H2></Reveal>
                            </div>
                            <Reveal delay={0.1}><PillButton href="/register-view" tone="dark">Create an account</PillButton></Reveal>
                        </div>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {MODULES.map((m, i) => (
                                <Reveal key={m.code} delay={i * 0.08}>
                                    <div className="group overflow-hidden rounded-3xl bg-white shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl">
                                        <Photo src={m.img} alt={m.title} className="aspect-[4/3]" tone="light">
                                            <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink-900 shadow"><m.icon className="h-5 w-5" /></span>
                                        </Photo>
                                        <div className="p-5">
                                            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-700">{m.code}</p>
                                            <p className="mt-1 text-lg font-medium leading-snug tracking-tight">{m.title}</p>
                                            <p className="mt-2 text-sm text-gray-500">{m.text}</p>
                                        </div>
                                    </div>
                                </Reveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* guides */}
                <section id="guides" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 py-20 sm:px-8">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <Reveal><SectionTag>Safety tips & guides</SectionTag></Reveal>
                            <Reveal delay={0.05}><H2>Advice from the field</H2></Reveal>
                        </div>
                        <Reveal><a href="#guides" className="hidden rounded-full bg-gray-100 px-5 py-2.5 text-sm font-semibold hover:bg-gray-200 sm:inline-block">See all</a></Reveal>
                    </div>
                    <div className="mt-10 grid gap-6 md:grid-cols-3">
                        {GUIDES.map((g, i) => (
                            <Reveal key={g.title} delay={i * 0.08}>
                                <article className="group cursor-pointer">
                                    <Photo src={g.img} alt={g.title} className="aspect-[4/3] rounded-3xl" />
                                    <p className="mt-4 text-xs text-gray-500">{g.date} • {g.read}</p>
                                    <h3 className="mt-1.5 text-xl font-medium leading-snug tracking-tight transition group-hover:text-brand-700">{g.title}</h3>
                                    <p className="mt-1.5 text-sm text-gray-500">{g.text}</p>
                                </article>
                            </Reveal>
                        ))}
                    </div>
                </section>

                {/* FAQ */}
                <section className="mx-auto max-w-[1400px] px-5 pb-20 sm:px-8">
                    <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
                        <div>
                            <Reveal><SectionTag>Frequently asked questions</SectionTag></Reveal>
                            <Reveal delay={0.05}><H2>Quick answers</H2></Reveal>
                            <Reveal delay={0.1}>
                                <div className="mt-8 flex items-center gap-4 rounded-3xl bg-gray-50 p-5">
                                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink-900 text-lg font-bold text-brand-400">SB</span>
                                    <div>
                                        <p className="text-sm text-gray-500">More questions? Call us!</p>
                                        <p className="font-medium">Safety Buddy Team</p>
                                        <a href={`tel:${CONTACT.phone}`} className="text-sm font-semibold text-brand-700">{CONTACT.phone}</a>
                                    </div>
                                </div>
                            </Reveal>
                        </div>
                        <div className="space-y-3">
                            {FAQ.map((f, i) => {
                                const open = faq === i;
                                return (
                                    <Reveal key={f.q} delay={i * 0.05}>
                                        <div className={`overflow-hidden rounded-2xl border transition ${open ? 'border-brand-500 bg-white shadow-md' : 'border-gray-200'}`}>
                                            <button onClick={() => setFaq(open ? -1 : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                                                <span className="text-[17px] font-medium tracking-tight">{f.q}</span>
                                                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${open ? 'bg-brand-500 text-ink-900' : 'bg-gray-100'}`}>
                                                    {open ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                                </span>
                                            </button>
                                            <AnimatePresence initial={false}>
                                                {open && (
                                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.3, ease }} className="overflow-hidden">
                                                        <p className="px-5 pb-5 text-sm leading-relaxed text-gray-500">{f.a}</p>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </Reveal>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* CTA + stats */}
                <section className="px-1 sm:px-1.5">
                    <Photo src="cta.jpg" alt="Safe site" className="rounded-[28px]">
                        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/55 via-ink-950/60 to-ink-950/80" />
                        <div className="relative mx-auto max-w-[1400px] px-5 py-20 text-center text-white sm:px-8 sm:py-28">
                            <Reveal>
                                <h2 className="mx-auto max-w-3xl font-geist text-4xl font-medium leading-[1.05] tracking-[-0.06em] sm:text-6xl">
                                    Safer sites start today.<br /><span className="text-brand-400">You’re next.</span>
                                </h2>
                            </Reveal>
                            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-3 gap-4">
                                {[
                                    { n: 12000, l: 'Inspections recorded' },
                                    { n: 4500, l: 'Toolbox talks held' },
                                    { n: 150, l: 'Projects managed' },
                                ].map((s) => (
                                    <div key={s.l}>
                                        <p className="text-3xl font-medium tracking-tight sm:text-5xl"><Counter to={s.n} /></p>
                                        <p className="mt-1 text-xs text-white/70 sm:text-sm">{s.l}</p>
                                    </div>
                                ))}
                            </div>
                            <Reveal delay={0.15}>
                                <div className="mt-12 flex justify-center">
                                    <PillButton href="/register-view" tone="accent">Get started</PillButton>
                                </div>
                            </Reveal>
                        </div>
                    </Photo>
                </section>
            </main>

            {/* footer */}
            <footer id="contact" className="mx-auto max-w-[1400px] scroll-mt-20 px-5 pb-8 pt-20 sm:px-8">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
                    <div className="lg:col-span-2">
                        <div className="flex items-center">
                            <img src="/images/sbc-header.png" alt="Safety Buddy – Cmeri" className="h-16 w-auto max-w-[240px] object-contain" />
                        </div>
                        <p className="mt-4 max-w-xs text-sm text-gray-500">Control. Performance. Report. The all-in-one safety management platform for contractors.</p>
                        <div className="mt-6 space-y-2 text-sm">
                            <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-brand-700" />{CONTACT.phone}</p>
                            <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-brand-700" />{CONTACT.email}</p>
                            <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-brand-700" />{CONTACT.address}</p>
                        </div>
                    </div>

                    {[
                        { t: 'Product', l: [['Inspections', '#features'], ['Toolbox talks', '#features'], ['Incident statistics', '#features'], ['Modules', '#modules']] },
                        { t: 'Company', l: [['About', '#about'], ['Pricing', '#pricing'], ['Guides', '#guides'], ['Contact', '#contact']] },
                        { t: 'Access', l: [['Sign in', '/login'], ['Create account', '/register-view']] },
                    ].map((c) => (
                        <div key={c.t}>
                            <p className="text-sm font-semibold">{c.t}</p>
                            <ul className="mt-4 space-y-2.5 text-sm text-gray-500">
                                {c.l.map(([label, href]) => (
                                    <li key={label}><a href={href} className="transition hover:text-ink-950">{label}</a></li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-16 overflow-hidden">
                    <p className="select-none whitespace-nowrap text-center font-geist text-[22vw] font-semibold leading-[0.8] tracking-[-0.07em] text-gray-100 lg:text-[15rem]">
                        SafetyBuddy
                    </p>
                </div>

                <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-gray-200 pt-6 text-xs text-gray-500 sm:flex-row">
                    <p>© {new Date().getFullYear()} Safety Buddy. All rights reserved.</p>
                    <div className="flex gap-5">
                        <a href="#" className="hover:text-ink-950">Privacy Policy</a>
                        <a href="#" className="hover:text-ink-950">Terms of Service</a>
                    </div>
                </div>
            </footer>

        </div>
    );
}
