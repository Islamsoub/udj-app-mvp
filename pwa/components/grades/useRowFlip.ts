'use client';

import { useCallback, useLayoutEffect, useRef } from 'react';

/**
 * §5, data tables: "rows re-order by having each <tr> animate its vertical
 * position with a FLIP transition (record old position, animate
 * transform: translateY() from old->0) over --dur-base -- avoids a jarring
 * re-render."
 *
 * First, Last, Invert, Play. The browser has already done First and Last for us
 * by the time a layout effect runs — the rows are in their new places — so this
 * only has to Invert (put each row back where it was, with no transition) and
 * Play (release it, letting the stylesheet's transition carry it home).
 *
 * The duration and easing live in the stylesheet, not here. That is deliberate:
 * it keeps the tokens in CSS where prefers-reduced-motion can reach them, and it
 * means this file never names a millisecond.
 *
 * `signature` identifies the current ordering. The effect re-measures on every
 * change and animates on every change but the first — the first is the initial
 * paint, which is not a re-ordering of anything.
 */
export function useRowFlip(signature: string) {
  const rows = useRef(new Map<string, HTMLElement>());
  const positions = useRef(new Map<string, number>());
  const firstRun = useRef(true);

  useLayoutEffect(() => {
    const next = new Map<string, number>();
    /*
     * `offsetTop`, not getBoundingClientRect(): the rect is the PAINTED box and
     * therefore includes any transform still in flight, so two sort clicks
     * inside one --dur-base would measure a row mid-travel and invert it from
     * the wrong place. offsetTop is the layout position and ignores transforms,
     * which makes every measurement independent of whatever the previous
     * animation is doing.
     *
     * Rows hidden by the responsive swap (the table below 640px, the stacked
     * cards above it) measure as 0 in both passes, so their delta is 0 and they
     * are skipped without needing to be recognised as hidden. Only whichever
     * rendering is on screen animates.
     */
    rows.current.forEach((el, key) => next.set(key, el.offsetTop));

    const previous = positions.current;
    positions.current = next;

    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    // §2: every animation in the spec collapses under prefers-reduced-motion.
    // For a FLIP that means not running it — the rows are already in their
    // correct final places, and the transition is pure travel.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    next.forEach((top, key) => {
      const before = previous.get(key);
      if (before === undefined) return;

      const delta = before - top;
      if (delta === 0) return;

      const el = rows.current.get(key);
      if (!el) return;

      // Invert: back to where the row was, with the stylesheet's transition
      // suppressed so the jump is not itself animated.
      el.style.transition = 'none';
      el.style.transform = `translateY(${delta}px)`;

      // Forces the inverted position to be computed before it is released;
      // without this both writes collapse into one style recalculation and
      // nothing moves.
      void el.offsetHeight;

      // Play: hand both properties back to the stylesheet.
      el.style.transition = '';
      el.style.transform = '';
    });
  }, [signature]);

  /**
   * Ref callback factory. `key` must be unique across BOTH renderings of the
   * same data, since the table rows and the stacked cards register into one map.
   */
  return useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) rows.current.set(key, el);
      else rows.current.delete(key);
    },
    []
  );
}
