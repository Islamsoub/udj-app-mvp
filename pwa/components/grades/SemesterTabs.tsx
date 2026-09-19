'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SemesterSummary } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import styles from './grades.module.css';

/**
 * Semester selection, as §5's sliding-pill segmented control.
 *
 * "Implement as one absolutely-positioned pill element that animates its
 * transform: translateX() and width to the clicked button's bounding box over
 * --dur-fast with --ease-in-out. Text color crossfades in place, not on a
 * delay." Both halves are literal here: one pill, measured from the DOM, and a
 * colour transition on the buttons themselves.
 *
 * §10 supplies the semantics — role="tablist" / role="tab" / aria-selected —
 * and with them the keyboard contract a tablist is expected to honour: arrows
 * move between tabs, Home/End jump to the ends, and only the selected tab is in
 * the page's tab order.
 */
export function SemesterTabs({
  semesters,
  selectedId,
  onSelect,
  panelId,
}: {
  semesters: SemesterSummary[];
  selectedId: string;
  onSelect: (id: string) => void;
  /** The tabpanel these tabs drive, for aria-controls. */
  panelId: string;
}) {
  const { t, dir } = useI18n();

  const listRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  /*
   * The pill's geometry, in the inline axis.
   *
   * `offset` is the distance from the strip's INLINE-START edge to the tab's,
   * which is what makes one number work in both directions: the pill is
   * anchored with inset-inline-start, so in Arabic it already starts at the
   * right-hand edge and only the sign of the translation flips. Measuring
   * physical `left` instead would need two formulas and would drift the moment
   * one of them stopped being exercised.
   */
  const [pill, setPill] = useState<{ offset: number; width: number } | null>(null);

  // Suppresses the transition for the very first measurement. Without it the
  // pill would slide in from the strip's start edge on every mount, which reads
  // as a tab switch the student did not make.
  const [settled, setSettled] = useState(false);

  const measure = useCallback(() => {
    const list = listRef.current;
    const tab = tabRefs.current.get(selectedId);
    if (!list || !tab) return;

    /*
     * Measured rects rather than offsetLeft/offsetWidth: those round to whole
     * pixels, which leaves the pill a pixel short of a tab often enough to see,
     * and they are relative to the offsetParent's padding edge while the pill's
     * inset-inline-start is relative to the same box only while the strip has no
     * border. Rects are border-box on both sides and sub-pixel accurate, so the
     * two can never disagree.
     */
    const listBox = list.getBoundingClientRect();
    const tabBox = tab.getBoundingClientRect();

    const offset = dir === 'rtl' ? listBox.right - tabBox.right : tabBox.left - listBox.left;

    setPill({ offset, width: tabBox.width });
  }, [dir, selectedId]);

  // Layout effect, not a plain one: the pill must be in place in the same frame
  // the tabs paint, or the first frame shows it at the wrong tab.
  useLayoutEffect(() => {
    measure();
  }, [measure, semesters]);

  // Deferred one frame so the "no transition" first paint has actually
  // happened before transitions are allowed.
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
    const index = semesters.findIndex((s) => s.id === selectedId);
    if (index < 0) return;

    // Arrow keys follow what the student sees, so inline-start is ArrowLeft in
    // French and ArrowRight in Arabic.
    const back = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
    const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';

    let next = index;
    if (event.key === back) next = index - 1;
    else if (event.key === forward) next = index + 1;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = semesters.length - 1;
    else return;

    event.preventDefault();
    const target = semesters[Math.max(0, Math.min(semesters.length - 1, next))];
    if (target.id === selectedId) return;

    onSelect(target.id);
    tabRefs.current.get(target.id)?.focus();
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={t('grades.semester_tabs')}
      className={styles.tabs}
      onKeyDown={onKeyDown}
    >
      {/*
        Decorative: the selected state is announced by aria-selected, so the pill
        must not appear in the accessibility tree as a second, unlabelled thing.
      */}
      {pill !== null && (
        <span
          aria-hidden="true"
          className={`${styles.tabPill} ${settled ? styles.tabPillSettled : ''}`}
          style={
            {
              '--pill-x': `${dir === 'rtl' ? -pill.offset : pill.offset}px`,
              '--pill-w': `${pill.width}px`,
            } as React.CSSProperties
          }
        />
      )}

      {semesters.map((semester) => {
        const selected = semester.id === selectedId;
        return (
          <button
            key={semester.id}
            ref={(el) => {
              if (el) tabRefs.current.set(semester.id, el);
              else tabRefs.current.delete(semester.id);
            }}
            type="button"
            role="tab"
            id={`grades-tab-${semester.id}`}
            aria-selected={selected}
            aria-controls={panelId}
            // Roving tabindex: one stop for the whole strip, arrows inside it.
            tabIndex={selected ? 0 : -1}
            className={`${styles.tab} ${selected ? styles.tabSelected : ''}`}
            onClick={() => onSelect(semester.id)}
          >
            {/* A semester label is a code ("S1"), so it stays on the Latin face
                in Arabic like every other code on this screen. */}
            <span className="num">{semester.label}</span>
          </button>
        );
      })}
    </div>
  );
}
