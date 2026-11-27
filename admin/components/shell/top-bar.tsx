'use client';

import type { RefObject } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Menu, Sun } from 'lucide-react';
import { GlobalSearch } from './global-search';
import { BellMenu } from './bell-menu';
import { AvatarMenu } from './avatar-menu';
import { Tooltip } from '@/components/ui/tooltip';
import { crumbsFor } from '@/lib/constants';
import { cn } from '@/lib/utils';

/**
 * TopBar (impl spec §7): 64px, sticky, bg surface. Left: breadcrumb trail
 * (last crumb 700 ink, earlier crumbs ink3 clickable). Right: GlobalSearch +
 * FR locale chip (decorative, tooltip) + BellMenu + AvatarMenu.
 *
 * Below 1024px: a menu button opens the sidebar panel, the search is an icon
 * (GlobalSearch), and the trail keeps to one line — below 768px only the page
 * title is shown, truncated. The right cluster never shrinks, so FR, the bell
 * and the avatar always stay inside the window; the trail gives way instead.
 */
export function TopBar({
  menuButtonRef,
  navOpen,
  navId,
  onMenu,
}: {
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  navOpen: boolean;
  navId: string;
  onMenu: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const baseCrumbs = crumbsFor(pathname);
  // /news/create is reused for editing (with ?id=). The static crumb map
  // always says "Nouvel article", so override the last crumb in edit mode.
  // Derive a new array — never mutate crumbsFor's shared static trail.
  const crumbs =
    pathname.startsWith('/news/create') && searchParams.get('id')
      ? baseCrumbs.map((c, i) =>
          i === baseCrumbs.length - 1 ? { ...c, label: 'Modifier' } : c
        )
      : baseCrumbs;

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-hair bg-surface px-4 md:px-6 lg:px-8">
      <button
        ref={menuButtonRef}
        type="button"
        onClick={onMenu}
        className="-ml-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent text-ink2 transition-colors hover:bg-sunken lg:hidden"
        aria-label="Ouvrir le menu"
        aria-expanded={navOpen}
        aria-controls={navId}
      >
        <Menu size={20} strokeWidth={1.7} />
      </button>
      <nav
        className="flex min-w-0 flex-1 items-center gap-[7px] overflow-hidden whitespace-nowrap text-[13.5px]"
        aria-label="Fil d'Ariane"
      >
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={i} className={cn('flex items-center gap-[7px]', last ? 'min-w-0' : 'max-md:hidden')}>
              {c.href && !last ? (
                <Link href={c.href} className="text-ink3 no-underline transition-colors hover:text-ink2">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? 'truncate font-bold text-ink' : 'text-ink3'}>{c.label}</span>
              )}
              {!last && <span className="text-ink3">›</span>}
            </span>
          );
        })}
      </nav>
      <div className="flex shrink-0 items-center gap-2 lg:gap-3">
        <GlobalSearch />
        <Tooltip label="Portail disponible en français uniquement">
          {/* Static indicator, not a control — no border, so it reads as a label. */}
          <span className="flex cursor-default items-center gap-[6px] rounded-full bg-surface2 px-[11px] py-[6px] text-[12px] font-bold text-ink2">
            <Sun size={14} className="text-amber" />
            FR
          </span>
        </Tooltip>
        <BellMenu />
        <AvatarMenu />
      </div>
    </header>
  );
}
