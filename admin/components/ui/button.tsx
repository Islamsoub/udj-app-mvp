'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Btn (impl spec §5). Base: inline-flex, gap 7, radius 10, 1px transparent
 * border, weight 600, transition all .15s, disabled → 0.5 opacity.
 * Sizes: sm 7×12/12.5 · md 9×16/13.5 · lg 12×22/15.
 */
const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-[7px] rounded-[10px] border border-transparent font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      kind: {
        primary:
          'bg-jade text-white shadow-[0_1px_2px_rgba(15,110,86,0.25)] hover:bg-jade6 hover:shadow-none',
        ghost: 'border-hair2 bg-transparent text-ink hover:bg-sunken',
        soft: 'bg-jade-faint text-jade-text hover:bg-jade-faint2',
        danger: 'bg-danger-bg text-danger hover:bg-danger hover:text-white',
        dangerSolid: 'bg-danger text-white hover:bg-[#c43a30]',
        quiet: 'bg-transparent text-ink2 hover:bg-sunken',
      },
      size: {
        sm: 'px-3 py-[7px] text-[12.5px]',
        md: 'px-4 py-[9px] text-[13.5px]',
        lg: 'px-[22px] py-3 text-[15px]',
      },
    },
    defaultVariants: {
      kind: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Leading icon node (already sized: 15 for sm, 17 for md/lg). */
  icon?: ReactNode;
  /** Trailing icon node. */
  iconR?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, kind, size, icon, iconR, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ kind, size }), className)}
      {...props}
    >
      {icon}
      {children}
      {iconR}
    </button>
  )
);
Button.displayName = 'Button';
