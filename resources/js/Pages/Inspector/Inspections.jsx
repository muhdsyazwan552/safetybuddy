// resources/js/Pages/Inspector/Inspections.jsx

import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import InspectorLayout from '@/Layouts/InspectorLayout';

export default function Inspections({ inspections, projects, subconCompanies, evaluations, filters, user }) {
    const [showFilters, setShowFilters] = useState(false);
    const [filterValues, setFilterValues] = useState(filters || {});

    const getEvaluationColor = (evaluation) => {
        const colors = {
            good: 'bg-emerald-50 text-emerald-600 border-emerald-100',
            moderate: 'bg-blue-50 text-blue-600 border-blue-100',
            poor: 'bg-orange-50 text-orange-600 border-orange-100',
            nonconformance: 'bg-red-50 text-red-600 border-red-100',
            clientcomplaint: 'bg-purple-50 text-purple-600 border-purple-100',
        };
        return colors[evaluation] || 'bg-gray-50 text-gray-600 border-gray-100';
    };



    const applyFilters = () => {
        router.get('/inspector/inspections', filterValues, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const resetFilters = () => {
        setFilterValues({});
        router.get('/inspector/inspections', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const deleteInspection = (id) => {
        if (confirm('Are you sure you want to delete this inspection?')) {
            router.delete(`/inspector/inspections/${id}`);
        }
    };

    return (
        <InspectorLayout user={user}>
            <Head title="Inspections" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Inspections</h1>
                        <Link
                            href="/inspector/inspections/create"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all active:scale-95"
                        >
                            + New Inspection
                        </Link>
                    </div>

                    {/* Filters - Same as Toolbox */}
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
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Evaluation */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Evaluation</label>
                                            <select
                                                value={filterValues.evaluation || ''}
                                                onChange={(e) => setFilterValues({ ...filterValues, evaluation: e.target.value })}
                                                className="w-full bg-gray-50 border-none text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-100 transition-all px-4 py-2.5"
                                            >
                                                <option value="">All Evaluations</option>
                                                {evaluations && evaluations.map((evaluationOption) => (
                                                    <option key={evaluationOption} value={evaluationOption}>
                                                        {evaluationOption.charAt(0).toUpperCase() + evaluationOption.slice(1)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Project */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Project Site</label>
                                            <select
                                                value={filterValues.project_id || ''}
                                                onChange={(e) => setFilterValues({ ...filterValues, project_id: e.target.value })}
                                                className="w-full bg-gray-50 border-none text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-100 transition-all px-4 py-2.5"
                                            >
                                                <option value="">All Projects</option>
                                                {projects && projects.map(project => (
                                                    <option key={project.id} value={project.id}>{project.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Subcon Company */}
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Subcon Company</label>
                                            <select
                                                value={filterValues.subcon_company_id || ''}
                                                onChange={(e) => setFilterValues({ ...filterValues, subcon_company_id: e.target.value })}
                                                className="w-full bg-gray-50 border-none text-gray-700 text-sm rounded-xl focus:ring-2 focus:ring-blue-100 transition-all px-4 py-2.5"
                                            >
                                                <option value="">All Companies</option>
                                                {subconCompanies && subconCompanies.map(company => (
                                                    <option key={company.id} value={company.id}>{company.name}</option>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subcon</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evaluation</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {inspections && inspections.data && inspections.data.length > 0 ? (
                                    inspections.data.map((inspection) => (
                                        <tr key={inspection.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-900">{inspection.project?.name || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{inspection.subcon_company?.name || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{inspection.topic?.title || '-'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getEvaluationColor(inspection.evaluation)}`}>

                                                    {inspection.evaluation}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {inspection.inspection_date ? new Date(inspection.inspection_date).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{inspection.location || '-'}</td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <Link
                                                    href={`/inspector/inspections/${inspection.id}`}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    View
                                                </Link>
                                                <Link
                                                    href={`/inspector/inspections/${inspection.id}/edit`}
                                                    className="text-green-600 hover:text-green-900"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => deleteInspection(inspection.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                                            No inspections found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card List - Same style as Toolbox */}
                    <div className="md:hidden space-y-1 px-1">
                        {inspections && inspections.data && inspections.data.length > 0 ? (
                            inspections.data.map((inspection, index) => (
                                <div
                                    key={inspection.id}
                                    onClick={() => (window.location.href = `/inspector/inspections/detail/${inspection.id}`)}
                                    className="group relative bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/80 cursor-pointer active:scale-[0.98] active:bg-slate-50 transition-all duration-200"
                                >
                                    {/* Header: Icon, Project Name & Status */}
                                    <div className="flex justify-between items-start mb-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg shadow-sm border border-indigo-100">
                                                {(inspections.current_page - 1) * inspections.per_page + index + 1}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-800 leading-tight tracking-tight">
                                                    {inspection.project?.name || '-'}
                                                </h3>
                                                <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {inspection.inspection_date && new Date(inspection.inspection_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                            </div>
                                        </div>

                                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-tighter shadow-sm ${getEvaluationColor(inspection.evaluation)}`}>
                                            {inspection.evaluation}
                                        </span>
                                    </div>

                                    {/* Details Section */}
                                    <div className="grid grid-cols-2 gap-6 pt-5 border-t border-slate-50">
                                        <div>
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Subcon</div>
                                            <div className="text-xs font-bold text-slate-700 truncate">
                                                {inspection.subcon_company?.name || '-'}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Inspection By</div>
                                            <div className="text-xs font-bold text-slate-700">
                                                {inspection.inspector?.name || '-'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Subtle Right Arrow (Floating) */}
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 group-active:opacity-30 transition-opacity">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] text-center py-16">
                                <div className="text-slate-300 mb-3">
                                    <svg className="w-14 h-14 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <p className="font-black text-slate-400 uppercase text-xs tracking-widest">No records found</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination - Same as Toolbox */}
                    {inspections && inspections.links && (
                        <div className="mt-4">
                            {/* Desktop Pagination */}
                            <div className="hidden md:flex justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    Showing {inspections.from || 0} to {inspections.to || 0} of {inspections.total || 0} results
                                </div>
                                <div className="space-x-2">
                                    {inspections.links.map((link, index) => (
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
                                    {inspections.from || 0} - {inspections.to || 0} / {inspections.total || 0}
                                </div>
                                <div className="flex justify-between">
                                    <Link
                                        href={inspections.prev_page_url || '#'}
                                        className={`flex-1 text-center px-4 py-2 rounded-lg text-sm
                                            ${inspections.prev_page_url
                                                ? 'bg-gray-200 text-gray-700'
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                    >
                                        ← Previous
                                    </Link>
                                    <Link
                                        href={inspections.next_page_url || '#'}
                                        className={`flex-1 text-center px-4 py-2 rounded-lg text-sm ml-2
                                            ${inspections.next_page_url
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-blue-100 text-blue-300 cursor-not-allowed'}`}
                                    >
                                        Next →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </InspectorLayout>
    );
}