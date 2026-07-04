'use client';

import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

/**
 * Input / TextInput (impl spec §5–6). Width 100%, font 14, border 1px hair2,
 * radius 10, padding 10px 13px (padding-left 38 with a leading icon).
 * Focus → jade border + 0 0 0 3px jadeFaint ring (danger pair when error).
 * readOnly → surface2 bg, ink2 text, not-allowed. mono switches the font.
 */
export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  iconR?: ReactNode;
  error?: boolean;
  mono?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, icon, iconR, error, mono, readOnly, ...props }, ref) => (
    <div className="relative w-full">
      {icon && (
        <span className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-ink3">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        readOnly={readOnly}
        className={cn(
          'w-full rounded-[10px] border bg-surface px-[13px] py-[10px] text-[14px] text-ink outline-none transition-shadow placeholder:text-ink3',
          mono && 'font-mono text-[13px]',
          icon && 'pl-[38px]',
          iconR && 'pr-[38px]',
          error
            ? 'border-danger focus:shadow-[0_0_0_3px_var(--danger-bg)]'
            : 'border-hair2 focus:border-jade focus:shadow-[0_0_0_3px_var(--jade-faint)]',
          readOnly && 'cursor-not-allowed bg-surface2 text-ink2',
          className
        )}
        {...props}
      />
      {iconR && (
        <span className="absolute right-[12px] top-1/2 -translate-y-1/2 text-ink3">{iconR}</span>
      )}
    </div>
  )
);
TextInput.displayName = 'TextInput';

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full resize-y rounded-[10px] border bg-surface px-[13px] py-[10px] text-[14px] text-ink outline-none transition-shadow placeholder:text-ink3',
        error
          ? 'border-danger focus:shadow-[0_0_0_3px_var(--danger-bg)]'
          : 'border-hair2 focus:border-jade focus:shadow-[0_0_0_3px_var(--jade-faint)]',
        className
      )}
      {...props}
    />
  )
);
TextArea.displayName = 'TextArea';
