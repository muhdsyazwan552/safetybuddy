import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function ShowToolboxTalk({ toolboxTalk }) {
    const isConducted = toolboxTalk.conducted === 'yes';

    // Helper for date formatting
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <>
            <Head title={`Talk: ${toolboxTalk.project?.name || 'Details'}`} />

            <div className="min-h-screen bg-[#f5f7fb] py-8">
                <div className="ax-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Mobile-Friendly Top Bar */}
                {/* <div className="bg-white border-b sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
                    <Link
                        href="/inspector/toolbox-talks"
                        className="p-2 -ml-2 text-gray-600 active:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <h1 className="font-bold text-gray-800 text-lg truncate flex-1 px-2 text-center">
                        Toolbox Details
                    </h1>
                    <div className="w-10"></div> 
                </div> */}

                <div className="mb-4">
                    <Link
                        href="/inspector/toolbox-talks"
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
                                        Toolbox Talk Details
                                    </h1>
                                </div>
                            </div>

                            
                        </div>
                    </div>
                </div>

                <div className="max-w-md mx-auto  space-y-4">

                    {/* Status Banner */}
                    <div className={`rounded-2xl p-4 flex items-center justify-between ${isConducted ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'
                        }`}>
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${isConducted ? 'bg-green-500' : 'bg-red-500'}`}>
                                {isConducted ? (
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Status</p>
                                <p className={`font-bold ${isConducted ? 'text-green-700' : 'text-red-700'}`}>
                                    {isConducted ? 'Talk Conducted' : 'Not Conducted'}
                                </p>
                            </div>
                        </div>
                        <span className="text-gray-400 text-xs font-mono">#{toolboxTalk.id}</span>
                    </div>

                    {/* Project & Basic Info */}
                    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 text-xs font-bold uppercase text-gray-400 tracking-widest">
                            Project Information
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Project Name</label>
                                <p className="text-gray-900 font-semibold">{toolboxTalk.project?.name || '-'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                                    <p className="text-sm font-medium">{formatDate(toolboxTalk.inspection_date)}</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Attendance</label>
                                    <p className="text-sm font-medium"><span className="text-blue-600 font-bold">{toolboxTalk.total_attended}</span> Participants</p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Conducted By</label>
                                <p className="text-sm font-medium">{toolboxTalk.company_staff?.name || '-'}</p>
                            </div>
                        </div>
                    </section>

                    {/* Topics Section */}
                    {isConducted && toolboxTalk.topics?.length > 0 && (
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <h2 className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-3">Topics Discussed</h2>
                            <div className="flex flex-wrap gap-2">
                                {toolboxTalk.topics.map((topic) => (
                                    <span key={topic.id} className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-2 rounded-lg border border-blue-100">
                                        {topic.name}
                                    </span>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Photos - Mobile Grid */}
                    {(toolboxTalk.img_group || toolboxTalk.img_attendance) && (
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <h2 className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-4">Site Photos</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {toolboxTalk.img_group && (
                                    <div className="space-y-2">
                                        <div
                                            className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner cursor-pointer"
                                            onClick={() => window.open(`/storage/${toolboxTalk.img_group}`, '_blank')}
                                        >
                                            <img src={`/storage/${toolboxTalk.img_group}`} alt="Group" className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-[10px] text-center font-bold text-gray-400 uppercase">Group Photo</p>
                                    </div>
                                )}
                                {toolboxTalk.img_attendance && (
                                    <div className="space-y-2">
                                        <div
                                            className="aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-inner cursor-pointer"
                                            onClick={() => window.open(`/storage/${toolboxTalk.img_attendance}`, '_blank')}
                                        >
                                            <img src={`/storage/${toolboxTalk.img_attendance}`} alt="Form" className="w-full h-full object-cover" />
                                        </div>
                                        <p className="text-[10px] text-center font-bold text-gray-400 uppercase">Attendance Form</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>

                {/* Floating Action Bar for Mobile */}
                <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t px-6 py-4 flex items-center space-x-3">
                    <Link
                        href={`/inspector/toolbox-talks/${toolboxTalk.id}/edit`}
                        className="flex-1 bg-gray-900 text-white font-bold py-3 px-4 rounded-xl text-center shadow-lg active:scale-95 transition-transform"
                    >
                        Edit Report
                    </Link>
                    <button
                        onClick={() => window.print()}
                        className="bg-white border border-gray-200 text-gray-700 p-3 rounded-xl shadow-sm active:bg-gray-50"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                    </button>
                </div>
            </div>
            </div>
        </>
    );
}