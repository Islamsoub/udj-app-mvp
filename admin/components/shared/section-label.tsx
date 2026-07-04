import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** SectionLabel (impl spec §5): mono eyebrow — 11px/500, 0.08em, uppercase, ink3. */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink3', className)}>
      {children}
    </div>
  );
}
