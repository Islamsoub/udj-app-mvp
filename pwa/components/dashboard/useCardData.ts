'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * §5: "Skeletons never show for less than 400ms even if data resolves instantly
 * (prevents flicker)." A cached or local-network response can land in 30ms, and
 * a skeleton that appears and vanishes inside two frames reads as a glitch.
 */
const MIN_SKELETON_MS = 400;

/**
 * One card's slice of the six screen states.
 *
 * Loaded / Loading / Empty / Error / Offline are all here. Empty is not a phase:
 * "no data" is a property of a successful response, so it belongs to the card
 * that knows what empty means for its own shape — a null GPA, an empty article
 * list — not to the fetch. SessionExpired is absent on purpose: a 401 that
 * cannot be refreshed is handled once, by the shell's modal, through the single
 * onSessionExpired callback. A card must never register a second one.
 */
export type CardState<T> =
  | { phase: 'loading' }
  | { phase: 'ready'; data: T }
  | { phase: 'error'; retry: () => void }
  | { phase: 'offline'; retry: () => void };

/**
 * Fetches one card's data, independently of every other card.
 *
 * Per-card rather than one request for the page is the whole point: §5's
 * skeletons are per-element, and one slow or failing endpoint must not hold the
 * other five hostage. Each card therefore owns its own phase, its own minimum
 * skeleton window, and its own retry.
 *
 * `fetcher` is read through a ref, so a caller may pass an inline arrow without
 * re-triggering the request on every render. The request re-runs only when the
 * retry counter or connectivity changes.
 */
export function useCardData<T>(fetcher: () => Promise<T>, online: boolean): CardState<T> {
  const [state, setState] = useState<CardState<T>>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  /*
   * Whether the LAST completed attempt produced data — not whether one ever
   * did. The distinction decides what the student sees when the network drops:
   * a card currently showing data keeps it, while a card sitting in an error
   * state has nothing worth preserving and should say "offline" instead of
   * offering a retry that cannot succeed until the connection returns.
   *
   * Read through a ref so going offline does not re-run the effect merely to
   * consult it.
   */
  const hasData = useRef(false);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    /*
     * Offline with nothing to show: say so, and do not fire a request that can
     * only fail. §8's "cards with no data show an offline message rather than an
     * error" — the distinction matters because an error invites the student to
     * retry something that cannot work, while "offline" tells them what to fix.
     *
     * Offline WITH data already on screen: leave it alone. Replacing a rendered
     * card with a connectivity notice destroys information the student can still
     * read, which is the opposite of what the offline rule is for.
     */
    if (!online) {
      if (!hasData.current) setState({ phase: 'offline', retry });
      return;
    }

    setState({ phase: 'loading' });

    const startedAt = Date.now();

    /** Applies a result no earlier than MIN_SKELETON_MS after the request began. */
    const settle = (next: CardState<T>) => {
      const remaining = Math.max(0, MIN_SKELETON_MS - (Date.now() - startedAt));

      const apply = () => {
        if (!cancelled) setState(next);
      };

      if (remaining === 0) {
        apply();
        return;
      }

      const timer = window.setTimeout(apply, remaining);
      timers.push(timer);
    };

    const timers: number[] = [];

    fetcherRef.current()
      .then((data) => {
        hasData.current = true;
        settle({ phase: 'ready', data });
      })
      .catch(() => {
        // Nothing on screen to protect any more, so a later drop in
        // connectivity is free to replace this with the offline message.
        hasData.current = false;

        /*
         * Connectivity is re-read here rather than trusted from the closure: the
         * network can drop during the request, and a failure that happened
         * because the device went offline is an offline state, not an error.
         *
         * The error carries no detail on purpose. A 401 whose refresh also fails
         * has already raised the session modal by this point (lib/api-client
         * calls notifySessionExpired), so the card behind it only needs to stop
         * showing a skeleton.
         */
        settle(
          navigator.onLine ? { phase: 'error', retry } : { phase: 'offline', retry }
        );
      });

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [attempt, online, retry]);

  return state;
}
