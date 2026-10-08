/**
 * Registration and update handling for public/sw.js.
 *
 * The worker caches the app shell only â€” see the header of public/sw.js for
 * exactly what it caches and why /api never is. Nothing here reads the
 * offline-data switch (`unipocket_offline_cache`): that governs personal data,
 * which this layer does not touch.
 */

/*
 * KILL SWITCH, client half. Set to false to take the service worker out of
 * service: on the next load every page unregisters any worker it has and deletes
 * every Cache Storage cache on this origin, then never registers again.
 *
 * This is the normal lever, and enough on its own whenever the app's JavaScript
 * still runs. If the worker itself is broken badly enough that it might not â€”
 * it serves the wrong HTML, say â€” also set KILL_SWITCH = true at the top of
 * public/sw.js, which removes the worker from inside. Flip both; deploy; to
 * restore, flip both back.
 */
export const SERVICE_WORKER_ENABLED = true;

const SCRIPT_URL = `/sw.js?build=${encodeURIComponent(process.env.NEXT_PUBLIC_BUILD_ID ?? 'local')}`;

/** Called with the waiting worker when an update is ready for the student to accept. */
type OnUpdate = (waiting: ServiceWorker) => void;

/**
 * Registers the worker once the page has painted and loaded, so registration â€”
 * and the worker's own precache downloads â€” never compete with the first screen.
 * Returns a cleanup for the listeners it adds.
 */
export function startServiceWorker(onUpdate: OnUpdate): () => void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return () => {};

  // Development: never register, and remove one a production build on the same
  // origin (`npm start` on localhost:3000) left behind. A production worker
  // caching dev bundles cache-first would serve stale code after every edit.
  if (process.env.NODE_ENV !== 'production' || !SERVICE_WORKER_ENABLED) {
    void removeServiceWorker();
    return () => {};
  }

  let cancelled = false;

  const register = async () => {
    let registration: ServiceWorkerRegistration;
    try {
      registration = await navigator.serviceWorker.register(SCRIPT_URL, { scope: '/' });
    } catch {
      // A failed registration leaves the app exactly as it was without one.
      return;
    }
    if (cancelled) return;
    watchForUpdates(registration, onUpdate);
  };

  /*
   * How a deploy is discovered: the next page load runs this with the new
   * build's SCRIPT_URL, and registering a different script URL is itself the
   * update. registration.update() would not help an open tab â€” it re-fetches
   * the OLD ?build= URL, whose bytes never change â€” so there is no polling.
   */
  const onLoad = () => {
    // A task after `load`, which itself comes after first paint. Not
    // requestAnimationFrame: a tab opened in the background runs no frames, and
    // would never register until the student switched to it.
    window.setTimeout(() => void register(), 0);
  };

  if (document.readyState === 'complete') onLoad();
  else window.addEventListener('load', onLoad, { once: true });

  return () => {
    cancelled = true;
    window.removeEventListener('load', onLoad);
  };
}

/**
 * An update is a worker in `waiting` while another already controls the page.
 * A worker waiting with NO controller is a first install: there is nothing to
 * replace, so nothing to offer.
 */
function watchForUpdates(registration: ServiceWorkerRegistration, onUpdate: OnUpdate): void {
  const offerIfWaiting = () => {
    if (registration.waiting && navigator.serviceWorker.controller) onUpdate(registration.waiting);
  };

  // Already waiting from an earlier visit â€” the student closed the tab without
  // accepting. Offer it again.
  offerIfWaiting();

  registration.addEventListener('updatefound', () => {
    const incoming = registration.installing;
    incoming?.addEventListener('statechange', () => {
      if (incoming.state === 'installed') offerIfWaiting();
    });
  });
}

/**
 * The student accepted the update: let the waiting worker take over, then reload
 * once it has, so the page and its assets come from the new deploy together.
 *
 * Other open tabs are not reloaded behind the student's back. If the update was
 * already accepted in another tab, this worker is past `installed` by the time
 * this tab's toast is clicked, and the click only has to reload.
 */
export function acceptUpdate(waiting: ServiceWorker): void {
  if (waiting.state === 'activating' || waiting.state === 'activated') {
    window.location.reload();
    return;
  }

  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

/** Unregisters every worker on this origin and deletes every cache. */
async function removeServiceWorker(): Promise<void> {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
  } catch {
    // Best effort: a browser that refuses (a private window) has nothing to remove.
  }
}
