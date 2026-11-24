import BackLink from '@/Components/shared/BackLink';
import React from 'react';
import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AccountPageLayout from '@/Layouts/AccountPageLayout';
import { PlanOrder, RenewOrder } from './ProviderPackages';
import ProviderOrdersLog from './ProviderOrdersLog';

export default function ProviderPurchase({ plans = [], trainees = [], renewWindowDays = 90, counts = {}, orders = [] }) {
  const plan = plans[0];
  return <AccountPageLayout>
    <Head title="Purchase activation code"/>
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-ink-950">Purchase activation code</h1>
        <BackLink href="/training-provider/packages" className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-ink-900 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"><ArrowLeft className="h-4 w-4"/>Back</BackLink>
      </div>
      {plan ? <div className="mx-auto w-full max-w-3xl"><PlanOrder plan={plan} counts={counts}/></div> : <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">No package is available to buy yet.</p>}
      <ProviderOrdersLog orders={orders} renewal={false} title="Purchase activation code log"/>
    </div>
  </AccountPageLayout>;
}
