'use client';

import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

type LockTone = 'jade' | 'amber';

interface LockReasonProps {
  /** Explanation of why the section is locked. */
  text: string;
  /** jade = published/final, amber = in-progress. Tints the background + icon. */
  tone?: LockTone;
  /** Optional escape hatch shown on the end side (e.g. open a correction modal). */
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * LockReason — shared "read-only" vocabulary. A slim, full-width banner that
 * explains why a section is locked, with an optional escape-hatch action on the
 * end side. `tone` tints the background: jade for published/final results,
 * amber for in-progress locks. Generic on purpose — usable on any screen.
 *
 * NOTE: the amber tint uses the existing `amber-bg` token; there is no
 * `amber-faint` token in the theme.
 */
const TONE_BG: Record<LockTone, string> = {
  jade: 'bg-jade-faint',
  amber: 'bg-amber-bg',
};

const TONE_ICON: Record<LockTone, string> = {
  jade: 'text-jade-text',
  amber: 'text-amber',
};

export function LockReason({ text, tone = 'jade', action, className }: LockReasonProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-[10px] rounded-[10px] px-[14px] py-[9px]',
        TONE_BG[tone],
        className
      )}
    >
      <Lock size={14} strokeWidth={2} className={cn('shrink-0', TONE_ICON[tone])} />
      <span className="flex-1 text-[13px] text-ink2">{text}</span>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="shrink-0 cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-jade-text hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
