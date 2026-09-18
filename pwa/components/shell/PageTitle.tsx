'use client';

import { useEffect, useRef, useState } from 'react';
import { useExitBackstop } from '@/lib/useExitBackstop';
import styles from './shell.module.css';

/**
 * §4: the page title in the topbar crossfades over --dur-fast on navigation.
 *
 * A crossfade, not a fade-in: both titles are on screen at once, stacked in one
 * grid cell, the old one fading out while the new one fades in. Keying a single
 * element on the pathname would give a fade-out-then-in with a blank frame in
 * between, which reads as a flicker at 180ms.
 *
 * Deliberately NOT a heading. §10 puts the page heading after the topbar actions
 * in the focus order, which places it in the content area — so the <h1> belongs
 * to the page and this is a label that happens to show the same words. Marking
 * both as headings would give every route two <h1>s and put the first one in the
 * wrong position in the document outline.
 *
 * The outgoing copy is dropped when its animation ends, so under reduced motion
 * — where the animation collapses to 100ms — a stale title does not linger for
 * the full 180. A backstop covers the case where that event never arrives; see
 * useExitBackstop below.
 */
export function PageTitle({ title }: { title: string }) {
  const [current, setCurrent] = useState(title);
  const [leaving, setLeaving] = useState<string | null>(null);
  // Distinguishes first paint from a real navigation: the first title has
  // nothing to cross from and must not animate a phantom predecessor out.
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      setCurrent(title);
      return;
    }

    setCurrent((previous) => {
      if (previous === title) return previous;
      setLeaving(previous);
      return title;
    });
  }, [title]);

  /*
   * Removal cannot depend on onAnimationEnd alone: a tab that is hidden when the
   * navigation happens never advances the animation, so the event never fires
   * and the OLD title stays mounted at full opacity, covering the real one.
   * Keyed on `leaving` so a second navigation inside the window restarts it.
   */
  useExitBackstop(leaving, () => setLeaving(null));

  return (
    <div className={styles.titleStack}>
      {leaving !== null && (
        <div
          key={`leaving-${leaving}`}
          className={`${styles.title} ${styles.titleLeaving}`}
          aria-hidden="true"
          onAnimationEnd={() => setLeaving(null)}
        >
          {leaving}
        </div>
      )}
      {/*
        Keyed on the title so React remounts it and the entrance animation
        re-runs; without the key it is the same element and the animation fires
        only once, on first paint.
      */}
      <div key={current} className={styles.title}>
        {current}
      </div>
    </div>
  );
}
