import { cn } from '@/lib/utils';
import { initials } from '@/lib/utils';
import { TONE_COLORS, type Tone } from '@/lib/tokens';

/**
 * Avatar (impl spec §5): circular initials, default size 36, font = size×0.4,
 * weight 700. Default jadeFaint/jadeText; `tone` → solid bg + white text.
 * `ring` → double ring 0 0 0 2px surface, 0 0 0 4px jadeFaint.
 */
export interface AvatarProps {
  name: string;
  size?: number;
  tone?: Tone;
  ring?: boolean;
  className?: string;
}

export function Avatar({ name, size = 36, tone, ring, className }: AvatarProps) {
  const solid = tone ? TONE_COLORS[tone][0] : null;
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold', className)}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: solid ?? 'var(--jade-faint)',
        color: solid ? '#fff' : 'var(--jade-text)',
        boxShadow: ring ? '0 0 0 2px var(--surface), 0 0 0 4px var(--jade-faint)' : undefined,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
