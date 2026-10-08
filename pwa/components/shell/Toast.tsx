'use client';

import { useEffect, useState } from 'react';
import { useExitBackstop } from '@/lib/useExitBackstop';
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
export function Toast({
  message,
  onDone,
  action,
}: {
  message: string | null;
  onDone: () => void;
  /**
   * A toast with an action stays until it is used: an offer the student has
   * 2200ms to notice is not an offer. Its button takes clicks; the rest of the
   * layer still lets them through. Used for the service-worker update prompt.
   */
  action?: { label: string; onClick: () => void };
}) {
  const [leaving, setLeaving] = useState(false);
  const persistent = action !== undefined;

  useEffect(() => {
    if (message === null || persistent) return;

    setLeaving(false);
    const id = window.setTimeout(() => setLeaving(true), VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, [message, persistent]);

  /*
   * Dismissal cannot depend on onAnimationEnd alone: a tab that is hidden when
   * the exit begins never advances the animation, so the event never fires and
   * the toast stays on screen at full opacity indefinitely — long past the
   * 2200ms §5 allows it. Keyed on the message so a new toast arriving mid-exit
   * gets its own window rather than the previous one's remainder.
   */
  useExitBackstop(leaving ? message : null, onDone);

  if (message === null) return null;

  return (
    <div className={styles.toastLayer}>
      <div
        className={[styles.toast, persistent ? styles.toastWithAction : '', leaving ? styles.toastLeaving : '']
          .filter(Boolean)
          .join(' ')}
        role="status"
        aria-live="polite"
        // The fast path: tying the unmount to the animation that is actually
        // playing keeps it correct when reduced motion shortens it. The backstop
        // above covers the case where this event never arrives at all.
        onAnimationEnd={() => {
          if (leaving) onDone();
        }}
      >
        {message}
        {action !== undefined && (
          <button type="button" className={styles.toastAction} onClick={action.onClick}>
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
