'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getGrades } from '@/lib/api-client';
import type { GradesResponse } from '@/lib/api-types';
import type { CardState } from '@/components/dashboard/useCardData';

/**
 * §5: "Skeletons never show for less than 400ms even if data resolves
 * instantly." Same floor and same reason as the dashboard's useCardData — a
 * skeleton that appears and vanishes inside two frames reads as a glitch.
 */
const MIN_SKELETON_MS = 400;

/**
 * One semester's grade list, per tab, with a cache.
 *
 * This is the dashboard's useCardData pattern with the one change the grades
 * screen needs: the request is keyed. useCardData deliberately reads its fetcher
 * through a ref and re-runs only on retry or reconnect, so a fetcher closing
 * over the selected semester would never refire — the tab would change and the
 * table would not. Everything else is kept identical on purpose: the same
 * CardState union (imported, not redeclared, so the two cannot drift), the same
 * 400ms floor, the same offline-versus-error distinction, and the same silence
 * about 401s, which the shell's modal owns.
 *
 * THE CACHE IS WHAT MAKES THE TAB STRIP USABLE. A student whose results are in
 * the semester she did not land on has to switch tabs to find them, and switch
 * back to compare; re-fetching and re-skeletoning on every switch would punish
 * exactly the journey the data forces on her. A semester already seen therefore
 * renders instantly, which is also what lets §9's GPA crossfade read as a
 * crossfade rather than as a load.
 *
 * `seed` is the semester the bootstrap already fetched. Seeding rather than
 * re-requesting it means opening the screen costs one round trip, not two.
 */
export function useSemesterDetail(
  semesterId: string,
  seed: GradesResponse,
  online: boolean
): CardState<GradesResponse> {
  const cache = useRef(new Map<string, GradesResponse>([[seed.semester.id, seed]]));

  const [state, setState] = useState<CardState<GradesResponse>>(() => {
    const cached = cache.current.get(semesterId);
    return cached ? { phase: 'ready', data: cached } : { phase: 'loading' };
  });

  const [attempt, setAttempt] = useState(0);

  // Read by `retry`, which must stay referentially stable — it is handed to the
  // error state and would otherwise restart the effect on every render.
  const currentId = useRef(semesterId);
  currentId.current = semesterId;

  const retry = useCallback(() => {
    // Drop the failed semester's slot first: without this the effect's cache
    // lookup would short-circuit on the retry and the request would never be
    // reissued. A successful fetch is never evicted here, only a missing one.
    cache.current.delete(currentId.current);
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    /*
     * Already fetched this session: render it and make no request. This branch
     * also covers going offline while a cached semester is on screen — the
     * dashboard's rule that a card holding data keeps it, applied to a tab.
     */
    const cached = cache.current.get(semesterId);
    if (cached) {
      setState({ phase: 'ready', data: cached });
      return;
    }

    /*
     * Offline with nothing cached for this semester: say so rather than firing a
     * request that can only fail. The other tabs stay usable, so a student who
     * loses connectivity can still read whatever she has already opened.
     */
    if (!online) {
      setState({ phase: 'offline', retry });
      return;
    }

    let cancelled = false;
    const timers: number[] = [];
    const startedAt = Date.now();

    setState({ phase: 'loading' });

    /** Applies a result no earlier than MIN_SKELETON_MS after the request began. */
    const settle = (next: CardState<GradesResponse>) => {
      const remaining = Math.max(0, MIN_SKELETON_MS - (Date.now() - startedAt));
      const apply = () => {
        if (!cancelled) setState(next);
      };

      if (remaining === 0) {
        apply();
        return;
      }
      timers.push(window.setTimeout(apply, remaining));
    };

    getGrades(semesterId)
      .then((data) => {
        cache.current.set(semesterId, data);
        settle({ phase: 'ready', data });
      })
      .catch(() => {
        // Connectivity is re-read rather than trusted from the closure: a
        // request that failed because the device dropped off the network is an
        // offline state, not an error the student can retry her way out of.
        settle(navigator.onLine ? { phase: 'error', retry } : { phase: 'offline', retry });
      });

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [semesterId, attempt, online, retry]);

  return state;
}
