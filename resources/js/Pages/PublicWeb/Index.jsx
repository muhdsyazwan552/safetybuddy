import React from 'react';
import { Head, Link } from '@inertiajs/react';

const FeatureCard = ({ title, description, icon }) => (
    <div className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-6">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
);

export default function Landing() {
    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100">
            <Head title="SafetyBuddy - All-in-One Safety & Project Management" />

            {/* Navigation */}
            <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
                <div className="text-2xl font-black text-blue-600 tracking-tight">SafetyBuddy</div>
                <div className="space-x-8 text-sm font-medium text-gray-600 hidden md:flex">
                    <a href="#features" className="hover:text-blue-600">Features</a>
                    <a href="#marketplace" className="hover:text-blue-600">Marketplace</a>
                    <a href="#news" className="hover:text-blue-600">News</a>
                </div>
                <div className='flex items-center gap-2'>
                    <Link href="/login" className="px-6 py-2.5 bg-blue-500 text-white rounded-full text-sm font-semibold hover:bg-blue-600 transition">
                    Sign In
                </Link>
                <Link href="/register-view" className="px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-semibold hover:bg-gray-800 transition">
                    Sign Up
                </Link>
                </div>
                
            </nav>

            {/* Hero Section */}
            <header className="max-w-7xl mx-auto px-8 py-20 text-center">
                <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-4">
                    New: Project-Based Job Applications
                </span>
                <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 tracking-tight">
                    Safety Inspection & <br /> 
                    <span className="text-blue-600">Project Execution</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
                    One platform to manage inspections, track inventory, stay updated with industry news, and hire professionals for specific project needs.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
                        Start Inspection
                    </button>
                    <button className="px-8 py-4 bg-white text-gray-900 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition">
                        Browse Marketplace
                    </button>
                </div>
            </header>

            {/* Feature Grid */}
            <section id="features" className="max-w-7xl mx-auto px-8 py-20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FeatureCard 
                        title="Smart Inspections" 
                        description="Conduct digital audits and safety checks with real-time reporting and compliance tracking."
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    />
                    <FeatureCard 
                        title="Apply by Project" 
                        description="Skip the traditional resume. Apply directly to specific safety projects and showcase your specialized skills."
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
                    />
                    <FeatureCard 
                        title="Inventory Control" 
                        description="Keep track of safety gear, tools, and consumables. Real-time alerts for low stock levels."
                        icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                    />
                </div>
            </section>

            {/* Marketplace Preview */}
            <section id="marketplace" className="bg-gray-900 py-24 text-white">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                        <div>
                            <h2 className="text-3xl font-bold mb-4">Marketplace & Services</h2>
                            <p className="text-gray-400">Buy safety equipment or hire specialized safety services.</p>
                        </div>
                        <button className="mt-6 md:mt-0 text-blue-400 font-semibold hover:underline">View all items →</button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="bg-gray-800 border border-gray-700 rounded-xl p-4 overflow-hidden">
                                <div className="aspect-square bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                                    <span className="text-gray-500">Product Image</span>
                                </div>
                                <h4 className="font-bold mb-1">Industrial Safety Kit</h4>
                                <p className="text-blue-400 text-sm font-bold">$299.00</p>
                                <button className="w-full mt-4 py-2 bg-white text-black text-xs font-bold rounded-lg">Add to Cart</button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* News/Blog Section */}
            <section id="news" className="max-w-7xl mx-auto px-8 py-24">
                <h2 className="text-3xl font-bold mb-12">Safety Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="group cursor-pointer">
                        <div className="overflow-hidden rounded-2xl mb-6">
                            <div className="bg-gray-200 h-64 group-hover:scale-105 transition-transform duration-500"></div>
                        </div>
                        <span className="text-blue-600 font-bold text-sm">Industry News</span>
                        <h3 className="text-2xl font-bold mt-2 group-hover:text-blue-600 transition">New OSHA Regulations for 2026: What you need to know</h3>
                    </div>
                    <div className="space-y-8">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex gap-6 items-center group cursor-pointer">
                                <div className="w-24 h-24 bg-gray-200 rounded-xl flex-shrink-0"></div>
                                <div>
                                    <h4 className="font-bold group-hover:text-blue-600 transition">Managing Inventory for Large Scale Construction</h4>
                                    <p className="text-gray-500 text-sm mt-1 flex items-center">
                                        <span>April 27, 2026</span>
                                        <span className="mx-2">•</span>
                                        <span>5 min read</span>
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}