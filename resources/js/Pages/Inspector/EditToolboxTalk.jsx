// resources/js/Pages/Inspector/EditToolboxTalk.jsx
import React from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import ToolboxTalkForm from '@/Components/inspector/ToolboxTalkForm';
import { storageUrl } from '@/Components/inspector/kit';

export default function EditToolboxTalk({ toolboxTalk, projects = [], topics = [], user }) {
    const { errors } = usePage().props;
    const conducted = toolboxTalk.conducted === 'yes';

    const submit = (payload, { setSaving }) => {
        router.post(
            `/inspector/toolbox-talks/${toolboxTalk.id}`,
            { ...payload, _method: 'put' },
            { forceFormData: true, onFinish: () => setSaving(false) },
        );
    };

    return (
        <InspectorLayout user={user}>
            <Head title="Edit Toolbox Talk" />
            <div className="mx-auto max-w-2xl px-4 pt-5 sm:px-6">
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand-800">Toolbox talk #{toolboxTalk.id}</p>
                <h1 className="text-2xl font-extrabold text-gray-900">Edit toolbox talk</h1>
            </div>
            <ToolboxTalkForm
                projects={projects.map((p) => ({ id: p.id, name: p.name }))}
                topics={topics}
                initial={{
                    project_id: toolboxTalk.project_id,
                    inspection_date: (toolboxTalk.inspection_date || '').slice(0, 10),
                    is_conducted: conducted ? 1 : 0,
                    total_attended: toolboxTalk.total_attended || '',
                    topics: (toolboxTalk.topics || []).map((t) => t.id),
                }}
                conductor={user?.staff_name || user?.name}
                existingImages={{
                    img_group: toolboxTalk.img_group ? storageUrl(toolboxTalk.img_group) : null,
                    img_attendance: toolboxTalk.img_attendance ? storageUrl(toolboxTalk.img_attendance) : null,
                }}
                serverErrors={errors || {}}
                submitLabel="Save changes"
                onSubmit={submit}
            />
        </InspectorLayout>
    );
}
