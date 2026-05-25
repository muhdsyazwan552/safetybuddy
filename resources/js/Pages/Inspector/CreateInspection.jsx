import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateInspection({ projects, allSubconCompanies, topics, evaluations, user, staffId }) {
    // --- Logic remains identical to your current implementation ---
    const [currentStep, setCurrentStep] = useState(0);
    const [inspectionItems, setInspectionItems] = useState([
        {
            id: 1,
            project_id: '',
            subcon_company_id: '',
            topic_id: '',
            evaluation: '',
            inspection_date: new Date().toISOString().split('T')[0],
            location: '',
            description: '',
            photos: [],
            photoPreviews: []
        }
    ]);

    const [filteredSubconCompanies, setFilteredSubconCompanies] = useState({});
    const { post, processing } = useForm({});

    useEffect(() => {
        const newFilters = {};
        inspectionItems.forEach(item => {
            if (item.project_id) {
                const selectedProject = projects.find(p => p.id === parseInt(item.project_id));
                newFilters[item.id] = selectedProject?.subcon_companies || [];
            } else {
                newFilters[item.id] = [];
            }
        });
        setFilteredSubconCompanies(newFilters);
    }, [inspectionItems, projects]);

    const addNewInspection = () => {
        const newId = Math.max(...inspectionItems.map(i => i.id), 0) + 1;
        setInspectionItems([
            ...inspectionItems,
            {
                id: newId,
                project_id: '',
                subcon_company_id: '',
                topic_id: '',
                evaluation: '',
                inspection_date: new Date().toISOString().split('T')[0],
                location: '',
                description: '',
                photos: [],
                photoPreviews: []
            }
        ]);
        setCurrentStep(inspectionItems.length);
    };

    const removeInspection = (id) => {
        if (inspectionItems.length === 1) return;
        const newItems = inspectionItems.filter(item => item.id !== id);
        setInspectionItems(newItems);
        if (currentStep >= newItems.length) setCurrentStep(newItems.length - 1);
    };

    const updateInspectionItem = (id, field, value) => {
        setInspectionItems(items =>
            items.map(item => item.id === id ? { ...item, [field]: value } : item)
        );
    };

    const handleFileChange = (id, e) => {
        const files = Array.from(e.target.files);
        const previews = files.map(file => URL.createObjectURL(file));
        setInspectionItems(items =>
            items.map(item => item.id === id ? { ...item, photos: files, photoPreviews: previews } : item)
        );
    };

    const removePhoto = (id, index) => {
        setInspectionItems(items =>
            items.map(item =>
                item.id === id
                    ? {
                        ...item,
                        photos: item.photos.filter((_, i) => i !== index),
                        photoPreviews: item.photoPreviews.filter((_, i) => i !== index)
                    }
                    : item
            )
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        inspectionItems.forEach((item, index) => {
            formData.append(`inspections[${index}][project_id]`, item.project_id);
            formData.append(`inspections[${index}][subcon_company_id]`, item.subcon_company_id);
            formData.append(`inspections[${index}][topic_id]`, item.topic_id);
            formData.append(`inspections[${index}][evaluation]`, item.evaluation);
            formData.append(`inspections[${index}][inspection_date]`, item.inspection_date);
            formData.append(`inspections[${index}][location]`, item.location);
            formData.append(`inspections[${index}][description]`, item.description || '');
            if (item.photos) {
                item.photos.forEach((photo, pIdx) => formData.append(`inspections[${index}][photos][${pIdx}]`, photo));
            }
        });

        axios.post('/inspector/inspections/multiple', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        }).then(response => {
            if (response.data.success) {
                alert(response.data.message);
                window.location.href = '/inspector/inspections';
            }
        }).catch(error => alert('Error: ' + (error.response?.data?.message || 'Failed to save')));
    };

    const currentItem = inspectionItems[currentStep];
    const isLastItem = currentStep === inspectionItems.length - 1;

    // --- Design Utility Classes ---
    const labelClass = "text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1 mb-2 block";
    const inputClass = "w-full rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200";

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            <Head title="Create Multiple Inspections" />

            <div className="max-w-3xl mx-auto px-4 pt-8">
                {/* Modern Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between items-end mb-3 px-1">
                        <div>
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Current Progress</h2>
                            <p className="text-2xl font-black text-slate-800">Inspection {currentStep + 1} <span className="text-slate-300">/ {inspectionItems.length}</span></p>
                        </div>
                        <button
                            type="button"
                            onClick={addNewInspection}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                        >
                            <span>+</span> Add New
                        </button>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentStep + 1) / inspectionItems.length) * 100}%` }}
                            className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full"
                        />
                    </div>
                </div>

                {/* Form Navigation Header */}
                <div className="flex justify-between items-center mb-4 gap-2">
                    <button
                        type="button"
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        disabled={currentStep === 0}
                        className={`flex-1 py-3 rounded-2xl font-bold transition-all ${currentStep === 0 ? 'bg-slate-100 text-slate-300' : 'bg-white text-slate-600 border border-slate-200 shadow-sm'}`}
                    >
                        ← Back
                    </button>
                    <button
                        type="button"
                        onClick={() => isLastItem ? null : setCurrentStep(prev => prev + 1)}
                        className={`flex-1 py-3 rounded-2xl font-bold transition-all ${isLastItem ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'}`}
                    >
                        {isLastItem ? 'Last Item Reached' : 'Next Step →'}
                    </button>
                </div>

                {/* Main Inspection Card */}
                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
                    <div className="p-6 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">Active Sheet</span>
                            <h3 className="text-xl font-bold text-slate-800 mt-1">Inspection Details</h3>
                        </div>
                        {inspectionItems.length > 1 && (
                            <button onClick={() => removeInspection(currentItem.id)} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        )}
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Project Reference *</label>
                                <select value={currentItem.project_id} onChange={(e) => { updateInspectionItem(currentItem.id, 'project_id', e.target.value); updateInspectionItem(currentItem.id, 'subcon_company_id', ''); }} className={inputClass} required>
                                    <option value="">Select Project</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Subcon Company *</label>
                                <select value={currentItem.subcon_company_id} onChange={(e) => updateInspectionItem(currentItem.id, 'subcon_company_id', e.target.value)} className={`${inputClass} ${!currentItem.project_id ? 'opacity-50' : ''}`} required disabled={!currentItem.project_id}>
                                    <option value="">Select Subcon</option>
                                    {(filteredSubconCompanies[currentItem.id] || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Inspection Topic *</label>
                                <select value={currentItem.topic_id} onChange={(e) => updateInspectionItem(currentItem.id, 'topic_id', e.target.value)} className={inputClass} required>
                                    <option value="">Select Topic</option>
                                    {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Evaluation Status *</label>
                                <select value={currentItem.evaluation} onChange={(e) => updateInspectionItem(currentItem.id, 'evaluation', e.target.value)} className={inputClass} required>
                                    <option value="">Select Evaluation</option>
                                    {evaluations.map(ev => <option key={ev} value={ev}>{ev.toUpperCase()}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Date *</label>
                                <input type="date" value={currentItem.inspection_date} onChange={(e) => updateInspectionItem(currentItem.id, 'inspection_date', e.target.value)} className={inputClass} required />
                            </div>

                            <div>
                                <label className={labelClass}>Specific Location *</label>
                                <input type="text" value={currentItem.location} onChange={(e) => updateInspectionItem(currentItem.id, 'location', e.target.value)} className={inputClass} placeholder="Level 3, Zone B..." required />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Description / Notes</label>
                            <textarea value={currentItem.description} onChange={(e) => updateInspectionItem(currentItem.id, 'description', e.target.value)} rows="3" className={inputClass} placeholder="Add detailed observations..." />
                        </div>

                        {/* Photo Upload Area */}
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                            <label className={labelClass}>Evidence Photos</label>
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-white hover:border-indigo-400 transition-all cursor-pointer relative">
                                <span className="text-slate-400 font-bold text-sm">Drop photos here or Click to upload</span>
                                <input type="file" multiple accept="image/*" onChange={(e) => handleFileChange(currentItem.id, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>

                            {currentItem.photoPreviews?.length > 0 && (
                                <div className="grid grid-cols-4 gap-3 mt-4">
                                    {currentItem.photoPreviews.map((preview, idx) => (
                                        <div key={idx} className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200">
                                            <img src={preview} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removePhoto(currentItem.id, idx)} className="absolute top-1 right-1 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Jump Bar */}
                    {inspectionItems.length > 1 && (
                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3 overflow-x-auto">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Jump To:</span>
                            {inspectionItems.map((item, idx) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setCurrentStep(idx)}
                                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all shrink-0 ${idx === currentStep ? 'bg-indigo-600 text-white scale-110 shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Final Submission Button - Only visible on last item */}
                <AnimatePresence>
                    {isLastItem && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 flex flex-col gap-3"
                        >
                            <button
                                type="submit"
                                onClick={handleSubmit}
                                disabled={processing}
                                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-emerald-100 transition-all disabled:opacity-50"
                            >
                                {processing ? 'Uploading All Data...' : `Submit All ${inspectionItems.length} Inspections`}
                            </button>
                            <button onClick={() => window.history.back()} className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">Cancel and discard all</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}