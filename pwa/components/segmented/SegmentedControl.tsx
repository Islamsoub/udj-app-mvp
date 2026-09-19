'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import styles from './segmented.module.css';

/**
 * §5's sliding-pill segmented control, with nothing in it about what is being
 * chosen.
 *
 * "The active pill background slides between options rather than the whole
 * control repainting: implement as one absolutely-positioned pill element that
 * animates its transform: translateX() and width to the clicked button's
 * bounding box over --dur-fast with --ease-in-out. Text color crossfades in
 * place, not on a delay."
 *
 * §10 supplies the semantics — role="tablist" / role="tab" / aria-selected — and
 * with them the keyboard contract a tablist owes: arrows move between options,
 * Home/End jump to the ends, and only the selected option is in the page's tab
 * order.
 *
 * THE MECHANICS ARE LIFTED FROM components/grades/SemesterTabs.tsx, which is
 * bound to SemesterSummary and to the grades stylesheet and could not be reused
 * as it stands. This is the generic version; SemesterTabs should be migrated
 * onto it so there is one implementation again, but that is a change to the
 * Grades screen and belongs in its own commit rather than riding along with a
 * new screen.
 */
export interface SegmentedOption {
  id: string;
  label: string;
}

export function SegmentedControl({
  options,
  selectedId,
  onSelect,
  label,
  panelId,
}: {
  options: SegmentedOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** Names the group for assistive tech — the control has no visible heading. */
  label: string;
  /** The tabpanel these options drive, for aria-controls. */
  panelId?: string;
}) {
  const { dir } = useI18n();

  const listRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef(new Map<string, HTMLButtonElement>());

  /*
   * The pill's geometry, in the inline axis.
   *
   * `offset` is the distance from the strip's INLINE-START edge to the option's,
   * which is what makes one number work in both directions: the pill is anchored
   * with inset-inline-start, so in Arabic it already starts at the right-hand
   * edge and only the sign of the translation flips. Measuring physical `left`
   * instead would need two formulas and would drift the moment one of them
   * stopped being exercised.
   */
  const [pill, setPill] = useState<{ offset: number; width: number } | null>(null);

  // Suppresses the transition for the very first measurement. Without it the
  // pill would slide in from the strip's start edge on every mount, which reads
  // as a switch the student did not make.
  const [settled, setSettled] = useState(false);

  const measure = useCallback(() => {
    const list = listRef.current;
    const option = optionRefs.current.get(selectedId);
    if (!list || !option) return;

    /*
     * Measured rects rather than offsetLeft/offsetWidth: those round to whole
     * pixels, which leaves the pill a pixel short often enough to see, and they
     * are relative to the offsetParent's padding edge while the pill's
     * inset-inline-start matches that box only while the strip has no border.
     * Rects are border-box on both sides and sub-pixel accurate.
     */
    const listBox = list.getBoundingClientRect();
    const optionBox = option.getBoundingClientRect();

    const offset = dir === 'rtl' ? listBox.right - optionBox.right : optionBox.left - listBox.left;

    setPill({ offset, width: optionBox.width });
  }, [dir, selectedId]);

  // Layout effect, not a plain one: the pill must be in place in the same frame
  // the options paint, or the first frame shows it under the wrong one.
  useLayoutEffect(() => {
    measure();
  }, [measure, options]);

  // Deferred one frame so the "no transition" first paint has actually happened
  // before transitions are allowed.
  useEffect(() => {
    if (pill === null || settled) return;
    const raf = window.requestAnimationFrame(() => setSettled(true));
    return () => window.cancelAnimationFrame(raf);
  }, [pill, settled]);

  /*
   * Re-measures when the strip changes size — the sidebar collapsing (§7), a
   * window resize, or the Arabic face loading and re-flowing the labels. A
   * resize observer rather than a window listener, because the sidebar animates
   * the content column's width without the window ever changing.
   */
  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => measure());
    observer.observe(list);
    return () => observer.disconnect();
  }, [measure]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = options.findIndex((o) => o.id === selectedId);
    if (index < 0) return;

    // Arrow keys follow what the student sees, so inline-start is ArrowLeft in
    // French and ArrowRight in Arabic.
    const back = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';

    let next = index;
    if (event.key === back) next = index - 1;
    else if (event.key === forward) next = index + 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = options.length - 1;
    else return;

    event.preventDefault();
    const target = options[Math.max(0, Math.min(options.length - 1, next))];
    if (target.id === selectedId) return;

    onSelect(target.id);
    optionRefs.current.get(target.id)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      className={styles.strip}
      onKeyDown={onKeyDown}
    >
      {/*
        Decorative: the selected state is announced by aria-selected, so the pill
        must not appear in the accessibility tree as a second, unlabelled thing.
      */}
      {pill !== null && (
        <span
          aria-hidden="true"
          className={`${styles.pill} ${settled ? styles.pillSettled : ''}`}
          style={
            {
              '--pill-x': `${dir === 'rtl' ? -pill.offset : pill.offset}px`,
              '--pill-w': `${pill.width}px`,
            } as React.CSSProperties
          }
        />
      )}

      {options.map((option) => {
        const selected = option.id === selectedId;
        return (
          <button
            key={option.id}
            ref={(el) => {
              if (el) optionRefs.current.set(option.id, el);
              else optionRefs.current.delete(option.id);
            }}
            type="button"
            role="tab"
            id={`segmented-${option.id}`}
            aria-selected={selected}
            aria-controls={panelId}
            // Roving tabindex: one stop for the whole strip, arrows inside it.
            tabIndex={selected ? 0 : -1}
            className={`${styles.option} ${selected ? styles.optionSelected : ''}`}
            onClick={() => onSelect(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
