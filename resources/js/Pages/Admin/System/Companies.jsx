import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowRight, Building2, Search } from 'lucide-react';
import SystemAdminLayout, { AdminStatCard } from '@/Layouts/SystemAdminLayout';
import { StatusBadge } from './companyUi';

export default function Companies({ title, companies, accountTypes, filters, totalCompanies }) {
  const [search, setSearch] = useState(filters.search || '');
  const [type, setType] = useState(filters.type || '');
  const applyFilters = (event) => {
    event.preventDefault();
    router.get('/admin/companies', { search: search.trim() || undefined, type: type || undefined }, { preserveState: true, replace: true });
  };

  return <><Head title={title} /><SystemAdminLayout title={title} description="Company profiles, administrators, account types, and subscription coverage.">
    <div className="grid gap-4 sm:grid-cols-2"><AdminStatCard label="All companies" value={totalCompanies} /><AdminStatCard label="Matching results" value={companies.total} /></div>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold text-ink-900">Company directory</h2><p className="mt-1 text-sm text-ink-500">Select a company to see its full record and subscription history.</p></div><span className="rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-500">{companies.total} results</span></div>
        <form onSubmit={applyFilters} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1"><span className="sr-only">Search companies or administrators</span><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search company, code, email or admin" className="w-full rounded-xl border-slate-200 py-2.5 pl-10 pr-3 text-sm focus:border-brand-500 focus:ring-brand-500" /></label>
          <label><span className="sr-only">Account type</span><select value={type} onChange={event => setType(event.target.value)} className="w-full rounded-xl border-slate-200 py-2.5 text-sm focus:border-brand-500 focus:ring-brand-500 sm:w-52"><option value="">All account types</option>{accountTypes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <button type="submit" className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-700">Search</button>
          {(filters.search || filters.type) && <Link href="/admin/companies" className="rounded-xl border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold text-ink-600 hover:bg-slate-50">Clear</Link>}
        </form>
      </div>
      <div className="overflow-x-auto"><table className="min-w-[950px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-ink-400"><tr><th className="px-5 py-3">#</th><th className="px-5 py-3">Company</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Company admin</th><th className="px-5 py-3">Subscription</th><th className="px-5 py-3">Subscription status</th><th className="px-5 py-3"><span className="sr-only">Details</span></th></tr></thead><tbody className="divide-y divide-slate-100">{companies.data.map((company, index) => <tr key={company.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 text-ink-400">{companies.from + index}</td>
        <td className="px-5 py-4"><div className="flex items-center gap-3">{company.logo_url ? <img src={company.logo_url} alt="" className="h-10 w-10 rounded-xl border border-slate-200 object-contain" /> : <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-50 text-ink-500"><Building2 size={19} /></span>}<div><Link href={`/admin/companies/${company.id}`} className="font-bold text-ink-900 hover:underline">{company.name}</Link><p className="mt-0.5 text-xs text-ink-400">{company.code || `#${company.id}`}{company.email ? ` · ${company.email}` : ''}</p></div></div></td>
        <td className="px-5 py-4"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-900">{company.account_type}</span>{company.training_provider && <p className="mt-2 text-xs text-ink-400">Via {company.training_provider}</p>}</td>
        <td className="px-5 py-4">{company.admins.length ? <><p className="font-medium text-ink-800">{company.admins[0].name}</p><p className="text-xs text-ink-400">{company.admins[0].email}</p>{company.admins.length > 1 && <p className="mt-1 text-xs text-ink-400">+{company.admins.length - 1} more</p>}</> : <span className="text-ink-400">No admin assigned</span>}</td>
        <td className="px-5 py-4">{company.subscription ? <><p className="font-semibold text-ink-800">{company.subscription.plan || company.subscription.module}</p><p className="mt-0.5 text-xs text-ink-400">{company.subscription.end_date ? `Ends ${company.subscription.end_date}` : 'No end date'} · {company.subscription_count} record{company.subscription_count === 1 ? '' : 's'}</p></> : <span className="text-ink-400">No subscription</span>}</td>
        <td className="px-5 py-4"><StatusBadge status={company.subscription?.display_status || 'none'} /></td>
        <td className="px-5 py-4 text-right"><Link href={`/admin/companies/${company.id}`} aria-label={`View ${company.name}`} className="inline-flex rounded-lg p-2 text-ink-500 hover:bg-brand-50 hover:text-ink-900"><ArrowRight size={18} /></Link></td>
      </tr>)}{!companies.data.length && <tr><td colSpan="7" className="px-5 py-14 text-center text-sm text-ink-500">No companies match your search.</td></tr>}</tbody></table></div>
      {companies.last_page > 1 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm"><span className="text-ink-500">Showing {companies.from}–{companies.to} of {companies.total}</span><div className="flex gap-2"><Link href={companies.prev_page_url || '#'} aria-disabled={!companies.prev_page_url} className={`rounded-lg border px-3 py-2 ${companies.prev_page_url ? 'border-slate-200 text-ink-700 hover:bg-slate-50' : 'pointer-events-none border-slate-100 text-slate-300'}`}>Previous</Link><Link href={companies.next_page_url || '#'} aria-disabled={!companies.next_page_url} className={`rounded-lg border px-3 py-2 ${companies.next_page_url ? 'border-slate-200 text-ink-700 hover:bg-slate-50' : 'pointer-events-none border-slate-100 text-slate-300'}`}>Next</Link></div></div>}
    </section>
  </SystemAdminLayout></>;
}
