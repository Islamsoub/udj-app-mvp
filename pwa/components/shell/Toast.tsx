'use client';

import { useEffect, useState } from 'react';
import styles from './shell.module.css';

/** §5: auto-dismiss after 2200ms by reversing the entrance transition. */
const VISIBLE_MS = 2200;

/**
 * A single transient message (§5).
 *
 * One at a time is all this shell needs: the only sender is the reconnect
 * confirmation, and §5's stacking rules matter once there are several producers.
 * The layer is here so that adding them later does not mean moving the element.
 *
 * §10: announces via role="status" + aria-live="polite".
 *
 * `pointer-events: none` on the layer (see the stylesheet) keeps §5's "never
 * blocks input" promise — the toast floats over the content without swallowing
 * a click meant for what is underneath.
 */
export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (message === null) return;

    setLeaving(false);
    const id = window.setTimeout(() => setLeaving(true), VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [message]);

  if (message === null) return null;

  return (
    <div className={styles.toastLayer}>
      <div
        className={`${styles.toast} ${leaving ? styles.toastLeaving : ''}`}
        role="status"
        aria-live="polite"
        // Clearing on the exit animation's end rather than a second timer keeps
        // the unmount tied to the animation that is actually playing, including
        // when reduced motion shortens it.
        onAnimationEnd={() => {
          if (leaving) onDone();
        }}
      >
        {message}
      </div>
    </div>
  );
}
