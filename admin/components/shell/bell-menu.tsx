'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Clock } from 'lucide-react';
import { useAttendance } from '@/hooks/queries/use-attendance';

/**
 * BellMenu (impl spec §7): bell with red dot when justifications are pending.
 * Popover 300px: "Justificatifs en attente · N à traiter" (amber clock tile)
 * → /attendance; "Voir tout →" footer. "Tout est à jour ✓" when nothing.
 */
export function BellMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { data } = useAttendance();
  const pending = data?.pendingJustifications ?? 0;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent text-ink2 transition-colors hover:bg-sunken"
        aria-label="Notifications"
      >
        <Bell size={18} strokeWidth={1.7} />
        {pending > 0 && (
          <span className="absolute right-[7px] top-[7px] h-2 w-2 rounded-full border-2 border-surface bg-danger" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-[6px] w-[300px] rounded-[13px] border border-hair bg-surface py-2 shadow-lg">
          {pending > 0 ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/attendance');
              }}
              className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-3 text-left transition-colors hover:bg-surface2"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-amber-bg text-amber">
                <Clock size={17} />
              </span>
              <span>
                <span className="block text-[13.5px] font-bold text-ink">Justificatifs en attente</span>
                <span className="block text-[12px] text-ink2">{pending} à traiter</span>
              </span>
            </button>
          ) : (
            <div className="px-4 py-3 text-[13px] text-ink2">Tout est à jour ✓</div>
          )}
          <div className="mt-1 border-t border-hair px-4 pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push('/attendance');
              }}
              className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-semibold text-jade-text hover:underline"
            >
              Voir tout →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
