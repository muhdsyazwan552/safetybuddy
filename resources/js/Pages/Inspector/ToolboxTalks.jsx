// resources/js/Pages/Inspector/ToolboxTalks.jsx

import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InspectorLayout from '@/Layouts/InspectorLayout';

export default function ToolboxTalks({ toolboxTalks, projects, filters, user }) {
    const [showFilters, setShowFilters] = useState(false);
    const [filterValues, setFilterValues] = useState(filters || {});

    const applyFilters = () => {
        router.get('/inspector/toolbox-talks', filterValues, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setFilterValues({});
        router.get('/inspector/toolbox-talks', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const deleteToolboxTalk = (id) => {
        if (confirm('Are you sure you want to delete this toolbox talk?')) {
            router.delete(`/inspector/toolbox-talks/${id}`);
        }
    };

    return (
        <InspectorLayout user={user}>
            <Head title="Toolbox Talks" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Toolbox Talks</h1>
                        <Link
                            href="/inspector/toolbox-talks/create"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
                        >
                            + New Talk
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 mb-8 overflow-hidden">
                        <div className="p-6">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-colors group"
                            >
                                <div className={`p-1.5 rounded-lg transition-colors ${showFilters ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 group-hover:bg-gray-100'}`}>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                    </svg>
                                </div>
                                {showFilters ? 'Hide Filters' : 'Filter Results'}
                            </button>

                            {showFilters && (
                                <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {/* Project Select */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Project Site</label>
                                            <select
                                                value={filterValues.project_id || ''}
                                                onChange={(e) => setFilterValues({ ...filterValues, project_id: e.target.value })}
                                                className="w-full bg-gray-50 border-none text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-100 transition-all px-4 py-2.5"
                                            >
                                                <option value="">All Projects</option>
                                                {projects.map(project => (
                                                    <option key={project.id} value={project.id}>{project.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Start Date */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Start Date</label>
                                            <input
                                                type="date"
                                                value={filterValues.start_date || ''}
                                                onChange={(e) => setFilterValues({ ...filterValues, start_date: e.target.value })}
                                                className="w-full bg-gray-50 border-none text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-100 transition-all px-4 py-2.5"
                                            />
                                        </div>

                                        {/* End Date */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">End Date</label>
                                            <input
                                                type="date"
                                                value={filterValues.end_date || ''}
                                                onChange={(e) => setFilterValues({ ...filterValues, end_date: e.target.value })}
                                                className="w-full bg-gray-50 border-none text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-100 transition-all px-4 py-2.5"
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-8 flex items-center gap-3">
                                        <button
                                            onClick={applyFilters}
                                            className="flex-1 md:flex-none px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95"
                                        >
                                            Apply Filters
                                        </button>
                                        <button
                                            onClick={resetFilters}
                                            className="flex-1 md:flex-none px-6 py-2.5 bg-gray-100 text-gray-500 text-sm font-bold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conducted By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topics</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendees</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {toolboxTalks.data.map((talk) => (
                                    <tr key={talk.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm">{talk.project.name}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {talk.company_staff?.name || talk.conducted}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {talk.topics?.map(t => t.title).join(', ') || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">{talk.total_attended}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {new Date(talk.inspection_date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <Link href={`/inspector/toolbox-talks/${talk.id}`} className="text-blue-600">View</Link>
                                            <Link href={`/inspector/toolbox-talks/${talk.id}/edit`} className="text-green-600">Edit</Link>
                                            <button onClick={() => deleteToolboxTalk(talk.id)} className="text-red-600">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List */}
                    <div className="md:hidden space-y-1 p-0 bg-gray-50/50">
                        {toolboxTalks.data.map((talk, index) => (
                            <div
                                key={talk.id}
                                onClick={() => window.location.href = `/inspector/toolbox-talks/detail/${talk.id}`}
                                className="group relative bg-white rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98]"
                            >
                                <div className="p-6">
                                    
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm border border-indigo-100">
                                                {(toolboxTalks.current_page - 1) * toolboxTalks.per_page + index + 1}
                                            </div>
                                            <div>
                                            <h3 className="font-bold text-gray-800 text-lg leading-tight tracking-tight">
                                                {talk.project?.name}
                                            </h3>
                                            {/* Highlighted Date */}
                                            <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-md">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span className="text-[11px] font-bold uppercase tracking-wide">
                                                    {talk.inspection_date && new Date(talk.inspection_date).toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                            </div>
                                        </div>

                                        {/* Status Pill */}
                                        <div className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${talk.conducted === 'yes'
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                : "bg-gray-50 text-gray-400 border-gray-200"
                                            }`}>
                                            {talk.conducted === 'yes' ? '● Conducted' : 'Not Conducted'}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                        <div className="flex items-center gap-3">
                                            
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-0.5">Person In Charge</p>
                                                <p className="text-sm font-semibold text-gray-700">
                                                    {talk.company_staff?.name || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Arrow Indicator */}
                                        <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                            <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="mt-4">
                        {toolboxTalks.links && (

                            <>
                                {/* Desktop Pagination */}
                                <div className="hidden md:flex justify-between items-center">
                                    <div className="text-sm text-gray-500">
                                        Showing {toolboxTalks.from || 0} to {toolboxTalks.to || 0} of {toolboxTalks.total || 0} results
                                    </div>

                                    <div className="space-x-2">
                                        {toolboxTalks.links.map((link, index) => (
                                            <Link
                                                key={index}
                                                href={link.url || '#'}
                                                className={`px-3 py-1 rounded text-sm 
                                ${link.active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'} 
                                ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Mobile Pagination */}
                                <div className="md:hidden space-y-3">

                                    <div className="text-sm text-gray-500 text-center">
                                        {toolboxTalks.from || 0} - {toolboxTalks.to || 0} / {toolboxTalks.total || 0}
                                    </div>

                                    <div className="flex justify-between">
                                        {/* Previous */}
                                        <Link
                                            href={toolboxTalks.prev_page_url || '#'}
                                            className={`flex-1 text-center px-4 py-2 rounded-lg text-sm
                            ${toolboxTalks.prev_page_url
                                                    ? 'bg-gray-200 text-gray-700'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            ← Previous
                                        </Link>

                                        {/* Next */}
                                        <Link
                                            href={toolboxTalks.next_page_url || '#'}
                                            className={`flex-1 text-center px-4 py-2 rounded-lg text-sm ml-2
                            ${toolboxTalks.next_page_url
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-blue-100 text-blue-300 cursor-not-allowed'}`}
                                        >
                                            Next →
                                        </Link>
                                    </div>

                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </InspectorLayout>
    );
}