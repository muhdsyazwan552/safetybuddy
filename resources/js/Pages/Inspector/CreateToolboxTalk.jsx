// resources/js/Pages/Inspector/CreateToolboxTalk.jsx

import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import InspectorLayout from '@/Layouts/InspectorLayout';

export default function CreateToolboxTalk({ projects, topics, user }) {
    const { data, setData, post, processing, errors } = useForm({
        project_id: '',
        total_attended: '',
        topics: [],
        inspection_date: new Date().toISOString().split('T')[0],
        img_group: null,
        img_attendance: null,
        is_conducted: null,
    });

    const [selectedTopics, setSelectedTopics] = useState([]);
    const [isConducted, setIsConducted] = useState(null);
    const [groupPhotoPreview, setGroupPhotoPreview] = useState(null);
    const [attendancePhotoPreview, setAttendancePhotoPreview] = useState(null);
    const [groupPhotoError, setGroupPhotoError] = useState(null);
    const [attendancePhotoError, setAttendancePhotoError] = useState(null);



    const handleTopicToggle = (topicId) => {
        const newTopics = selectedTopics.includes(topicId)
            ? selectedTopics.filter(id => id !== topicId)
            : [...selectedTopics, topicId];

        setSelectedTopics(newTopics);
        setData('topics', newTopics);
    };

    const handleFileChange = (e, field) => {
        setData(field, e.target.files[0]);
        const file = e.target.files[0];

        if (!file) return;

        // Validate file size (e.g., max 2MB)
        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            if (field === 'img_group') {
                setGroupPhotoError('File size must be less than 2MB');
                setGroupPhotoPreview(null);
            } else {
                setAttendancePhotoError('File size must be less than 2MB');
                setAttendancePhotoPreview(null);
            }
            e.target.value = ''; // Clear the input
            return;
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            if (field === 'img_group') {
                setGroupPhotoError('Only JPEG, PNG, WEBP images are allowed');
                setGroupPhotoPreview(null);
            } else {
                setAttendancePhotoError('Only JPEG, PNG, WEBP images are allowed');
                setAttendancePhotoPreview(null);
            }
            e.target.value = ''; // Clear the input
            return;
        }

        // Clear any previous errors
        if (field === 'img_group') {
            setGroupPhotoError(null);
        } else {
            setAttendancePhotoError(null);
        }

        // Create preview
        const reader = new FileReader();
        reader.onloadend = () => {
            if (field === 'img_group') {
                setGroupPhotoPreview(reader.result);
            } else {
                setAttendancePhotoPreview(reader.result);
            }
        };
        reader.readAsDataURL(file);

        // Set the file for submission
        setData(field, file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log('Submitting with is_conducted:', data.is_conducted);
        console.log('Form data:', data);

        const formData = new FormData();

        // Always add these fields
        formData.append('project_id', data.project_id);
        formData.append('is_conducted', data.is_conducted);
        formData.append('inspection_date', data.inspection_date);

        if (data.is_conducted == 1) {
            // Add conducted by (staff name)
            const conductedByName = user?.staff_name || user?.name || '';
            formData.append('conducted', conductedByName);

            // Add total_attended
            formData.append('total_attended', data.total_attended || 0);

            // Add topics - MUST be an array
            if (data.topics && data.topics.length > 0) {
                data.topics.forEach(topicId => {
                    formData.append('topics[]', topicId);
                });
            }

            // Add images ONLY if they exist
            if (data.img_group && data.img_group instanceof File) {
                formData.append('img_group', data.img_group);
            }

            if (data.img_attendance && data.img_attendance instanceof File) {
                formData.append('img_attendance', data.img_attendance);
            }
        } else {
            formData.append('total_attended', 0);
            formData.append('topics', []);
        }

        // Debug: Log all FormData entries
        for (let pair of formData.entries()) {
            console.log(pair[0] + ':', pair[1] instanceof File ? pair[1].name : pair[1]);
        }

        post(route('inspector.toolbox-talks.store'), {
            data: formData,
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            onError: (errors) => {
                console.log('Validation errors:', errors);
                // Show errors in alert for debugging
                alert('Validation Error: ' + JSON.stringify(errors, null, 2));
            },
            onSuccess: (response) => {
                console.log('Success response:', response);
            },
            onFinish: () => {
                console.log('Request finished');
            }
        });
    };



    // Add a function to remove/clear images
    const clearImage = (field) => {
        if (field === 'img_group') {
            setGroupPhotoPreview(null);
            setData('img_group', null);
            // Clear the file input
            const fileInput = document.getElementById('group_photo_input');
            if (fileInput) fileInput.value = '';
        } else {
            setAttendancePhotoPreview(null);
            setData('img_attendance', null);
            const fileInput = document.getElementById('attendance_photo_input');
            if (fileInput) fileInput.value = '';
        }
    };

    const cardClass = "bg-white/80 backdrop-blur-sm border border-slate-200 rounded-[2rem] p-6 mb-6 shadow-sm";
    const labelClass = "text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block ml-1";
    const inputClass = "w-full rounded-2xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200";

    return (
        <div className="min-h-screen bg-[#F1F5F9] pb-20">
            <Head title="Toolbox Talk" />

            <div className="max-w-2xl mx-auto px-4 pt-10">
                {/* Clean Header */}
                <header className="mb-10 px-2 text-center sm:text-left">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Toolbox Talk</h1>
                    <p className="text-slate-500 font-medium">Daily safety record & attendance</p>
                </header>

                <form onSubmit={handleSubmit}>
                    {/* General Section */}
                    <section className={cardClass}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClass}>Project Name</label>
                                <select
                                    value={data.project_id}
                                    onChange={(e) => setData('project_id', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Select a project</option>
                                    {projects.map(p => (
                                        <option key={p.project.id} value={p.project.id}>{p.project.name}</option>
                                    ))}
                                </select>
                                {errors.project_id && <p className="text-rose-500 text-xs mt-2 ml-1">{errors.project_id}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>Date of Talk</label>
                                <input
                                    type="date"
                                    value={data.inspection_date}
                                    onChange={(e) => setData('inspection_date', e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Decision Card */}
                    <section className={cardClass}>
                        <label className="text-sm font-bold text-slate-700 block text-center mb-6">
                            Was the briefing conducted today?
                        </label>
                        <div className="flex gap-3">
                            {[
                                { val: 1, label: 'Yes, Conducted', color: 'indigo' },
                                { val: 0, label: 'No, Skipped', color: 'rose' }
                            ].map((option) => (
                                <button
                                    key={option.val}
                                    type="button"
                                    onClick={() => setData('is_conducted', option.val)}
                                    className={`flex-1 py-4 rounded-2xl border-2 font-bold transition-all duration-300 ${data.is_conducted === option.val
                                            ? `bg-${option.color}-50 border-${option.color}-500 text-${option.color}-700 ring-4 ring-${option.color}-500/10`
                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Conducted Details (Animated) */}
                    <AnimatePresence>
                        {data.is_conducted === 1 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                            >
                                <div className={cardClass}>
                                    <div className="grid grid-cols-2 gap-5 mb-8">
                                        <div>
                                            <label className={labelClass}>Conductor</label>
                                            <input
                                                type="text"
                                                value={user?.staff_name || user?.name || ''}
                                                disabled className="w-full rounded-lg border-gray-200 bg-gray-50 text-gray-500" />
                                            <input type="hidden" name="conducted" value={user?.staff_name || user?.name || ''} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Total Workers</label>
                                            <input
                                                type="number"
                                                value={data.total_attended}
                                                onChange={(e) => setData('total_attended', e.target.value)}
                                                className={inputClass}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className={labelClass}>Safety Topics Selection</label>

                                        {/* Show selected topics as badges */}
                                        {data.topics && data.topics.length > 0 && (
                                            <div className="mb-3 p-3 bg-indigo-50 rounded-xl">
                                                <p className="text-xs font-semibold text-indigo-600 mb-2">
                                                    Selected Topics ({data.topics.length}):
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {topics
                                                        .filter(topic => data.topics.includes(topic.id))
                                                        .map(topic => (
                                                            <span
                                                                key={topic.id}
                                                                className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-lg"
                                                            >
                                                                {topic.name}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleTopicToggle(topic.id)}
                                                                    className="ml-1 hover:text-indigo-900"
                                                                >
                                                                    ×
                                                                </button>
                                                            </span>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        )}

                                        {/* Checkbox list */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                            {topics.map(topic => (
                                                <label
                                                    key={topic.id}
                                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all shadow-sm cursor-pointer ${data.topics?.includes(topic.id)
                                                            ? 'border-indigo-400 bg-indigo-50/50'
                                                            : 'border-transparent bg-white hover:border-indigo-300'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-primary checkbox-sm rounded-md"
                                                        checked={data.topics?.includes(topic.id) || false}
                                                        onChange={() => handleTopicToggle(topic.id)}
                                                    />
                                                    <span className={`text-sm font-semibold ${data.topics?.includes(topic.id)
                                                            ? 'text-indigo-700'
                                                            : 'text-slate-600'
                                                        }`}>
                                                        {topic.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Media Section */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                    <FileUpload
                                        label="Group Photo"
                                        preview={groupPhotoPreview}
                                        onChange={(e) => handleFileChange(e, 'img_group')}
                                        onClear={() => { setData('img_group', null); setGroupPhotoPreview(null); }}
                                    />
                                    <FileUpload
                                        label="Attendance Sheet"
                                        preview={attendancePhotoPreview}
                                        onChange={(e) => handleFileChange(e, 'img_attendance')}
                                        onClear={() => { setData('img_attendance', null); setAttendancePhotoPreview(null); }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Fixed Action Bar for Mobile */}
                    <div className="fixed bottom-0 left-0 w-full p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-50">
                        <div className="max-w-2xl mx-auto flex gap-4">
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="btn btn-ghost flex-1 rounded-2xl text-slate-500 font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={processing}
                                className="btn  flex-1 rounded-2xl text-green-500 font-bold"
                            >
                                {processing ? <span className="loading loading-spinner"></span> : 'Save Record'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Sub-component for clean File Input (No logic change)
function FileUpload({ label, preview, onChange, onClear }) {
    return (
        <div className="bg-white/80 border border-slate-200 rounded-[2rem] p-5 shadow-sm">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 block text-center">{label}</label>
            {preview ? (
                <div className="relative h-32 rounded-2xl overflow-hidden group">
                    <img src={preview} className="w-full h-full object-cover" />
                    <button onClick={onClear} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-sm">
                        Replace Photo
                    </button>
                </div>
            ) : (
                <div className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 relative hover:bg-indigo-50/50 transition-all">
                    <span className="text-xs font-bold">Tap to Upload</span>
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={onChange} />
                </div>
            )}
        </div>
    );
}