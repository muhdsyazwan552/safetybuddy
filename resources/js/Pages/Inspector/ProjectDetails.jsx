// Project page of the inspector: the same page as the manager's, plus the shortcuts to start work.
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Plus, HardHat } from 'lucide-react';
import InspectorLayout from '@/Layouts/InspectorLayout';
import { ProjectDetail } from '@/Pages/Review/ProjectShow';

export default function ProjectDetails({ user, ...props }) {
    return (
        <InspectorLayout user={user}>
            <Head title={`Project: ${props.project.name}`} />
            <ProjectDetail
                {...props}
                backHref="/inspector/projects"
                hrefs={{
                    visit: (v) => `/inspector/visits/${v.key}`,
                    case: null, // inspectors have no NC / CC page
                    subcon: (c) => `/inspector/subcon-companies/${c.id}`,
                }}
                heroExtra={(
                    <div className="mt-5 flex gap-2">
                        <Link href="/inspector/visits/create" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-brand-500 px-4 py-2.5 text-sm font-extrabold text-ink-900 transition active:scale-95">
                            <Plus className="h-4 w-4" strokeWidth={3} /> New visit
                        </Link>
                        <Link href="/inspector/toolbox-talks/create" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition active:scale-95">
                            <HardHat className="h-4 w-4 text-brand-400" /> Toolbox talk
                        </Link>
                    </div>
                )}
            />
        </InspectorLayout>
    );
}