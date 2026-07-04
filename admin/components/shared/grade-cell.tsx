'use client';

import { forwardRef, type KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { gradeInputInvalid, sanitizeGradeInput } from '@/lib/grade-helpers';

/**
 * GradeCell (impl spec §16): 64×38 input, mono 14, centered. States:
 * normal (surface2, transparent border) · dirty (jadeFaint bg, jade border) ·
 * invalid (dangerBg, danger border + text). Focus selects all + ring. Input
 * sanitized to [0-9.]; invalid = NaN or <0 or >20. The dirty border persists
 * until the sticky save bar commits.
 */
export interface GradeCellProps {
  value: string;
  dirty: boolean;
  onChange: (value: string) => void;
  onNavigate?: (dir: 'up' | 'down' | 'left' | 'right') => void;
  'aria-label'?: string;
}

export const GradeCell = forwardRef<HTMLInputElement, GradeCellProps>(
  ({ value, dirty, onChange, onNavigate, ...aria }, ref) => {
    const invalid = gradeInputInvalid(value);

    const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
      if (!onNavigate) return;
      const input = e.currentTarget;
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        e.preventDefault();
        onNavigate('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        onNavigate('up');
      } else if (e.key === 'ArrowRight' && input.selectionStart === input.value.length) {
        e.preventDefault();
        onNavigate('right');
      } else if (e.key === 'ArrowLeft' && input.selectionStart === 0) {
        e.preventDefault();
        onNavigate('left');
      }
    };

    return (
      <input
        ref={ref}
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(sanitizeGradeInput(e.target.value))}
        onFocus={(e) => e.target.select()}
        onKeyDown={handleKey}
        className={cn(
          'h-[38px] w-16 rounded-[9px] border text-center font-mono text-[14px] outline-none transition-shadow',
          invalid
            ? 'border-danger bg-danger-bg text-danger focus:shadow-[0_0_0_3px_var(--danger-bg)]'
            : dirty
              ? 'border-jade bg-jade-faint text-ink focus:shadow-[0_0_0_3px_var(--jade-faint)]'
              : 'border-transparent bg-surface2 text-ink focus:border-jade focus:shadow-[0_0_0_3px_var(--jade-faint)]'
        )}
        {...aria}
      />
    );
  }
);
GradeCell.displayName = 'GradeCell';
