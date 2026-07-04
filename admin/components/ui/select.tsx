'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Dropdown — custom select (impl spec §6). Closed control looks like an Input
 * with a chevron that rotates 180° when open. Popover +6px below, radius 11,
 * shadowLg, maxHeight 260 scroll. Selected → jadeFaint bg + jadeText 700 +
 * trailing check. Closes on outside mousedown. disabled → 0.55 opacity.
 */
export interface DropdownOption {
  value: string;
  label: string;
  badge?: ReactNode;
}

export interface DropdownProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  mono?: boolean;
  className?: string;
}

export function Dropdown({
  value,
  onChange,
  options,
  placeholder = 'Sélectionner…',
  disabled,
  error,
  mono,
  className,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border bg-surface px-[13px] py-[10px] text-left text-[14px] outline-none transition-shadow',
          mono && 'font-mono text-[13px]',
          error ? 'border-danger' : 'border-hair2',
          open && !error && 'border-jade shadow-[0_0_0_3px_var(--jade-faint)]',
          disabled && 'cursor-not-allowed opacity-55',
          selected ? 'text-ink' : 'text-ink3'
        )}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronDown
          size={16}
          className={cn('shrink-0 text-ink3 transition-transform duration-150', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-[6px] max-h-[260px] overflow-y-auto rounded-[11px] border border-hair bg-surface py-[5px] shadow-lg"
        >
          {options.length === 0 && (
            <div className="px-[13px] py-[9px] text-[13px] text-ink3">Aucune option</div>
          )}
          {options.map((o) => {
            const isSel = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full cursor-pointer items-center justify-between gap-2 border-0 px-[13px] py-[8px] text-left text-[13.5px] transition-colors',
                  isSel
                    ? 'bg-jade-faint font-bold text-jade-text'
                    : 'bg-transparent text-ink hover:bg-surface2'
                )}
              >
                <span className="truncate">{o.label}</span>
                {o.badge ?? (isSel && <Check size={15} strokeWidth={2.4} className="shrink-0 text-jade" />)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
