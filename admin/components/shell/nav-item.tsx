'use client';

import Link from 'next/link';
import { cloneElement, isValidElement, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Sidebar NavItem (impl spec §7): padding 9×12, radius 10, gap 11.
 * Active: rgba(29,158,117,0.18) fill + 3.5px jade accent bar (left −10,
 * inset 8) + white icon/label (700, strokeWidth 1.9). Idle: sideMuted icon
 * (strokeWidth 1.7), sideText 500;
 * hover rgba(255,255,255,0.05).
 */
export interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  active: boolean;
  badge?: number;
}

export function NavItem({ href, icon, label, active, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'relative flex items-center gap-[11px] rounded-[10px] px-3 py-[9px] text-[13.5px] no-underline transition-colors duration-150',
        active ? 'font-bold text-white' : 'font-medium hover:bg-[rgba(255,255,255,0.05)]'
      )}
      style={{
        background: active ? 'rgba(29,158,117,0.18)' : undefined,
        color: active ? '#fff' : 'var(--side-text)',
      }}
    >
      {active && (
        <span
          className="absolute rounded-full"
          style={{ left: -10, top: 8, bottom: 8, width: 3.5, background: 'var(--jade)' }}
        />
      )}
      <span style={{ color: active ? '#fff' : 'var(--side-muted)' }} className="flex shrink-0">
        {active && isValidElement<{ strokeWidth?: number }>(icon)
          ? cloneElement(icon, { strokeWidth: 1.9 })
          : icon}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {badge != null && badge > 0 && (
        <span className="rounded-full bg-jade px-[7px] py-[1px] font-mono text-[11px] font-medium text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}
