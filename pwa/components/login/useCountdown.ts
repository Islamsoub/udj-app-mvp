'use client';

import { useEffect, useState } from 'react';

/**
 * Whole seconds remaining until `deadline` (epoch ms), or 0 when there is none.
 *
 * The value is computed from the deadline during render, not stored and synced
 * in an effect. A stored copy lagged one render behind a new deadline: on the
 * render where a 429 or 423 set the error it still read 0, and LoginForm's
 * "countdown finished, clear the error" effect ran in that same commit, saw a
 * deadline with 0 seconds left, and removed the message before it was ever
 * painted. Deriving it means the first render that has a deadline also has its
 * real remaining time.
 *
 * Counts against a wall-clock deadline rather than decrementing a number on a
 * 1s interval: a background tab throttles timers, and a decrementing counter
 * would drift and keep the button disabled long after the window had actually
 * reopened. The interval only forces a re-render; each render reads the clock.
 *
 * The interval stops at zero rather than running until unmount.
 */
export function useCountdown(deadline: number | null): number {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (deadline === null) return;

    const id = window.setInterval(() => {
      setTick((tick) => tick + 1);
      if (secondsUntil(deadline) <= 0) window.clearInterval(id);
    }, 1000);

    return () => window.clearInterval(id);
  }, [deadline]);

  return secondsUntil(deadline);
}

function secondsUntil(deadline: number | null): number {
  if (deadline === null) return 0;
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}
