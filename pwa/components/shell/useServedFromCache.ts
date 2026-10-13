'use client';

import { useSyncExternalStore } from 'react';
import { oldestServedAt, subscribeServed } from '@/lib/offline-cache';

/**
 * When the oldest piece of the current screen that came from the offline store
 * was saved (epoch ms), or null when everything on screen is fresh.
 *
 * Null on the server: nothing is ever served from the store during a server
 * render, and the shell does not render its chrome there anyway.
 */
export function useServedFromCache(): number | null {
  return useSyncExternalStore(subscribeServed, oldestServedAt, () => null);
}
