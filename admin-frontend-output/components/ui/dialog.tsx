'use client';

import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TONE_COLORS, type Tone } from '@/lib/tokens';
import { useModal } from '@/hooks/use-modal';

/**
 * Modal shell (impl spec §6). Card radius 18, maxWidth 94vw, maxHeight 90vh,
 * deep shadow, popIn .18s. Header: optional 38×38 tinted icon tile + title
 * (17/700) + sub (12.5 ink2) + close X. Body padding 22, scrolls. Footer:
 * right-aligned actions on surface2 with a top hairline.
 *
 * Rendered inside ModalRoot via useModal().open(<Modal …/>).
 */
export interface ModalProps {
  title: string;
  sub?: string;
  icon?: ReactNode;
  iconTone?: Tone;
  width?: number;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Modal({
  title,
  sub,
  icon,
  iconTone = 'jade',
  width = 480,
  footer,
  children,
  className,
}: ModalProps) {
  const { close } = useModal();
  const [fg, bg] = TONE_COLORS[iconTone];

  return (
    <div
      className={cn(
        'animate-pop-in flex max-h-[90vh] w-full flex-col overflow-hidden rounded-[18px] bg-surface',
        className
      )}
      style={{ maxWidth: '94vw', width, boxShadow: 'var(--shadow-modal)' }}
      onMouseDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex items-start gap-3 px-[22px] pb-[14px] pt-[20px]">
        {icon && (
          <span
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px]"
            style={{ background: bg, color: fg }}
          >
            {icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-bold leading-tight text-ink">{title}</div>
          {sub && <div className="mt-[3px] text-[12.5px] text-ink2">{sub}</div>}
        </div>
        <button
          type="button"
          onClick={close}
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[9px] border-0 bg-transparent text-ink3 transition-colors hover:bg-sunken hover:text-ink"
          aria-label="Fermer"
        >
          <X size={17} strokeWidth={2} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-[22px] pb-[22px]">{children}</div>
      {footer && (
        <div className="flex items-center justify-end gap-[10px] border-t border-hair bg-surface2 px-[22px] py-[14px]">
          {footer}
        </div>
      )}
    </div>
  );
}
