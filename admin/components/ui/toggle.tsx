'use client';

import { cn } from '@/lib/utils';

/**
 * Toggle (impl spec §5): 40×23 track radius 999; 19×19 white knob with shadow
 * 0 1px 2px rgba(0,0,0,.25), translateX(17px) when on. Track jade on / #D5DCD8
 * off. transition .18s on background + transform.
 */
export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  'aria-label'?: string;
  className?: string;
}

export function Toggle({ checked, onChange, disabled, className, ...aria }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-[23px] w-10 shrink-0 cursor-pointer rounded-full border-0 p-0 transition-colors duration-[180ms]',
        disabled && 'cursor-not-allowed opacity-55',
        className
      )}
      style={{ background: checked ? 'var(--jade)' : 'var(--toggle-off)' }}
      {...aria}
    >
      <span
        className="absolute left-[2px] top-[2px] h-[19px] w-[19px] rounded-full bg-white transition-transform duration-[180ms]"
        style={{
          boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
          transform: checked ? 'translateX(17px)' : 'translateX(0)',
        }}
      />
    </button>
  );
}
