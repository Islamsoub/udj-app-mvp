'use client';

import { useEffect, useState } from 'react';

/**
 * Whole seconds remaining until `deadline` (epoch ms), or 0 when there is none.
 *
 * Counts against a wall-clock deadline rather than decrementing a number on a
 * 1s interval: a background tab throttles timers, and a decrementing counter
 * would drift and keep the button disabled long after the window had actually
 * reopened. Reading the clock each tick self-corrects.
 *
 * The interval stops at zero rather than running until unmount.
 */
export function useCountdown(deadline: number | null): number {
  const [remaining, setRemaining] = useState(() => secondsUntil(deadline));

  useEffect(() => {
    if (deadline === null) {
      setRemaining(0);
      return;
    }

    setRemaining(secondsUntil(deadline));

    const id = window.setInterval(() => {
      const next = secondsUntil(deadline);
      setRemaining(next);
      if (next <= 0) window.clearInterval(id);
    }, 1000);

    return () => window.clearInterval(id);
  }, [deadline]);

  return remaining;
}

function secondsUntil(deadline: number | null): number {
  if (deadline === null) return 0;
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}
