'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  addMonths,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  subDays,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * DatePicker (impl spec §6): trigger chip (cal icon + "20 juin 2026" +
 * chevron). Popover 260px calendar — month nav, Mon-first weekday header
 * L M M J V S D, French month names, selected day filled jade. `allowed`
 * restricts clickable days (session marking). Optional presets row
 * (7 jours / 30 jours / Ce semestre) as jade pills.
 */
export interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
  /** Restrict clickable days to these dates. */
  allowed?: Date[];
  /** Show quick-range presets; onPreset receives [from, to]. */
  presets?: boolean;
  onPreset?: (from: Date, to: Date) => void;
  semesterRange?: [Date, Date];
  placeholder?: string;
  className?: string;
}

const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function DatePicker({
  value,
  onChange,
  allowed,
  presets,
  onPreset,
  semesterRange,
  placeholder = 'Choisir une date',
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(value ?? new Date());
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const days = useMemo(() => {
    const first = startOfMonth(month);
    const last = endOfMonth(month);
    // Monday-first offset: getDay() Sunday=0 → Monday-first index.
    const offset = (first.getDay() + 6) % 7;
    const cells: (Date | null)[] = Array.from({ length: offset }, () => null);
    for (let d = 1; d <= last.getDate(); d += 1) {
      cells.push(new Date(month.getFullYear(), month.getMonth(), d));
    }
    return cells;
  }, [month]);

  const isAllowed = (d: Date) => !allowed || allowed.some((a) => isSameDay(a, d));

  return (
    <div ref={rootRef} className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-[8px] rounded-[10px] border border-hair2 bg-surface px-[13px] py-[9px] text-[13.5px] font-medium text-ink transition-colors hover:bg-surface2"
      >
        <CalendarIcon size={15} className="text-ink3" />
        {value ? format(value, 'd MMMM yyyy', { locale: fr }) : <span className="text-ink3">{placeholder}</span>}
        <ChevronDown size={14} className={cn('text-ink3 transition-transform duration-150', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-[6px] w-[260px] rounded-[13px] border border-hair bg-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent text-ink2 hover:bg-sunken"
              aria-label="Mois précédent"
            >
              <ChevronLeft size={15} />
            </button>
            <div className="text-[13px] font-bold capitalize text-ink">
              {format(month, 'MMMM yyyy', { locale: fr })}
            </div>
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent text-ink2 hover:bg-sunken"
              aria-label="Mois suivant"
            >
              <ChevronRight size={15} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-[2px]">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="py-1 text-center font-mono text-[10px] text-ink3">
                {w}
              </div>
            ))}
            {days.map((d, i) =>
              d === null ? (
                <div key={`e${i}`} />
              ) : (
                <button
                  key={d.toISOString()}
                  type="button"
                  disabled={!isAllowed(d)}
                  onClick={() => {
                    onChange(d);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex h-8 cursor-pointer items-center justify-center rounded-[8px] border-0 text-[12.5px] transition-colors',
                    value && isSameDay(d, value)
                      ? 'bg-jade font-bold text-white'
                      : isAllowed(d)
                        ? 'bg-transparent text-ink hover:bg-jade-faint'
                        : 'cursor-not-allowed bg-transparent text-ink3 opacity-40',
                    !isSameMonth(d, month) && 'opacity-40'
                  )}
                >
                  {d.getDate()}
                </button>
              )
            )}
          </div>
          {presets && (
            <div className="mt-2 flex gap-[6px] border-t border-hair pt-2">
              {(
                [
                  { label: '7 jours', days: 7 },
                  { label: '30 jours', days: 30 },
                ] as const
              ).map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => {
                    const to = new Date();
                    onPreset?.(subDays(to, p.days), to);
                    setOpen(false);
                  }}
                  className="cursor-pointer rounded-full border-0 bg-jade-faint px-[10px] py-[5px] text-[11.5px] font-semibold text-jade-text hover:bg-jade-faint2"
                >
                  {p.label}
                </button>
              ))}
              {semesterRange && (
                <button
                  type="button"
                  onClick={() => {
                    onPreset?.(semesterRange[0], semesterRange[1]);
                    setOpen(false);
                  }}
                  className="cursor-pointer rounded-full border-0 bg-jade-faint px-[10px] py-[5px] text-[11.5px] font-semibold text-jade-text hover:bg-jade-faint2"
                >
                  Ce semestre
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
