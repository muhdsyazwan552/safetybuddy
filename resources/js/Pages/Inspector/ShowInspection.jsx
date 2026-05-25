import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';


export default function ShowInspection({ inspection, user }) {
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    const getEvaluationColor = (evaluation) => {
        const colors = {
            good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            moderate: 'bg-blue-50 text-blue-700 border-blue-200',
            poor: 'bg-orange-50 text-orange-700 border-orange-200',
            nonconformance: 'bg-red-50 text-red-700 border-red-200',
            clientcomplaint: 'bg-purple-50 text-purple-700 border-purple-200',
        };

        return colors[evaluation] || 'bg-gray-50 text-gray-700 border-gray-200';
    };

    const getEvaluationIcon = (evaluation) => {
        switch (evaluation) {
            case 'good':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                        />
                    </svg>
                );

            case 'moderate':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                );

            case 'poor':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                );

            case 'nonconformance':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M8.257 3.099c.765-1.316 2.722-1.316 3.487 0l5.58 9.6c.764 1.316-.19 2.901-1.744 2.901H4.42c-1.553 0-2.507-1.585-1.743-2.901l5.58-9.6zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                );

            case 'clientcomplaint':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                            fillRule="evenodd"
                            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
                            clipRule="evenodd"
                        />
                    </svg>
                );

            default:
                return null;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';

        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusColor = (status) => {
        return status === 'open'
            ? 'bg-red-100 text-red-700 border-red-200'
            : 'bg-green-100 text-green-700 border-green-200';
    };

    const photoUrl = inspection.photo
        ? `/storage/${inspection.photo}`
        : null;

    return (
        <>
            <Head title={`Inspection: ${inspection.project?.name || 'Details'}`} />

            {/* Modal */}
            {selectedPhoto && (
                <div
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div className="relative max-w-5xl w-full">
                        <img
                            src={selectedPhoto}
                            alt="Preview"
                            className="w-full h-auto rounded-3xl shadow-2xl"
                        />

                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="absolute top-5 right-5 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="min-h-screen bg-[#f5f7fb] py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* HEADER */}
                    <div className="mb-8">
                        <Link
                            href="/inspector/inspections"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition mb-5 group"
                        >
                            <div className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-50 transition">
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2.5}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </div>

                            <span>Back</span>
                        </Link>

                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                                        <svg
                                            className="w-7 h-7 text-blue-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 3h6a1 1 0 011 1v2H8V4a1 1 0 011-1z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4"
                                            />
                                        </svg>
                                    </div>

                                    <div>
                                        <h1 className="text-xl font-bold text-gray-900">
                                            Inspection Details
                                        </h1>

                                        <p className="text-sm text-gray-500 mt-1">
                                            Inspection ID #{inspection.id}
                                        </p>
                                    </div>
                                </div>

                                <div className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold border shadow-sm ${getEvaluationColor(inspection.evaluation)}`}>
                                    {getEvaluationIcon(inspection.evaluation)}
                                    {inspection.evaluation?.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className="space-y-6">

                        {/* CARD */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

                            <div className="px-6 py-4 bg-gray-100 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Project Information
                                </h2>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                        Project Name
                                    </label>

                                    <p className="text-gray-800 text-[15px] font-semibold">
                                        {inspection.project?.name || '-'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                        Inspection Date
                                    </label>

                                    <p className="text-gray-800 text-[15px] font-semibold">
                                        {formatDate(inspection.inspection_date)}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                        Location
                                    </label>

                                    <p className="text-gray-800 text-[15px] font-semibold">
                                        {inspection.location || '-'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                        Topic
                                    </label>

                                    <p className="text-gray-800 text-[15px] font-semibold">
                                        {inspection.topic?.name ||
                                            inspection.topic?.title ||
                                            '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* COMPANY */}
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

                            <div className="px-6 py-4 bg-gray-100 border-b border-gray-100">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Company Information
                                </h2>
                            </div>

                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                        Inspected By
                                    </label>

                                    <p className="text-gray-800 text-[15px] font-semibold">
                                        {inspection.inspector?.name || 'N/A'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                        Inspactee Company
                                    </label>

                                    <p className="text-gray-800 text-[15px] font-semibold">
                                        {inspection.subcon_company?.name || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* DESCRIPTION */}
                        {inspection.description && (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

                                <div className="px-6 py-4 bg-gray-100 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Description
                                    </h2>
                                </div>

                                <div className="p-6">
                                    <p className="text-gray-700 leading-8 whitespace-pre-wrap">
                                        {showFullDescription ||
                                            inspection.description.length <= 300
                                            ? inspection.description
                                            : `${inspection.description.substring(0, 300)}...`}

                                        {inspection.description.length > 300 && (
                                            <button
                                                onClick={() =>
                                                    setShowFullDescription(
                                                        !showFullDescription
                                                    )
                                                }
                                                className="ml-2 text-blue-600 font-semibold hover:text-blue-700"
                                            >
                                                {showFullDescription
                                                    ? 'Show less'
                                                    : 'Read more'}
                                            </button>
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* PHOTO */}
                        {photoUrl && (
                            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

                                <div className="px-6 py-4 bg-gray-100 border-b border-gray-100">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Inspection Photo
                                    </h2>
                                </div>

                                <div className="p-6">
                                    <div
                                        className="relative aspect-video max-w-4xl mx-auto rounded-3xl overflow-hidden bg-gray-100 shadow-lg cursor-pointer group"
                                        onClick={() => setSelectedPhoto(photoUrl)}
                                    >
                                        <img
                                            src={photoUrl}
                                            alt="Inspection"
                                            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                                        />

                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NON CONFORMANCE */}
                        {inspection.evaluation === 'nonconformance' &&
                            inspection.non_conformance && (
                                <div className="bg-white rounded-3xl border border-red-100 shadow-sm overflow-hidden">

                                    <div className="px-6 py-4 bg-red-50 border-b border-red-100">
                                        <h2 className="text-lg font-semibold text-red-700">
                                            Non-Conformance Report
                                        </h2>
                                    </div>

                                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                                Status
                                            </label>

                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(inspection.non_conformance.status)}`}>
                                                {inspection.non_conformance.status?.toUpperCase()}
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                                Date Open
                                            </label>

                                            <p className="text-gray-800 text-[15px] font-semibold">
                                                {formatDate(inspection.non_conformance.date_open)}
                                            </p>
                                        </div>

                                        {inspection.non_conformance.comment && (
                                            <div className="md:col-span-2">
                                                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
                                                    Comment
                                                </label>

                                                <div className="bg-gray-50 rounded-2xl p-4 text-gray-700 leading-relaxed">
                                                    {inspection.non_conformance.comment}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}



                        {/* BUTTONS */}
                        <div className="flex flex-wrap justify-end gap-3">

                            <Link
                                href={`/inspector/inspections/${inspection.id}/edit`}
                                className="inline-flex items-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-2xl shadow-sm transition-all duration-200 hover:scale-[1.02]"
                            >
                                <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>

                                Edit Inspection
                            </Link>

                            <button
                                onClick={() => window.print()}
                                className="inline-flex items-center px-5 py-3 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-2xl shadow-sm transition-all duration-200"
                            >
                                <svg
                                    className="w-4 h-4 mr-2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                                    />
                                </svg>

                                Print
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}