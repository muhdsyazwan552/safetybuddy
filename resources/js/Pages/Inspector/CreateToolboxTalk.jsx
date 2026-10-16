// resources/js/Pages/Inspector/CreateToolboxTalk.jsx
import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import ToolboxTalkForm from '@/Components/inspector/ToolboxTalkForm';

export default function CreateToolboxTalk({ projects = [], categories = [], staffByProject = {}, user }) {
    const { errors } = usePage().props;

    // `projects` are project-assignment rows: { project: { id, name } }
    const projectOptions = projects
        .map((p) => p.project || p)
        .filter(Boolean)
        .map((p) => ({ id: p.id, name: p.name }));

    const submit = (payload, { setSaving }) => {
        router.post('/inspector/toolbox-talks/post', payload, {
            forceFormData: true,
            onFinish: () => setSaving(false),
        });
    };

    return (
        <InspectorLayout user={user}>
            <Head title="New Toolbox Talk" />
            <div className="mx-auto max-w-2xl px-4 pt-5 sm:px-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-800">Daily safety record</p>
                <h1 className="text-2xl font-extrabold text-gray-900">New toolbox talk</h1>
            </div>
            <ToolboxTalkForm
                projects={projectOptions}
                topics={categories}
                initial={{}}
                staffByProject={staffByProject}
                conductor={user?.staff_name || user?.name}
                serverErrors={errors || {}}
                submitLabel="Save record"
                onSubmit={submit}
            />
        </InspectorLayout>
    );
}
