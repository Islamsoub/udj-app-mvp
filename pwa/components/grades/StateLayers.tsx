'use client';

import { useState, type ReactNode } from 'react';
import { useExitBackstop } from '@/lib/useExitBackstop';
import styles from './grades.module.css';

/**
 * Crossfades a skeleton into whatever replaced it.
 *
 * §5: "Skeletons ... crossfade into real content over --dur-fast." A real
 * crossfade needs both layers present for that moment, so the outgoing skeleton
 * is held for exactly one animation and then dropped — stacked in the same grid
 * cell as the incoming content, which is why nothing below moves during the
 * swap. The same arrangement the dashboard's CardStates uses, lifted to whole
 * regions of this screen: the screen's first load, and the table when a tab
 * switch has to go and fetch a semester.
 *
 * Only the loading -> settled direction crossfades. Going back to a skeleton is
 * a new request starting, and fading the old content out under it would leave
 * the region blank for longer than the swap it is meant to hide.
 *
 * The caller decides what "settled" contains — loaded rows, an empty state, an
 * error, an offline notice. This component has no opinion on which.
 */
export function StateLayers({
  loading,
  skeleton,
  children,
}: {
  loading: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  const [wasLoading, setWasLoading] = useState(loading);
  const [leaving, setLeaving] = useState(false);

  // Derived from props during render, not in an effect: an effect would commit
  // the settled content one frame before the outgoing skeleton existed, and the
  // crossfade would start from nothing.
  if (wasLoading !== loading) {
    setWasLoading(loading);
    setLeaving(wasLoading && !loading);
  }

  // animationend is the fast path; this is the floor for a tab that is hidden
  // when the swap happens and therefore never advances the animation at all.
  useExitBackstop(leaving, () => setLeaving(false));

  if (loading) {
    return (
      <div className={styles.layer} aria-hidden="true">
        {skeleton}
      </div>
    );
  }

  return (
    <>
      {leaving && (
        <div
          className={`${styles.layer} ${styles.layerLeaving}`}
          aria-hidden="true"
          onAnimationEnd={() => setLeaving(false)}
        >
          {skeleton}
        </div>
      )}

      <div className={`${styles.layer} ${styles.layerEntering}`}>{children}</div>
    </>
  );
}
