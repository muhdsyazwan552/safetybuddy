import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { Building2, ChevronDown, ClipboardCheck, CreditCard, LayoutDashboard, LogOut, Menu, Package, PanelLeftClose, PanelLeftOpen, ShieldCheck, UserPlus, Users, UsersRound, X } from 'lucide-react';
import { confirmLogout } from '@/Helpers/logout';

const links = [
  { label: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Companies', href: '/admin/companies', icon: Building2 },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard, children: [
    { label: 'Subscription approvals', href: '/admin/approvals', icon: ClipboardCheck },
  ] },
  { label: 'Slot orders', href: '/admin/slot-orders', icon: UserPlus },
  { label: 'Packages', href: '/admin/packages', icon: Package },
  { label: 'Training Providers', href: '/admin/training-providers', icon: UsersRound, children: [
    { label: 'Application approvals', href: '/admin/training-providers/approvals', icon: ClipboardCheck },
    { label: 'Activation code orders', href: '/admin/training-providers/orders', icon: Package },
  ] },
];

/** Red round number on a menu icon: how many items wait for the system admin there. */
function IconBadge({ count }) {
  if (!count) return null;
  return <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-ink-900" aria-label={`${count} waiting`}>{count > 99 ? '99+' : count}</span>;
}

export function AdminStatCard({ label, value }) {
  return <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
    <span className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-brand-100" aria-hidden="true" />
    <span className="mb-4 block h-1 w-8 rounded-full bg-brand-500" aria-hidden="true" />
    <p className="relative text-xs font-semibold uppercase tracking-[0.1em] text-ink-500">{label}</p>
    <p className="relative mt-2 text-3xl font-bold tracking-tight text-ink-900">{value}</p>
  </div>;
}

export default function SystemAdminLayout({ title, description, children, width = 'max-w-7xl' }) {
  const { url, props } = usePage();
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.localStorage.getItem('system-admin-sidebar-collapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({});
  const pathname = url.split('?')[0];
  const badges = props?.adminBadges || {};
  const countFor = (item) => item.children ? item.children.reduce((sum, child) => sum + Number(badges[child.href] || 0), 0) : Number(badges[item.href] || 0);

  useEffect(() => {
    window.localStorage.setItem('system-admin-sidebar-collapsed', String(collapsed));
  }, [collapsed]);

  useEffect(() => { setMobileOpen(false); }, [url]);

  useEffect(() => {
    const group = links.find(item => item.children?.some(child => pathname === child.href || pathname.startsWith(`${child.href}/`)));
    if (group) setExpandedGroups(current => ({ ...current, [group.href]: true }));
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMobileOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', closeOnEscape); };
  }, [mobileOpen]);

  const navigation = (compact = false) => (
    <>
      <Link href="/admin/dashboard" className={`flex h-20 items-center border-b border-white/10 px-5 ${compact ? 'justify-center' : 'gap-3'}`} aria-label="Safety Buddy admin home">
        {compact ? <img src="/images/sbc-logo.png" alt="" className="h-11 w-11 rounded-full object-contain" /> : <img src="/images/sbc-header.png" alt="Safety Buddy" className="w-full max-w-[210px] object-contain" />}
      </Link>
      <div className="px-3 pt-7">
        {!compact && <p className="px-3 pb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Workspace</p>}
        <nav aria-label="System admin navigation" className="space-y-1.5">
          {links.map((item) => {
            const { label, href, icon: Icon, children } = item;
            const childActive = children?.some(child => pathname === child.href || pathname.startsWith(`${child.href}/`));
            const active = pathname === href || (pathname.startsWith(`${href}/`) && !childActive);
            const open = expandedGroups[href] ?? childActive;
            return <div key={href}>
              <div className="flex items-center gap-1">
                <Link href={href} title={compact ? label : undefined} aria-current={active ? 'page' : undefined} className={`flex min-h-11 min-w-0 flex-1 items-center rounded-xl text-sm font-semibold transition-colors ${compact ? 'justify-center px-2' : 'gap-3 px-3'} ${active ? 'bg-brand-500 text-ink-950 shadow-sm' : childActive ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                  <span className="relative shrink-0"><Icon size={19} strokeWidth={active ? 2.4 : 1.9} /><IconBadge count={countFor(item)} /></span>
                  {!compact && <span className="truncate">{label}</span>}
                </Link>
                {children && !compact && <button type="button" onClick={() => setExpandedGroups(current => ({ ...current, [href]: !open }))} aria-label={`${open ? 'Close' : 'Open'} ${label} submenu`} aria-expanded={Boolean(open)} className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"><ChevronDown size={17} className={`transition-transform ${open ? 'rotate-180' : ''}`} /></button>}
              </div>
              {children && open && !compact && <div className="ml-6 mt-1 space-y-1 border-l border-white/10 pl-3">{children.map(({ label: childLabel, href: childHref, icon: ChildIcon }) => {
                const selected = pathname === childHref || pathname.startsWith(`${childHref}/`);
                return <Link key={childHref} href={childHref} aria-current={selected ? 'page' : undefined} className={`flex min-h-10 items-center gap-2.5 rounded-lg px-3 text-xs font-semibold transition-colors ${selected ? 'bg-brand-500 text-ink-950' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}><span className="relative shrink-0"><ChildIcon size={15} /><IconBadge count={Number(badges[childHref] || 0)} /></span>{childLabel}</Link>;
              })}</div>}
            </div>;
          })}
        </nav>
      </div>
      <div className="mt-auto border-t border-white/10 p-3">
        {!compact && <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-xs text-slate-300"><ShieldCheck size={17} className="text-brand-400" /><span className="truncate">System administrator</span></div>}
        <button type="button" onClick={() => confirmLogout(route('system.admin.logout'))} title={compact ? 'Log out' : undefined} className={`flex w-full items-center rounded-xl py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white ${compact ? 'justify-center' : 'gap-3 px-3'}`}>
          <LogOut size={18} />{!compact && 'Log out'}
        </button>
      </div>
    </>
  );

  return <div className="min-h-screen bg-[#f5f6f8] text-ink-900 lg:flex">
    <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto bg-ink-900 transition-[width] duration-200 lg:flex ${collapsed ? 'w-0' : 'w-[260px]'}`}>{!collapsed && navigation()}</aside>
    {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" className="absolute inset-0 w-full bg-ink-950/70" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      <aside className="relative flex h-full w-[min(280px,85vw)] flex-col overflow-y-auto bg-ink-900 shadow-2xl">{navigation()}<button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="absolute right-2 top-5 rounded-lg p-2 text-white hover:bg-white/10"><X size={20} /></button></aside>
    </div>}
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-xl border border-slate-200 p-2.5 text-ink-700 hover:bg-slate-50 lg:hidden"><Menu size={20} /></button>
          <button type="button" onClick={() => setCollapsed(value => !value)} aria-label={collapsed ? 'Open sidebar' : 'Close sidebar'} aria-expanded={!collapsed} className="hidden rounded-xl border border-slate-200 p-2.5 text-ink-700 hover:bg-slate-50 lg:block">{collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}</button>
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">System admin</p><p className="truncate text-sm font-semibold text-ink-900">{title}</p></div>
        </div>
        <div className="flex items-center gap-3"><span className="hidden text-right sm:block"><span className="block max-w-40 truncate text-sm font-semibold">{props.auth?.user?.name || 'Administrator'}</span><span className="block text-xs text-ink-400">Administrator</span></span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-brand-400">{(props.auth?.user?.name || 'A').slice(0, 1).toUpperCase()}</span></div>
      </header>
      <main className={`mx-auto w-full ${width} space-y-6 px-4 py-7 sm:px-8 sm:py-9`}>
        <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Safety Buddy / Administration</p><h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm text-ink-500">{description}</p>}</div><span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-900">Admin workspace</span></div>
        {children}
      </main>
    </div>
  </div>;
}
