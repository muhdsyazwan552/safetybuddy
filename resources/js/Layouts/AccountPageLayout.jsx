import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import CompanyAvatar from '@/Components/CompanyAvatar';

export default function AccountPageLayout({ children }) {
  const { auth } = usePage().props;
  const user = auth?.user;

  return <div className="relative min-h-screen overflow-x-clip bg-[#F5F6F8] text-ink-950">
    <div className="pointer-events-none absolute -right-32 top-32 h-[34rem] w-[34rem] rounded-full bg-brand-100/70 blur-3xl" />
    <div className="pointer-events-none absolute -left-40 top-[38rem] h-[30rem] w-[30rem] rounded-full bg-white blur-3xl" />
    <header className="relative z-20 border-b border-ink-800 bg-ink-950 text-white shadow-xl shadow-ink-950/15">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-7 lg:px-10">
        <Link href="/profile#membership" className="inline-flex min-w-0 items-center gap-3"><img src="/images/sbc-logo.png" alt="" className="h-10 w-10 shrink-0 rounded-full ring-1 ring-brand-400/60" /><span className="truncate text-sm font-black tracking-[.12em] text-brand-400 sm:text-base">SAFETY BUDDY</span></Link>
        {user && <CompanyAvatar name={user.company?.name || user.name} logoUrl={user.company?.logo_url} className="h-10 w-10 text-sm ring-1 ring-brand-400/60" />}
      </div>
    </header>
    <main className="relative mx-auto w-full max-w-[1600px] px-4 py-7 sm:px-7 sm:py-10 lg:px-10">{children}</main>
  </div>;
}
