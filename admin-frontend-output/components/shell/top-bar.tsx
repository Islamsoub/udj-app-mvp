'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun } from 'lucide-react';
import { GlobalSearch } from './global-search';
import { BellMenu } from './bell-menu';
import { AvatarMenu } from './avatar-menu';
import { Tooltip } from '@/components/ui/tooltip';
import { crumbsFor } from '@/lib/constants';

/**
 * TopBar (impl spec §7): 64px, sticky, bg surface. Left: breadcrumb trail
 * (last crumb 700 ink, earlier crumbs ink3 clickable). Right: GlobalSearch +
 * FR locale chip (decorative, tooltip) + BellMenu + AvatarMenu.
 */
export function TopBar() {
  const pathname = usePathname();
  const crumbs = crumbsFor(pathname);

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-hair bg-surface px-8">
      <nav className="flex items-center gap-[7px] text-[13.5px]" aria-label="Fil d'Ariane">
        {crumbs.map((c, i) => {
          const last = i === crumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-[7px]">
              {c.href && !last ? (
                <Link href={c.href} className="text-ink3 no-underline transition-colors hover:text-ink2">
                  {c.label}
                </Link>
              ) : (
                <span className={last ? 'font-bold text-ink' : 'text-ink3'}>{c.label}</span>
              )}
              {!last && <span className="text-ink3">›</span>}
            </span>
          );
        })}
      </nav>
      <div className="flex items-center gap-3">
        <GlobalSearch />
        <Tooltip label="Portail disponible en français uniquement">
          <span className="flex cursor-default items-center gap-[6px] rounded-full border border-hair2 px-[11px] py-[6px] text-[12px] font-bold text-ink2">
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
