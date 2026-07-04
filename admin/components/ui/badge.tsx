import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { TONE_COLORS, type Tone } from '@/lib/tokens';

/**
 * Badge (impl spec §5): pill radius 9999, padding 3px 9px, font 11.5/600.
 * Tones map to [fg, bg]; soft=false → transparent bg + fg33 border.
 * Optional leading 6px dot.
 */
export interface BadgeProps {
  tone?: Tone;
  dot?: boolean;
  soft?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'jade', dot = false, soft = true, className, children }: BadgeProps) {
  const [fg, bg] = TONE_COLORS[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[5px] whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11.5px] font-semibold',
        className
      )}
      style={
        soft
          ? { color: fg, background: bg }
          : { color: fg, background: 'transparent', border: `1px solid ${fg}33` }
      }
    >
      {dot && <span className="h-[6px] w-[6px] rounded-full" style={{ background: 'currentColor' }} />}
      {children}
    </span>
  );
}
