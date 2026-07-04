'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Menu — context "…" menu (impl spec §6). Quiet icon trigger opens an absolute
 * popover (min-width 190, radius 11, shadowLg, +4px below, right-aligned by
 * default). Items {icon, label, onClick, tone} or {divider}. tone 'danger' →
 * danger text + dangerBg hover. Stops click propagation so row clicks don't
 * fire. Closes on outside mousedown.
 */
export type MenuItem =
  | { divider: true }
  | { divider?: false; icon?: ReactNode; label: string; onClick: () => void; tone?: 'danger' };

export interface MenuProps {
  items: MenuItem[];
  trigger?: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Menu({ items, trigger, align = 'right', className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={cn('relative inline-block', className)}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[9px] border-0 bg-transparent text-ink2 transition-colors hover:bg-sunken"
        aria-label="Actions"
      >
        {trigger ?? <MoreHorizontal size={17} />}
      </button>
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[190px] rounded-[11px] border border-hair bg-surface py-[5px] shadow-lg',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="my-[5px] border-t border-hair" />
            ) : (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-[9px] border-0 bg-transparent px-[13px] py-[8px] text-left text-[13.5px] transition-colors',
                  item.tone === 'danger'
                    ? 'text-danger hover:bg-danger-bg'
                    : 'text-ink hover:bg-surface2'
                )}
              >
                {item.icon}
                {item.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
