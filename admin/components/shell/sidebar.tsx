'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bell,
  BookOpen,
  Calendar,
  CalendarCheck,
  GraduationCap,
  LayoutGrid,
  ListChecks,
  LogOut,
  Megaphone,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { NavItem } from './nav-item';
import { Avatar } from '@/components/shared/avatar';
import { useAdmin } from '@/hooks/use-admin';
import { useLogout } from '@/hooks/use-auth';
import { useAttendance } from '@/hooks/queries/use-attendance';
import { canAccess, type PageKey } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * Sidebar (impl spec §7): 248px, sticky full-height, bg #0A3D2E. Brand block,
 * nav groups (Main / Structure / Système, mono uppercase labels), pending
 * badge on Présence, user card at bottom. Items are RBAC-filtered.
 */
interface NavDef {
  page: PageKey;
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ICON = (node: React.ReactNode) => node;

const MAIN: NavDef[] = [
  { page: 'dashboard', href: '/', label: 'Tableau de bord', icon: ICON(<LayoutGrid size={20} strokeWidth={1.7} />) },
  { page: 'students', href: '/students', label: 'Étudiants', icon: ICON(<Users size={20} strokeWidth={1.7} />) },
  { page: 'grades', href: '/grades', label: 'Notes', icon: ICON(<GraduationCap size={20} strokeWidth={1.7} />) },
  { page: 'attendance', href: '/attendance', label: 'Présence', icon: ICON(<CalendarCheck size={20} strokeWidth={1.7} />) },
  { page: 'news', href: '/news', label: 'Actualités', icon: ICON(<Megaphone size={20} strokeWidth={1.7} />) },
];

const STRUCTURE: NavDef[] = [
  { page: 'schedule', href: '/schedule', label: 'Emploi du temps', icon: ICON(<Calendar size={20} strokeWidth={1.7} />) },
  { page: 'academics', href: '/academics', label: 'Académique', icon: ICON(<BookOpen size={20} strokeWidth={1.7} />) },
  { page: 'notifications', href: '/notifications', label: 'Notifications', icon: ICON(<Bell size={20} strokeWidth={1.7} />) },
];

const SYSTEME: NavDef[] = [
  { page: 'admins', href: '/admins', label: 'Administrateurs', icon: ICON(<Shield size={20} strokeWidth={1.7} />) },
  { page: 'audit', href: '/audit', label: "Journal d'audit", icon: ICON(<ListChecks size={20} strokeWidth={1.7} />) },
  { page: 'settings', href: '/settings', label: 'Paramètres', icon: ICON(<Settings size={20} strokeWidth={1.7} />) },
];

/** The panel's id, for the TopBar menu button's aria-controls. */
export const SIDEBAR_ID = 'admin-sidebar';

/**
 * `open` only matters below 1024px (`lg`), where the sidebar is a slide-in
 * panel over the page (app/(dashboard)/layout.tsx owns the state, the backdrop,
 * Esc and focus return). Closed there, it is `invisible` as well as off-screen,
 * so its links are out of the tab order. From `lg` up every `max-lg:` class
 * falls away and it is the sticky 248px column, unchanged.
 */
export function Sidebar({ open = false }: { open?: boolean }) {
  const pathname = usePathname();
  const asideRef = useRef<HTMLElement>(null);

  // Opening moves focus into the panel: the current page's link, else the first.
  useEffect(() => {
    if (!open) return;
    const root = asideRef.current;
    const target =
      root?.querySelector<HTMLElement>('a[aria-current="page"]') ?? root?.querySelector<HTMLElement>('a, button');
    target?.focus();
  }, [open]);
  const admin = useAdmin();
  const logout = useLogout();
  const { data: attendance } = useAttendance();
  const pending = attendance?.pendingJustifications ?? 0;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const visible = (items: NavDef[]) => items.filter((i) => canAccess(admin?.role, i.page));

  const renderGroup = (label: string | null, items: NavDef[]) => {
    const list = visible(items);
    if (list.length === 0) return null;
    return (
      <div className="mb-4">
        {label && (
          <div
            className="mb-[6px] px-3 font-mono text-[10px] uppercase tracking-[0.10em]"
            style={{ color: 'var(--side-muted)' }}
          >
            {label}
          </div>
        )}
        <div className="flex flex-col gap-[2px]">
          {list.map((i) => (
            <NavItem
              key={i.href}
              href={i.href}
              icon={i.icon}
              label={i.label}
              active={isActive(i.href)}
              badge={i.page === 'attendance' ? pending : undefined}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <aside
      ref={asideRef}
      id={SIDEBAR_ID}
      role={open ? 'dialog' : undefined}
      aria-modal={open ? true : undefined}
      aria-label={open ? 'Menu de navigation' : undefined}
      className={cn(
        'sticky top-0 flex h-screen w-[248px] shrink-0 flex-col px-[18px] py-5',
        'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:h-dvh max-lg:duration-200',
        // Opening transitions only the slide, so the panel is visible at once
        // and the focus effect below can land in it. Closing also transitions
        // visibility, which keeps it visible until the slide-out has finished.
        open
          ? 'max-lg:translate-x-0 max-lg:transition-transform'
          : 'max-lg:invisible max-lg:-translate-x-full max-lg:transition-[transform,visibility]'
      )}
      style={{ background: 'var(--side-bg)', boxShadow: 'var(--shadow-side)' }}
    >
      {/* Brand block */}
      <div className="mb-4 flex items-center gap-[10px] border-b pb-4" style={{ borderColor: 'var(--side-hair)' }}>
        {/* The landing page's icon, byte for byte (public/brand/). Square,
            gradient and corners come from the file. Decorative: "Unipocket"
            is written beside it. */}
        <img src="/brand/unipocket-icon.svg" alt="" width={34} height={34} className="block shrink-0" />
        <div>
          <div className="text-[15.5px] font-extrabold leading-tight text-white">Unipocket</div>
          <div className="font-mono text-[10px]" style={{ color: 'var(--side-muted)' }}>
            Admin · UDJ
          </div>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="min-h-0 flex-1 overflow-y-auto">
        {renderGroup(null, MAIN)}
        {renderGroup('Structure', STRUCTURE)}
        {renderGroup('Système', SYSTEME)}
      </nav>

      {/* User card */}
      {admin && (
        <div
          className="mt-3 flex items-center gap-[10px] rounded-[12px] p-[10px]"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          <Avatar name={admin.name} size={32} tone="jade" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12.5px] font-bold text-white">{admin.name}</div>
            <div className="truncate font-mono text-[10px] uppercase" style={{ color: 'var(--side-muted)' }}>
              {admin.role}
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent transition-colors hover:bg-[rgba(255,255,255,0.08)]"
            style={{ color: 'var(--side-muted)' }}
            aria-label="Se déconnecter"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </aside>
  );
}
