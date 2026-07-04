'use client';

import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Card (impl spec §5): bg surface, radius 16, 1px hair border, default
 * padding 20, token shadow. `hover` → shadowLg + translateY(-1px) + pointer.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  pad?: number;
}

export function Card({ hover, pad = 20, className, style, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[16px] border border-hair bg-surface shadow transition-[box-shadow,transform] duration-150',
        hover && 'cursor-pointer hover:-translate-y-px hover:shadow-lg',
        className
      )}
      style={{ padding: pad, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
