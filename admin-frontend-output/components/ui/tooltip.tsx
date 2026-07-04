'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Minimal hover tooltip (FR locale chip, "soon" buttons). */
export function Tooltip({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <span
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className="pointer-events-none absolute bottom-full left-1/2 z-[70] mb-[6px] w-max max-w-[240px] -translate-x-1/2 rounded-[8px] px-[10px] py-[6px] text-[11.5px] font-medium text-white"
          style={{ background: '#1C2320', boxShadow: 'var(--shadow-lg)' }}
          role="tooltip"
        >
          {label}
        </span>
      )}
    </span>
  );
}
