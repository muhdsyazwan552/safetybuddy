import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AccountPageLayout from '@/Layouts/AccountPageLayout';
import { PlanOrder, RenewOrder } from './ProviderPackages';
import ProviderOrdersLog from './ProviderOrdersLog';

export default function ProviderRenew({ plans = [], trainees = [], renewWindowDays = 90, counts = {}, orders = [] }) {
  const plan = plans[0];
  return <AccountPageLayout>
    <Head title="Renew a Participant"/>
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black tracking-tight text-ink-950">Renew a Participant</h1>
        <Link href="/training-provider/packages" className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-bold text-ink-900 shadow-sm transition hover:border-brand-400 hover:bg-brand-50"><ArrowLeft className="h-4 w-4"/>Back to Purchase</Link>
      </div>
      {plan ? <div className="mx-auto w-full max-w-3xl"><RenewOrder plan={plan} trainees={trainees} windowDays={renewWindowDays}/></div> : <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">No package is available to buy yet.</p>}
      <ProviderOrdersLog orders={orders} renewal={true} title="Renewal log"/>
    </div>
  </AccountPageLayout>;
}
