'use client';

import type { ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/tooltip';

interface LockedValueProps {
  children: ReactNode;
  /** Hover text explaining why the value is locked (e.g. "Notes CC publiées"). */
  tooltip?: string;
  /**
   * Escape hatch — when provided the locked value becomes clickable and calls
   * this (e.g. grade cells opening the correction modal). Without it the value
   * is inert and shows a not-allowed cursor.
   */
  onClickOverride?: () => void;
  className?: string;
}

/**
 * LockedValue — shared "read-only" vocabulary. Wraps a value in a consistent
 * locked treatment: sunken fill, a lock glyph, and a not-allowed cursor. Pass
 * `tooltip` to explain the lock on hover and `onClickOverride` to keep an
 * escape hatch. Generic on purpose — usable on any screen (grades today,
 * others later).
 */
export function LockedValue({ children, tooltip, onClickOverride, className }: LockedValueProps) {
  const interactive = !!onClickOverride;

  const base = cn(
    'inline-flex items-center justify-center gap-[5px] rounded-[9px] border border-transparent bg-sunken px-[10px] py-[6px] text-ink2',
    interactive ? 'cursor-pointer hover:bg-hair2' : 'cursor-not-allowed',
    className
  );

  const inner = interactive ? (
    <button type="button" onClick={onClickOverride} className={base}>
      {children}
      <Lock size={12} strokeWidth={2} className="text-ink3" />
    </button>
  ) : (
    <div className={base}>
      {children}
      <Lock size={12} strokeWidth={2} className="text-ink3" />
    </div>
  );

  if (!tooltip) return inner;
  return <Tooltip label={tooltip}>{inner}</Tooltip>;
}
