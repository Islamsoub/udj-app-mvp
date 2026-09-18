'use client';

import { useEffect, useState } from 'react';

/**
 * Live connectivity, plus whether the student has just come back.
 *
 * `navigator.onLine` is the only signal available — there is no service worker
 * and no caching layer yet — and it only reports whether the device has *a*
 * network, not whether the backend is reachable. A captive portal reads as
 * online. That is the right trade for a banner: over-reporting "online" leaves
 * the student where they were, while over-reporting "offline" would accuse a
 * working connection of being dead.
 *
 * Starts optimistic. `navigator` does not exist while rendering on the server,
 * and defaulting to offline would flash the banner at every student who is
 * perfectly online; the effect corrects it on mount, before paint.
 *
 * `justRestored` is a one-shot pulse, true only on the transition offline ->
 * online, so the reconnect toast (§8) fires on a real recovery and not on every
 * mount of a student who was online all along.
 */
export interface OnlineState {
  online: boolean;
  justRestored: boolean;
  acknowledgeRestore: () => void;
}

export function useOnline(): OnlineState {
  const [online, setOnline] = useState(true);
  const [justRestored, setJustRestored] = useState(false);

  useEffect(() => {
    const goOnline = () => {
      setOnline((wasOnline) => {
        // Only a genuine offline -> online edge counts as a restore. The
        // 'online' event can fire on a network change that never dropped.
        if (!wasOnline) setJustRestored(true);
        return true;
      });
    };

    const goOffline = () => {
      setOnline(false);
      // A drop cancels any pending restore announcement — telling someone the
      // connection is back while the banner is on screen is nonsense.
      setJustRestored(false);
    };

    // Correct the optimistic default against reality on mount.
    if (!navigator.onLine) setOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return {
    online,
    justRestored,
    acknowledgeRestore: () => setJustRestored(false),
  };
}
