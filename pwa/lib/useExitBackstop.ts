'use client';

import { useEffect, useRef } from 'react';

/**
 * Comfortably longer than --dur-fast (180ms), the duration of every exit
 * animation in the app, and than the --dur-instant (100ms) that
 * prefers-reduced-motion collapses those to. Only ever reached when
 * `animationend` does not arrive at all.
 */
export const EXIT_BACKSTOP_MS = 400;

/**
 * Guarantees that an element animating itself out actually gets removed.
 *
 * THE HIDDEN-TAB CASE. Components that fade something out commonly unmount it in
 * an `onAnimationEnd` handler. That event is not guaranteed: a tab that is
 * hidden when the animation starts never advances its timeline, so the animation
 * sits at currentTime 0 forever and the event never fires. The element stays
 * mounted — and because these exits animate opacity to 0 only at their END, it
 * stays mounted fully opaque. A stale page title covers the real one; a toast
 * never leaves. Both were observed in this app, along with 21 skeleton layers
 * shimmering over data that had already loaded.
 *
 * So removal must not depend on the event alone. Callers keep their
 * `onAnimationEnd` as the fast path and add this as the floor: whichever fires
 * first clears the state, and the other becomes a no-op. Do not "simplify" a
 * caller back to a bare `animationend` listener.
 *
 * This only controls WHEN an element is removed. It does not shorten, delay or
 * alter any animation — nothing here touches a duration or a style.
 *
 * @param exiting  A token identifying the current exit: null/undefined/false
 *                 when nothing is leaving, any other value while something is.
 *                 Passing the leaving item itself (a title string, a message)
 *                 rather than a bare boolean means a second exit starting inside
 *                 the window restarts it instead of inheriting the first one's
 *                 remaining time.
 * @param onExpire Called if the window elapses. Held in a ref, so an inline
 *                 arrow from the caller does not restart the timer on every
 *                 render — which would otherwise mean it never fires at all.
 */
export function useExitBackstop(
  exiting: unknown,
  onExpire: () => void,
  delayMs: number = EXIT_BACKSTOP_MS
): void {
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const active = exiting !== null && exiting !== undefined && exiting !== false;

  useEffect(() => {
    if (!active) return;

    const timer = window.setTimeout(() => onExpireRef.current(), delayMs);
    return () => window.clearTimeout(timer);
    // `exiting` is a dependency as well as `active`: a new exit replacing an
    // in-flight one keeps `active` true, and without this the replacement would
    // run out whatever was left of the previous window.
  }, [active, exiting, delayMs]);
}
