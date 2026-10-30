// resources/js/Pages/SubconPublic/CaseDetail.jsx
// One NC / CC case for the team leader: full detail and the reply box.
import React from 'react';
import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import Toast from '@/Components/Toast';
import CaseCard from '@/Components/shared/CaseCard';
import ReviewProgress from '@/Components/shared/ReviewProgress';
import { ReplyBox } from './Components/CasesPanel';

export default function CaseDetail({ company, item, public_token, leader_key }) {
    const kind = item.type === 'nc' ? 'Non-conformance' : 'Client complaint';

    return (
        <>
            <Head title={`${kind} #${item.id}`} />
            <Toast />
            <div className="min-h-screen bg-gray-100 pb-16">
                <header className="sticky top-0 z-40 bg-ink-900 text-white shadow-md">
                    <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
                        <a href={`/subcon/${public_token}/leader/${leader_key}`} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10" aria-label="Back to company page">
                            <ArrowLeft className="h-5 w-5" />
                        </a>
                        <div className="min-w-0 leading-tight">
                            <p className="truncate text-[15px] font-extrabold">{item.series_code || `${kind} #${item.id}`}</p>
                            <p className="truncate text-[11px] font-semibold text-brand-400">{company.name}{company.code ? ` · ${company.code}` : ''}</p>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-3xl space-y-4 px-4 py-4">
                    <CaseCard item={item}>
                        <ReviewProgress kind="case" record={item} className="mb-3" />
                        <ReplyBox item={item} publicToken={public_token} leaderKey={leader_key} />
                    </CaseCard>
                </main>
            </div>
        </>
    );
}
