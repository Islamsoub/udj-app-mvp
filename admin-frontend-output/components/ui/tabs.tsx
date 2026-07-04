'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE_COLORS, type Tone } from '@/lib/tokens';

/**
 * Segmented tabs with optional counts (used by students filter, attendance
 * queue, news list, academics…). Active segment → jadeFaint bg + jadeText 700
 * (or a per-tab tone, e.g. amber for "En attente").
 */
export interface TabItem<K extends string = string> {
  key: K;
  label: string;
  count?: number;
  tone?: Tone;
}

export interface TabsProps<K extends string = string> {
  tabs: TabItem<K>[];
  active: K;
  onChange: (key: K) => void;
  className?: string;
}

export function Tabs<K extends string = string>({ tabs, active, onChange, className }: TabsProps<K>) {
  return (
    <div className={cn('flex items-center gap-[6px]', className)}>
      {tabs.map((t) => {
        const isActive = t.key === active;
        const tone = t.tone ?? 'jade';
        const [fg, bg] = TONE_COLORS[tone];
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            className={cn(
              'flex cursor-pointer items-center gap-[7px] rounded-[9px] border-0 px-[13px] py-[7px] text-[13px] transition-colors',
              isActive ? 'font-bold' : 'bg-transparent font-medium text-ink2 hover:bg-sunken'
            )}
            style={isActive ? { background: bg, color: fg } : undefined}
          >
            {t.label}
            {t.count != null && (
              <span
                className={cn('font-mono text-[11px]', isActive ? '' : 'text-ink3')}
                style={isActive ? { color: fg } : undefined}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Filter pills row (programme/faculty filters — schedule, academics). */
export function PillFilter({
  options,
  active,
  onChange,
  className,
}: {
  options: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-center gap-[6px]', className)}>
      {options.map((o) => {
        const isActive = o.key === active;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              'cursor-pointer rounded-full border px-[13px] py-[6px] text-[12.5px] font-semibold transition-colors',
              isActive
                ? 'border-transparent bg-jade text-white'
                : 'border-hair2 bg-surface text-ink2 hover:bg-sunken'
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Chip container helper. */
export function Chip({ children, onRemove }: { children: ReactNode; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-[6px] rounded-full bg-jade-faint px-[10px] py-[4px] text-[12.5px] font-semibold text-jade-text">
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="cursor-pointer border-0 bg-transparent p-0 text-jade-text hover:text-danger"
          aria-label="Retirer"
        >
          ×
        </button>
      )}
    </span>
  );
}
