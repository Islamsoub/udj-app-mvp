'use client';

import { useState, type ReactNode } from 'react';
import { useExitBackstop } from '@/lib/useExitBackstop';
import styles from './schedule.module.css';

/**
 * §9: week navigation "crossfades the week grid's course blocks out and back in
 * over --dur-fast -- content changes, the grid structure doesn't animate
 * position."
 *
 * So this wraps the BLOCKS ONLY. The day columns, the hour rules and the time
 * gutter are outside it and never move: paging through the term must not make
 * the grid itself slide, because the grid is the fixed thing the student is
 * reading the blocks against.
 *
 * Both layers are held in one grid cell for the length of the swap, which is the
 * same arrangement GpaHero and StateLayers use and the reason nothing below
 * reflows while it runs.
 *
 * WHY FADE AT ALL WHEN THE BLOCKS LOOK THE SAME. The timetable is recurring and
 * the API returns one set of slots, so today two adjacent weeks draw identical
 * blocks. The fade is still the right feedback: the dates in the headers have
 * changed and the "today" marker has moved, and a screen that answered an arrow
 * press with no motion at all would read as a broken button. It also stops being
 * cosmetic the moment the endpoint becomes week-aware.
 */
export function Crossfade({
  token,
  fill = false,
  children,
}: {
  token: string;
  /**
   * True inside a week column, where the children are absolutely positioned
   * blocks and the layers have to be pinned over the column to give them a
   * containing block with a height. False in the day list, where the children
   * are flow content and pinning them would collapse the list to nothing.
   */
  fill?: boolean;
  children: ReactNode;
}) {
  /*
   * Derived from props during render rather than in an effect: an effect commits
   * the new content one frame before the outgoing copy exists, so the fade would
   * start from nothing.
   */
  const [shown, setShown] = useState({ token, children });
  const [leaving, setLeaving] = useState<{ token: string; children: ReactNode } | null>(null);

  if (shown.token !== token) {
    setLeaving(shown);
    setShown({ token, children });
  } else if (shown.children !== children) {
    // Same week, new children — a re-render from something else. Swap without a
    // fade; only a week change earns one.
    setShown({ token, children });
  }

  // animationend is the fast path; this is the floor for a tab that is hidden
  // when the week changes and therefore never advances the animation at all.
  useExitBackstop(leaving?.token, () => setLeaving(null));

  return (
    <div className={`${styles.crossfade} ${fill ? styles.crossfadeFill : ''}`}>
      {leaving !== null && (
        <div className={`${styles.crossfadeLayer} ${styles.crossfadeLeaving}`} aria-hidden="true">
          {leaving.children}
        </div>
      )}

      <div
        className={`${styles.crossfadeLayer} ${leaving !== null ? styles.crossfadeEntering : ''}`}
        onAnimationEnd={() => setLeaving(null)}
      >
        {shown.children}
      </div>
    </div>
  );
}
