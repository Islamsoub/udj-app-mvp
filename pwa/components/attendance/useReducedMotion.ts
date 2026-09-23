'use client';

import { useCallback, useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Whether the OS asks for reduced motion, read at render time and kept current.
 *
 * §2 collapses every animation in the spec under this query, and almost all of
 * that is done in CSS — which is where it belongs, because a media query in a
 * stylesheet cannot get out of step with the rule it guards. This hook exists
 * for the one case that cannot be expressed that way.
 *
 * ── WHY THE FILTER CROSSFADE NEEDS IT ────────────────────────────────────────
 *
 * Crossfade (components/schedule/Crossfade.tsx) holds the outgoing list in the
 * same grid cell as the incoming one for the length of one animation, and drops
 * it on `animationend` with lib/useExitBackstop as the floor. Its stylesheet
 * sets `animation: none` on both layers under reduced motion — correct for the
 * schedule, where the two weeks draw identical blocks, but here the two filtered
 * views have DIFFERENT numbers of rows. With no animation there is no
 * `animationend`, so the outgoing layer survives until the 400ms backstop, at
 * full opacity, stacked on top of the incoming one: two lists of different
 * lengths overlapping in one cell.
 *
 * The honest fix is not to crossfade at all when motion is reduced, which is
 * what §2 asks for anyway — so the wrapper is skipped rather than neutered, and
 * the new list simply replaces the old one. Doing it in CSS was not available:
 * Crossfade's class names are hashed into the schedule's module and cannot be
 * reached from this screen's stylesheet, and the alternative — editing the
 * schedule's files — is out of scope here and would be the wrong shape anyway,
 * since a second consumer's requirement should not silently change the first's.
 *
 * `useSyncExternalStore` rather than an effect: it subscribes and reads in one
 * place, and its server snapshot is explicit. That snapshot is `false` — motion
 * allowed — because the server cannot know, and the value is only consulted on a
 * filter change, which is necessarily after hydration has corrected it.
 */
export function useReducedMotion(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const media = window.matchMedia(QUERY);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
