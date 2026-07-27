import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from './card';

/**
 * TableShell (impl spec §21): Card pad 0 + header row (surface2, 40px,
 * SectionLabel-style headers with optional right-align / fixed width).
 */
export interface TableShellColumn {
  label: string;
  align?: 'start' | 'end';
  width?: number | string;
}

export function TableShell({
  columns,
  children,
  className,
}: {
  columns: TableShellColumn[];
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card pad={0} className={cn('overflow-hidden', className)}>
      <div className="flex h-10 items-center border-b border-hair bg-surface2 px-4">
        {columns.map((c, i) => (
          <div
            key={i}
            className={cn(
              'font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-ink3',
              c.align === 'end' ? 'text-end' : 'text-start',
              !c.width && 'flex-1'
            )}
            style={c.width ? { width: c.width, flexShrink: 0 } : undefined}
          >
            {c.label}
          </div>
        ))}
      </div>
      {children}
    </Card>
  );
}
