import React, { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Save, Loader2 } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import InspectionFields from '@/Components/inspector/InspectionFields';
import { ActionBar, ghostBtn, primaryBtn, parsePhotos, storageUrl } from '@/Components/inspector/kit';

export default function EditInspection({ inspection, projects = [], subconCompanies = [], categories = [], evaluations = [], user }) {
    const [item, setItem] = useState({
        project_id: inspection.project_id ?? '',
        subcon_company_id: inspection.subcon_company_id ?? '',
        category_id: inspection.topic?.inspection_category_id ?? '',
        topic_id: inspection.topic_inspection_id ?? '',
        evaluation: inspection.evaluation ?? '',
        inspection_date: (inspection.inspection_date || '').slice(0, 10),
        location: inspection.location ?? '',
        description: inspection.description ?? '',
    });
    const [photos, setPhotos] = useState([]); // { file, preview }
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const subcons = useMemo(() => {
        const p = projects.find((x) => String(x.id) === String(item.project_id));
        const list = p?.subcon_companies || [];
        // make sure the currently selected company is always selectable
        const current = subconCompanies.find((c) => String(c.id) === String(item.subcon_company_id));
        return current && !list.some((c) => c.id === current.id) ? [...list, current] : list;
    }, [projects, subconCompanies, item.project_id, item.subcon_company_id]);

    const change = (field, value) => {
        setItem((s) => ({ ...s, [field]: value }));
        if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
    };

    const pick = (fileList) => {
        const files = Array.from(fileList || []).filter((f) => f.size <= 2 * 1024 * 1024);
        setPhotos((p) => [...p, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
    };

    const save = () => {
        const e = {};
        ['project_id', 'evaluation', 'inspection_date'].forEach((k) => { if (!String(item[k] || '').trim()) e[k] = 'Required'; });
        if (item.evaluation && item.evaluation !== 'good') {
            if (!item.description.trim()) e.description = 'Notes / observations are required.';
            if (photos.length === 0 && parsePhotos(inspection.photo).length === 0) e.photos = 'Add at least one evidence photo.';
        }
        if (Object.keys(e).length) { setErrors(e); return; }

        setSaving(true);
        router.post(
            `/inspector/inspections/${inspection.id}`,
            {
                _method: 'put',
                project_id: item.project_id,
                subcon_company_id: item.subcon_company_id || '',
                topic_inspection_id: item.topic_id || '',
                evaluation: item.evaluation,
                inspection_date: item.inspection_date,
                location: item.location || '',
                description: item.description || '',
                photos: photos.map((p) => p.file),
            },
            {
                forceFormData: true,
                onError: (errs) => {
                    setErrors({ ...errs, topic_id: errs.topic_inspection_id });
                    setSaving(false);
                },
                onFinish: () => setSaving(false),
            },
        );
    };

    return (
        <InspectorLayout user={user}>
            <Head title="Edit Inspection" />

            <div className="mx-auto max-w-2xl px-4 pb-32 pt-5 sm:px-6 lg:pb-32">
                <div className="mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-brand-800">Inspection #{inspection.id}</p>
                    <h1 className="text-2xl font-extrabold text-gray-900">Edit inspection</h1>
                </div>

                <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                    <InspectionFields
                        item={item}
                        onChange={change}
                        projects={projects}
                        subcons={subcons}
                        categories={categories}
                        evaluations={evaluations.length ? evaluations : undefined}
                        errors={errors}
                        existingPhotos={parsePhotos(inspection.photo).map(storageUrl)}
                        newPhotos={photos.map((p) => ({ preview: p.preview }))}
                        onPickPhotos={pick}
                        onRemovePhoto={(idx) => setPhotos((p) => p.filter((_, i) => i !== idx))}
                    />
                </div>
            </div>

            <ActionBar>
                <button type="button" onClick={() => window.history.back()} disabled={saving} className={ghostBtn}>Cancel</button>
                <button type="button" onClick={save} disabled={saving} className={primaryBtn}>
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : <><Save className="h-4 w-4" /> Save changes</>}
                </button>
            </ActionBar>
        </InspectorLayout>
    );
}
