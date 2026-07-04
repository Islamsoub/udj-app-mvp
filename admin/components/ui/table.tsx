import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/** Base table primitives styled with tokens (rows hover to surface2). */
export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return <table className={cn('w-full border-collapse text-[13.5px]', className)}>{children}</table>;
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-surface2">{children}</thead>;
}

export function Th({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'whitespace-nowrap px-4 py-[10px] text-start font-mono text-[10.5px] font-medium uppercase tracking-[0.08em] text-ink3',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('border-t border-hair px-4 py-3 align-middle', className)} {...props}>
      {children}
    </td>
  );
}

export function TRow({
  children,
  onClick,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn('transition-colors hover:bg-surface2', onClick && 'cursor-pointer', className)}
    >
      {children}
    </tr>
  );
}
