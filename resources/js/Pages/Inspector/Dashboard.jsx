import React, { useEffect, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    ClipboardCheck,
    AlertTriangle,
    HardHat,
    Building2,
    Plus,
    ArrowRight,
    Users,
    TrendingUp
} from 'lucide-react';

export default function Dashboard({
    stats,
    recentInspections,
    projects,
    evaluationStats,
    recentToolboxTalks,
    user
}) {

    const container = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.05 } }
    };

    const item = {
        hidden: { opacity: 0, y: 15 },
        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } }
    };

    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const h = currentTime.getHours();
        if (h < 12) return 'Good Morning';
        if (h < 17) return 'Good Afternoon';
        if (h < 21) return 'Good Evening';
        return 'Good Night';
    };

    const time = currentTime.toLocaleTimeString('en-MY', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const date = currentTime.toLocaleDateString('en-MY', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });

    const statCards = [
        { title: 'Projects', value: stats.total_projects, icon: Building2, link: '/inspector/projects' },
        { title: 'Active', value: stats.active_projects, icon: LayoutDashboard, link: '/inspector/projects' },
        { title: 'Inspections', value: stats.total_inspections, icon: ClipboardCheck, link: '/inspector/inspections' },
        { title: 'NC', value: stats.nonconformance_count, icon: AlertTriangle, link: '/inspector/inspections' },
        { title: 'Toolbox', value: stats.total_toolbox_talks, icon: HardHat, link: '/inspector/toolbox-talks' },
        { title: 'Subcons', value: stats.active_subcons, icon: Users, link: '/inspector/subcon-companies' },
    ];

    return (
        <InspectorLayout user={user}>
            <Head title="Dashboard" />

            <div className="min-h-screen bg-gray-50 py-5 sm:py-8 px-3 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">

                    {/* HEADER (MOBILE FRIENDLY) */}
                    <motion.div
                        initial="hidden"
                        animate="show"
                        variants={container}
                        className="flex flex-col gap-4 sm:gap-6"
                    >
                        {/* Top Greeting */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                            <div className="space-y-1">
                                <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                                    {getGreeting()},{' '}
                                    <span className="text-blue-600">
                                        {user?.name?.split(' ')[0]}
                                    </span> 👋
                                </h1>

                                <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                                    Inspection dashboard overview
                                </p>
                            </div>

                            {/* TIME CARD */}
                            <div className="bg-white border border-gray-100 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-center gap-3 w-full sm:w-auto ">

                                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>

                                <div>
                                    <p className="text-base sm:text-xl font-bold text-gray-900">{time}</p>
                                    <p className="text-[11px] sm:text-xs text-gray-500">{date}</p>
                                </div>
                            </div>
                        </div>

                        {/* ACTION BUTTON */}
                        <Link
                            href="/inspector/inspections/create"
                            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl shadow-sm active:scale-[0.98] transition"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Inspection
                        </Link>
                    </motion.div>

                    {/* STATS (RESPONSIVE GRID) */}
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4"
                    >
                        {statCards.map((s, i) => (
                            <motion.div key={i} variants={item}>
                                <Link
                                    href={s.link}
                                    className="bg-white border border-gray-100 rounded-2xl p-3 sm:p-5 flex flex-col gap-2 hover:shadow-md active:scale-[0.98] transition"
                                >
                                    <s.icon className="w-5 h-5 text-blue-600" />
                                    <p className="text-xs text-gray-500">{s.title}</p>
                                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{s.value}</p>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* MAIN CONTENT STACK (MOBILE FIRST) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* RECENT */}
                        <div className="lg:col-span-2 space-y-5">

                            <div className="bg-white rounded-2xl border border-gray-100">
                                <div className="p-4 border-b">
                                    <h2 className="text-sm font-bold">Recent Inspections</h2>
                                </div>

                                <div className="divide-y">
                                    {recentInspections?.map((i) => (
                                        <Link
                                            key={i.id}
                                            href={`/inspector/inspections/${i.id}`}
                                            className="flex items-center gap-3 p-4 active:bg-gray-50"
                                        >
                                            <div className="w-1 h-10 rounded-full bg-blue-500" />

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">
                                                    {i.project_name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {i.subcon_name}
                                                </p>
                                            </div>

                                            <ArrowRight className="w-4 h-4 text-gray-300" />
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* PROJECTS */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {projects?.map((p) => (
                                    <Link
                                        key={p.id}
                                        href={`/inspector/projects/${p.id}`}
                                        className="bg-white border border-gray-100 rounded-2xl p-4 active:scale-[0.98]"
                                    >
                                        <div className="flex justify-between mb-3">
                                            <Building2 className="w-5 h-5 text-gray-500" />
                                            <span className="text-[10px] px-2 py-1 bg-gray-100 rounded-full">
                                                {p.status}
                                            </span>
                                        </div>

                                        <p className="font-semibold text-sm truncate">{p.name}</p>
                                        <p className="text-xs text-gray-400">{p.location}</p>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* SIDEBAR */}
                        <div className="space-y-5">

                            <div className="bg-gray-900 text-white rounded-2xl p-5">
                                <h3 className="text-xs font-bold text-gray-300 mb-4">Risk</h3>
                                {evaluationStats?.map((e, i) => (
                                    <div key={i} className="mb-3">
                                        <div className="flex justify-between text-xs">
                                            <span>{e.evaluation}</span>
                                            <span>{e.total}</span>
                                        </div>
                                        <div className="h-1 bg-white/10 rounded mt-1">
                                            <div className="h-1 bg-blue-400 rounded w-[50%]" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white border rounded-2xl p-4">
                                <h3 className="text-sm font-bold mb-3">Toolbox Talks</h3>

                                <div className="space-y-3">
                                    {recentToolboxTalks?.map((t) => (
                                        <div key={t.id} className="text-xs">
                                            <p className="font-semibold">{t.project_name}</p>
                                            <p className="text-gray-500">{t.conducted_by}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </InspectorLayout>
    );
}