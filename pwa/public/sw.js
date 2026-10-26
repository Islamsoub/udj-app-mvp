/*
 * Unipocket service worker — app shell only.
 *
 * WHAT THIS CACHES, AND WHAT IT NEVER DOES
 *
 *   Navigations (HTML)          network first, cache fallback, then /offline.html
 *   Shell warm fetches          network, stored as that route's shell (see below)
 *   /_next/static/*, /fonts/*,  cache first
 *   /logo.svg, /icons/*,
 *   /manifest.json
 *   /api/*                      NEVER — not read, not written, not intercepted
 *   everything else             not intercepted (RSC payloads, sw.js)
 *
 * No personal data is cached here. The HTML of every route is the shell only:
 * the pages render on the client and fetch the student's data through /api,
 * which this worker does not touch. On a shared lab machine that is the whole
 * privacy question, so the /api rule is the first thing the fetch handler
 * checks and it returns before anything else can run.
 *
 * WHY THE SHELLS NEED NO CONSENT, AND WHAT WOULD CHANGE THAT. The stored HTML is
 * not gated by the offline-data switch and is not wiped at logout, because it
 * holds nothing about the student. That was checked on the real response
 * bodies, and it holds structurally: the page files only render client
 * components, the root layout reads nothing but the language and theme cookies,
 * and the refresh cookie is scoped to path /api/auth — the browser never sends
 * it with a page request, so the server cannot know who is asking. IF ANY PAGE
 * EVER FETCHES ON THE SERVER, OR THE REFRESH COOKIE'S PATH WIDENS, RE-CHECK
 * THIS: a shell carrying student data would have to be consent-gated and wiped
 * with the offline store, exactly like it.
 *
 * SHELLS ARE WARMED BY THE PAGE, NOT GUESSED AT INSTALL
 *
 * The app navigates client-side after its first load, so navigations alone
 * would only ever store the one route the student happened to hard-load. Instead
 * the page (components/pwa/service-worker.ts, warmShells) fetches the seven
 * SHELL_ROUTES in the background and this worker stores each response. Those
 * fetches come from the page, so they carry the language and theme cookies and
 * every stored shell is a genuine server render in the student's language and
 * theme — nothing is patched. The worker cannot do this itself: the cookies are
 * added by the browser after the worker has seen a request, so a navigation's
 * Request here never shows them.
 *
 * A warm fetch is recognised by WARM_HEADER, never by its URL: Next's client
 * router fetches the same paths for its RSC payloads, and keyed by path alone
 * one of those would overwrite a shell with something that is not HTML.
 *
 * Each stored shell records its variant (language|theme) in VARIANT_HEADER. The
 * page warms only routes that are missing or of another variant, so warming
 * costs seven small documents once per build, and again after a language or
 * theme change — not on every load. A warm that fails on a bad connection is
 * simply retried on the next load.
 *
 * UPDATES WAIT FOR CONSENT
 *
 * The page registers this file as /sw.js?build=<build id>, so every deploy is a
 * new script URL and the browser installs a new worker. That worker does NOT
 * call skipWaiting on its own: it installs, then waits. The page sees it waiting,
 * shows a "new version" toast, and only when the student clicks it posts
 * SKIP_WAITING (handled at the bottom of this file). The page then reloads once,
 * on `controllerchange`. Until that click nothing changes under the student.
 *
 * CACHE VERSIONING
 *
 * VERSION is the one name every cache is derived from. It combines the build id
 * from the script URL with CACHE_SCHEMA, so a deploy gets fresh caches and
 * `activate` deletes every cache that is not current. Per-build caches are also
 * what makes cache-first safe for the few unhashed assets (/fonts, /logo.svg,
 * /icons, /manifest.json): they cannot outlive the build that put them there.
 *
 * DEBUGGING: Chrome DevTools → Application → Service workers (state, update,
 * unregister) and → Cache storage (one entry per cache name below). Every cache
 * name starts with "unipocket-".
 */

'use strict';

/*
 * KILL SWITCH — set to true to remove this worker from every browser that has it.
 *
 * When to use it: the worker itself is misbehaving badly enough that the app's
 * own JavaScript may not run (wrong HTML served, a fetch handler throwing). The
 * browser re-checks this file on every navigation, sees the bytes changed, and
 * installs the new copy. With the switch on, that copy takes over at once
 * without waiting for consent, deletes every cache, unregisters itself and
 * reloads the pages it controlled — which then load straight from the network.
 *
 * Flip it TOGETHER with SERVICE_WORKER_ENABLED = false in
 * components/pwa/service-worker.ts, so the page stops registering a worker at
 * all. On its own this switch is still safe — a page that registers it again
 * just gets a worker that removes itself on activation, and a page it never
 * controlled is never reloaded, so there is no loop — but it is wasteful.
 *
 * To restore: set both back, deploy. Nothing else is needed.
 */
const KILL_SWITCH = false;

/** Bump when the caching rules in this file change, to discard caches built under the old rules. */
const CACHE_SCHEMA = 2;

/** Set by the page's registration URL. 'local' only if the file is registered without one. */
const BUILD = new URL(self.location.href).searchParams.get('build') || 'local';

const VERSION = `unipocket-v${CACHE_SCHEMA}-${BUILD}`;
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const CURRENT_CACHES = [STATIC_CACHE, PAGES_CACHE];

/** Served for a navigation that fails with nothing cached for that route. */
const OFFLINE_URL = '/offline.html';

/**
 * The routes whose shells the page warms. Kept in step with SHELL_ROUTES in
 * components/pwa/service-worker.ts; a route missing here is simply not stored.
 */
const SHELL_ROUTES = ['/', '/schedule', '/grades', '/attendance', '/profile', '/news', '/login'];

/** Set by the page on a warm fetch; its value is the variant, "fr|light". */
const WARM_HEADER = 'X-Unipocket-Shell-Warm';

/** Added to a stored shell so the page can tell which variant it holds. */
const VARIANT_HEADER = 'X-Unipocket-Shell-Variant';

/** The only variants stored. Anything else in WARM_HEADER is not stored. */
const VARIANT_PATTERN = /^(fr|ar)\|(light|dark|system)$/;

/**
 * Fetched at install, so the offline page works even if the student never
 * opened it: the page itself, the logo it masks, and the faces it sets in —
 * and so an installed app opened offline can still read its own manifest and
 * the icons it names. Keep the icon list in step with public/manifest.json.
 */
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/logo.svg',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/fonts/PlusJakartaSans-Regular.woff2',
  '/fonts/PlusJakartaSans-Medium.woff2',
  '/fonts/PlusJakartaSans-Bold.woff2',
  '/fonts/PlusJakartaSans-ExtraBold.woff2',
  '/fonts/NotoNaskhArabic-Regular.woff2',
  '/fonts/NotoNaskhArabic-Bold.woff2',
];

// ── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  if (KILL_SWITCH) {
    // The one case that must not wait for the student: a broken worker has to go.
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // `cache: 'reload'` skips the HTTP cache, so a precache never stores a
      // stale copy the browser happened to be holding.
      cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: 'reload' })))
    )
  );
  // Deliberately NO skipWaiting here — see "Updates wait for consent" above.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();

      if (KILL_SWITCH) {
        await Promise.all(names.map((name) => caches.delete(name)));
        await self.registration.unregister();
        // Only the pages this worker took over. A page that registered it fresh
        // is not controlled, is not in this list, and so is never reloaded.
        const clients = await self.clients.matchAll({ type: 'window' });
        await Promise.all(clients.map((client) => client.navigate(client.url)));
        return;
      }

      // Every cache that is not this build's goes — including any a later change
      // might add under a different name, which must then be listed in
      // CURRENT_CACHES to survive.
      await Promise.all(
        names.filter((name) => !CURRENT_CACHES.includes(name)).map((name) => caches.delete(name))
      );

      /*
       * Take control of pages that have no worker yet. Without this, the page
       * that registered the worker — the student's whole first session, since the
       * app navigates client-side — never passes a request through it: no chunk
       * is cached, no shell is warmed, and the first offline reload finds
       * nothing. It changes nothing for an update: a page already controlled
       * moves to the new worker on activation anyway, and an update only
       * activates after the student's click, which reloads.
       */
      await self.clients.claim();
    })()
  );
});

/** The page posts this only after the student clicks the update toast. */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// ── Fetch routing ────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  if (KILL_SWITCH) return;

  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // NEVER /api. Returning without respondWith hands the request straight back to
  // the browser: this worker neither reads nor stores any of it. Checked before
  // the navigation branch, so even a top-level navigation to an /api URL (a
  // student opening a JSON link) is untouched.
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return;

  // A shell warm from the page. Recognised by its header, then confined to the
  // known routes with no query string; a marked request for anything else is
  // passed through untouched and stored nowhere.
  if (request.headers.has(WARM_HEADER)) {
    if (SHELL_ROUTES.includes(url.pathname) && url.search === '') {
      event.respondWith(warmShell(request));
    }
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
  // Anything else is not intercepted.
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/logo.svg' ||
    url.pathname === '/manifest.json'
  );
}

/**
 * Pages are keyed by path alone. A query string on a navigation (?next=…) does
 * not change the shell, and keying on it would fill the cache with copies.
 */
function pageKey(request) {
  const url = new URL(request.url);
  return url.origin + url.pathname;
}

/**
 * Network first: a fresh deploy's HTML always wins while there is a network.
 * Cache first here is the classic failure — an old shell pointing at hashed
 * chunks the new deploy deleted, a blank page the student cannot clear.
 */
async function networkFirstPage(request) {
  let response;
  try {
    response = await fetch(request);
  } catch (error) {
    // A real network failure: offline, DNS, connection refused.
    return (await cachedPage(request)) || (await offlinePage());
  }

  // The host answering 502/503/504 (waking up, or down) is "no page" too, but
  // only falls back when there IS a cached copy — otherwise the browser's own
  // error is more honest than the offline page, since the network is up.
  if (response.status === 502 || response.status === 503 || response.status === 504) {
    return (await cachedPage(request)) || response;
  }

  // Only a clean, same-origin 200 that was not a redirect is worth keeping. A
  // redirect stored under /schedule would replay the redirect forever offline.
  //
  // A shell the page has warmed is left alone: within one build it is the same
  // document, and it carries the variant tag this copy cannot have (the worker
  // never sees the cookies that chose its language). Overwriting it would make
  // the page re-warm the route on its next load, every load. A route with
  // nothing stored yet still gets this copy, so a never-warmed route can still
  // come back offline.
  if (response.ok && response.type === 'basic' && !response.redirected) {
    const cache = await caches.open(PAGES_CACHE);
    const key = pageKey(request);
    if (!(await cache.match(key, { ignoreVary: true }))) {
      await cache.put(key, response.clone());
    }
  }
  return response;
}

/**
 * Fetches one route's shell for the page and stores it, tagged with its variant.
 *
 * The page's own request is forwarded as it is: it is a same-origin fetch from
 * the page, so the browser attaches the language and theme cookies on the way
 * out and the server renders the shell in that language and theme.
 *
 * Stored only if it is a clean same-origin 200 HTML document that was not
 * redirected, and only under a variant matching VARIANT_PATTERN. Whatever
 * happens, the page gets the network's answer — or the error — unchanged.
 */
async function warmShell(request) {
  const response = await fetch(request);

  const variant = request.headers.get(WARM_HEADER) || '';
  const contentType = response.headers.get('Content-Type') || '';
  if (
    VARIANT_PATTERN.test(variant) &&
    response.ok &&
    response.type === 'basic' &&
    !response.redirected &&
    contentType.startsWith('text/html')
  ) {
    try {
      const headers = new Headers(response.headers);
      headers.set(VARIANT_HEADER, variant);
      const tagged = new Response(await response.clone().blob(), {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
      const cache = await caches.open(PAGES_CACHE);
      await cache.put(pageKey(request), tagged);
    } catch (error) {
      // Quota, or a body that could not be read: this route stays unwarmed and
      // the page tries again on its next load.
    }
  }

  return response;
}

async function cachedPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  // ignoreVary: Next varies HTML on its router headers, which a navigation and
  // the stored key never carry; matching on them would only ever miss.
  return cache.match(pageKey(request), { ignoreVary: true });
}

async function offlinePage() {
  const cache = await caches.open(STATIC_CACHE);
  const page = await cache.match(OFFLINE_URL);
  return page || Response.error();
}

/**
 * Cache first for content-hashed assets: a hit can never be stale, because a
 * changed file has a new URL. A miss goes to the network and is kept.
 */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;

  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    await cache.put(request, response.clone());
  }
  return response;
}
