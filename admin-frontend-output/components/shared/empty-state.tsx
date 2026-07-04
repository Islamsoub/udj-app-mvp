import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Empty state: centered icon tile + message + optional action (supplement §13). */
export function EmptyState({
  icon,
  message,
  action,
  className,
}: {
  icon: ReactNode;
  message: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
      <span className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-surface2 text-ink3">
        {icon}
      </span>
      <div className="max-w-[42ch] text-[13.5px] text-ink2">{message}</div>
      {action}
    </div>
  );
}
