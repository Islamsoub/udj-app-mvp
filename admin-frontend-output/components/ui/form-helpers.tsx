import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Form helpers (impl spec §6):
 * FRow — grid, `cols` columns (default 2), gap 14, margin-bottom 14.
 * FField — label 12.5/600 ink2 (+ red * when required); error 11.5 danger or
 * hint 11.5 ink3 below.
 */
export function FRow({ cols = 2, children, className }: { cols?: number; children: ReactNode; className?: string }) {
  return (
    <div
      className={cn('mb-[14px] grid gap-[14px]', className)}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {children}
    </div>
  );
}

export function FField({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-[7px] block text-[12.5px] font-semibold text-ink2">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      {children}
      {error ? (
        <div className="mt-[5px] text-[11.5px] text-danger">{error}</div>
      ) : hint ? (
        <div className="mt-[5px] text-[11.5px] text-ink3">{hint}</div>
      ) : null}
    </div>
  );
}
