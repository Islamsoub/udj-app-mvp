/**
 * The consent-gated offline copy of the student's own data, in IndexedDB.
 *
 * WHAT IT IS FOR. A student who opted in on the login screen (or in Profile)
 * keeps reading their timetable, grades and attendance when the network is gone
 * or the backend is cold-starting. Nothing else: no background sync, no write
 * queue, no eviction beyond overwrite-in-place.
 *
 * WHERE IT IS HOOKED. lib/api-client's apiFetch, and nowhere else — every helper
 * goes through it. This module never issues a request of its own.
 *
 * WHAT IT IS NOT. The service worker (public/sw.js) never sees any of this: it
 * does not intercept /api, and personal data never enters Cache Storage. The
 * store lives in the page's origin, written and read only by this file.
 *
 * FAILURE IS SILENT, ALWAYS. IndexedDB throws outright in some private-browsing
 * contexts and can throw QuotaExceededError on any write. Every entry point here
 * catches, and the worst outcome is "there is no cache" — which is exactly the
 * app's behaviour without this module.
 */

/**
 * Bump when the shape of any cached payload changes in a deploy. The database
 * is opened at this version; a stored database at any other version — newer
 * after a rollback, older after an upgrade — is emptied before use, so a
 * payload written under one shape is never handed to code expecting another.
 */
const SCHEMA_VERSION = 1;

const DB_NAME = 'unipocket';
const STORE = 'cache';

/**
 * THE ALLOW-LIST — the only GETs ever written or read back. Each path maps to
 * the query params it may carry; a request with any other param is not cached
 * at all rather than cached under a key nobody will look up.
 *
 * Never cached: /auth/*, /student/notifications, /student/preferences, /news,
 * and any request that is not a GET (the justification upload included).
 *
 * ── QR TOKENS MUST NEVER BE ADDED HERE ──────────────────────────────────────
 * If a rotating QR / student-card token endpoint lands, it stays off this list.
 * The token is a 60-second credential; a stored copy outlives its window and,
 * replayed offline, is a forgeable card. Its whole security rests on the copy
 * the student holds always being fresh from the server.
 */
const CACHEABLE = new Map<string, readonly string[]>([
  ['/student/me', []],
  ['/student/schedule', ['semesterId']],
  ['/student/grades', ['semesterId', 'allSemesters']],
  ['/student/attendance', []],
]);

/** One stored response. `path` is the normalised key, and the store's keyPath. */
export interface CacheEntry {
  path: string;
  /** The parsed body, stored as an object (structured clone), not a JSON string. */
  payload: unknown;
  /** Epoch milliseconds — UTC by definition; converted to local time only on display. */
  savedAt: number;
  /** Whose data this is. Every entry in the store carries the same one. */
  studentId: string;
}

// ── Consent ───────────────────────────────────────────────────────────────────

/**
 * Per-device preference key, written by the login screen's OfflineDataSwitch
 * and Profile's mirror of it (both import it from OfflineDataSwitch).
 *
 * A preference, like the language — not a credential. It records a choice about
 * this machine, which is exactly what a shared machine in the salle info needs
 * it to be: it must not follow the student to another device, and it must
 * survive the reload that follows login.
 *
 * Nothing is stored under it but 'true' / 'false'. Tokens stay in memory and in
 * the httpOnly cookie, as always.
 */
export const OFFLINE_CACHE_KEY = 'unipocket_offline_cache';

/**
 * The student's answer, read fresh on every call — it can change in Profile or
 * in another tab at any moment. An absent or unreadable value means OFF: the
 * safe default on a shared machine.
 */
export function isOfflineCacheEnabled(): boolean {
  try {
    return window.localStorage.getItem(OFFLINE_CACHE_KEY) === 'true';
  } catch {
    return false;
  }
}

// ── Last validated session ───────────────────────────────────────────────────

/**
 * When the server last confirmed a session on this browser (epoch ms, UTC):
 * written on every successful login and every successful refresh — the cold-load
 * session check and the mid-session refresh both go through that one call.
 */
const VALIDATED_AT_KEY = 'unipocket_session_validated_at';

/**
 * How long a store may be shown with no server confirming anyone is signed in.
 *
 * This exists for the salle info, not as a guess at session length. A student
 * who leaves consent on and walks away without logging out leaves their copy
 * behind; the dead-session wipe that would remove it needs a round trip, and
 * with the network down there is none. Without a bound, whoever sits down next
 * at that machine during an outage opens the app on the previous student's
 * grades. 12 hours covers a student's own day — they come back to their own
 * laptop that evening and still read offline — while a lab machine is
 * overwhelmingly reused by someone else well within a day. The same bound also
 * covers a wipe that failed or was blocked: the residue is never shown unvouched
 * for longer than this.
 */
const UNVALIDATED_DISPLAY_LIMIT_MS = 12 * 60 * 60 * 1000;

/** The server just confirmed a session. */
export function markSessionValidated(): void {
  try {
    window.localStorage.setItem(VALIDATED_AT_KEY, String(Date.now()));
  } catch {
    // Unwritable storage: the stamp stays absent and the store will not be
    // shown without a session — the safe failure.
  }
}

/**
 * Whether a session was confirmed within UNVALIDATED_DISPLAY_LIMIT_MS. Absent,
 * unreadable, malformed or in the future (a clock moved back) all read as no.
 */
export function sessionValidatedRecently(): boolean {
  try {
    const raw = window.localStorage.getItem(VALIDATED_AT_KEY);
    if (raw === null) return false;
    const at = Number(raw);
    const age = Date.now() - at;
    return Number.isFinite(at) && age >= 0 && age <= UNVALIDATED_DISPLAY_LIMIT_MS;
  } catch {
    return false;
  }
}

/**
 * The session is over on this browser — logout, or a session found dead. The
 * stamp goes first and synchronously, so nothing can vouch for the store while
 * the wipe is still running, or if it fails.
 */
export async function endOfflineSession(): Promise<void> {
  try {
    window.localStorage.removeItem(VALIDATED_AT_KEY);
  } catch {
    // Unreadable storage cannot vouch for anything either.
  }
  await clearOfflineCache();
}

// ── Keys ──────────────────────────────────────────────────────────────────────

/**
 * The store key for a GET to `path`, or null if `path` is not on the allow-list.
 *
 * Params are sorted, so `?a=1&b=2` and `?b=2&a=1` are one entry and
 * `?semesterId=S1` and `?allSemesters=true` are two. The path must match
 * exactly: `/student/attendance/:id/justification` is not `/student/attendance`.
 */
export function cacheKeyFor(path: string): string | null {
  const q = path.indexOf('?');
  const pathname = q === -1 ? path : path.slice(0, q);

  const allowed = CACHEABLE.get(pathname);
  if (allowed === undefined) return null;

  const params = new URLSearchParams(q === -1 ? '' : path.slice(q + 1));
  for (const name of params.keys()) {
    if (!allowed.includes(name)) return null;
  }

  params.sort();
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

// ── Database ──────────────────────────────────────────────────────────────────

/**
 * One connection per page, opened lazily. A failure to open is remembered as
 * null — in a private window it would fail identically every time — and the
 * slot is reset only when another tab asks to upgrade the schema.
 */
let dbPromise: Promise<IDBDatabase | null> | null = null;

/**
 * A blocked open or delete — another tab holding a connection it will not
 * close — would otherwise leave the promise pending indefinitely, and logout()
 * awaits a wipe. Rejecting turns it into the ordinary "no cache" outcome.
 */
function blocked(): DOMException {
  return new DOMException('IndexedDB blocked by another connection', 'AbortError');
}

function promisify<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    if (req instanceof IDBOpenDBRequest) req.onblocked = () => reject(blocked());
  });
}

function completion(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function openAtSchemaVersion(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, SCHEMA_VERSION);

    // Fires on first open and whenever the stored version is OLDER than
    // SCHEMA_VERSION. Whatever was there was written under another payload
    // shape, so it is dropped rather than migrated: it is a cache, and the next
    // successful GET refills it.
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(STORE)) db.deleteObjectStore(STORE);
      db.createObjectStore(STORE, { keyPath: 'path' });
    };

    req.onsuccess = () => {
      const db = req.result;
      // Another tab running a newer deploy wants to upgrade. Step aside, so its
      // upgrade is not blocked by this connection, and reopen on next use.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(blocked());
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  try {
    return await openAtSchemaVersion();
  } catch (err) {
    // The stored database is NEWER than this code — a deploy was rolled back.
    // IndexedDB cannot open a version downwards, so the stale database is
    // deleted and recreated at ours: the other half of "differs, so clear".
    if (err instanceof DOMException && err.name === 'VersionError') {
      await promisify(indexedDB.deleteDatabase(DB_NAME));
      return openAtSchemaVersion();
    }
    throw err;
  }
}

function db(): Promise<IDBDatabase | null> {
  if (dbPromise === null) {
    dbPromise =
      typeof indexedDB === 'undefined'
        ? Promise.resolve(null)
        : openDatabase().catch(() => null);
  }
  return dbPromise;
}

function isEntry(value: unknown): value is CacheEntry {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.path === 'string' &&
    typeof v.savedAt === 'number' &&
    typeof v.studentId === 'string' &&
    'payload' in v
  );
}

// ── Generations: no write lands after a wipe ─────────────────────────────────

/**
 * Bumped synchronously by every wipe. A request records the generation it
 * started in, and its write is dropped if a wipe has happened since.
 *
 * Without this, a GET still in flight when the student logs out would resolve
 * after the wipe and write their grades straight back into the store on a
 * machine they have just walked away from.
 *
 * The check is repeated inside the write's own transaction setup, synchronously
 * before the transaction is created. IndexedDB runs readwrite transactions on
 * one store in creation order, so a write is either created before the wipe's
 * transaction (and then wiped by it) or after the bump (and then refused).
 */
let generation = 0;

/** Taken by apiFetch when a cacheable request starts. */
export function cacheTicket(): number {
  return generation;
}

// ── Write path ────────────────────────────────────────────────────────────────

/**
 * Stores one successful response. Fire and forget: returns nothing to await,
 * and nothing in the render path waits on IndexedDB.
 *
 * Nothing is written while consent is off — checked here and again just before
 * the transaction, since the student may switch it off while the store opens.
 *
 * If the store holds another student's entries, they are all cleared in the
 * same transaction, before this one is put: a second student on this browser
 * never shares a store with the first, even for an instant.
 */
export function rememberResponse(
  key: string,
  payload: unknown,
  studentId: string,
  ticket: number
): void {
  void (async () => {
    if (ticket !== generation || !isOfflineCacheEnabled()) return;

    const database = await db();
    if (database === null) return;
    if (ticket !== generation || !isOfflineCacheEnabled()) return;

    const tx = database.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const done = completion(tx);

    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const first = cursor.result?.value;
      if (isEntry(first) && first.studentId !== studentId) store.clear();
      const entry: CacheEntry = { path: key, payload, savedAt: Date.now(), studentId };
      store.put(entry);
    };

    await done;
  })().catch(() => {
    // QuotaExceededError, a closed connection, a private window: no cache.
  });
}

// ── Read path ─────────────────────────────────────────────────────────────────

/**
 * The stored copy for `key`, or null.
 *
 * `studentId` is the signed-in student when there is an access token. When
 * there is none — an offline reload, where the session could not be checked —
 * it is null and any entry is returned: the store only ever holds one student,
 * and it is the one this browser last had signed in with consent on.
 */
export async function readCachedResponse(
  key: string,
  studentId: string | null
): Promise<CacheEntry | null> {
  if (!isOfflineCacheEnabled()) return null;
  try {
    const database = await db();
    if (database === null) return null;

    const value = await promisify(database.transaction(STORE, 'readonly').objectStore(STORE).get(key));
    if (!isEntry(value)) return null;
    if (studentId !== null && value.studentId !== studentId) return null;
    return value;
  } catch {
    return null;
  }
}

/**
 * Consent is on AND at least one entry exists. Consent alone proves only that
 * the student said yes, not that anything was ever stored.
 */
export async function hasCachedData(): Promise<boolean> {
  if (!isOfflineCacheEnabled()) return false;
  try {
    const database = await db();
    if (database === null) return false;
    const count = await promisify(database.transaction(STORE, 'readonly').objectStore(STORE).count());
    return count > 0;
  } catch {
    return false;
  }
}

/**
 * How long a caller that blocks the UI may wait for hasCachedData. A healthy
 * IndexedDB answers in milliseconds; this only bounds a stalled one. A BLOCKED
 * open already fails fast (`onblocked` rejects), but an open or a transaction
 * that never fires any event at all — some WebKit releases have done exactly
 * that — would otherwise leave the caller waiting forever.
 */
export const STORE_CHECK_TIMEOUT_MS = 1500;

/**
 * hasCachedData with a deadline: after STORE_CHECK_TIMEOUT_MS the answer is
 * false, "no cache". Used wherever the screen cannot move on without an answer —
 * the session-expired modal's action row and the shell's offline gate.
 */
export function hasCachedDataWithin(): Promise<boolean> {
  const timeout = new Promise<boolean>((resolve) => {
    window.setTimeout(() => resolve(false), STORE_CHECK_TIMEOUT_MS);
  });
  return Promise.race([hasCachedData(), timeout]);
}

// ── Wipes ─────────────────────────────────────────────────────────────────────

/**
 * Empties the store. Used on logout, on a dead session, and when consent is
 * switched off. Never rejects.
 *
 * The generation bump is synchronous, before any await, so every request
 * already in flight loses its right to write the moment this is called.
 *
 * The served-from-cache marks are left alone: data already on screen is still
 * as old as its label says, whether or not a copy remains in the store.
 */
export async function clearOfflineCache(): Promise<void> {
  generation += 1;
  try {
    const database = await db();
    if (database === null) return;
    const tx = database.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    await completion(tx);
  } catch {
    // Nothing reachable to clear.
  }
}

/**
 * Called on every successful login, before anything new can be written.
 *
 * Consent off: nothing may be held, so everything goes. Consent on: the store is
 * kept only if it belongs to the student who just signed in — a second student
 * on the same browser starts from an empty store. (rememberResponse enforces the
 * same rule per write; this makes it true before the first screen even loads.)
 */
export async function adoptStudent(studentId: string): Promise<void> {
  if (!isOfflineCacheEnabled()) {
    await clearOfflineCache();
    return;
  }

  let foreign = false;
  try {
    const database = await db();
    if (database === null) return;
    const cursor = await promisify(database.transaction(STORE, 'readonly').objectStore(STORE).openCursor());
    const first = cursor?.value;
    foreign = isEntry(first) && first.studentId !== studentId;
  } catch {
    return;
  }

  if (foreign) await clearOfflineCache();
}

// ── What is on screen right now came from the store ──────────────────────────

/**
 * Keys currently being shown from the store rather than from the network, with
 * when each was saved. The offline banner reads the OLDEST — when a screen mixes
 * entries of different ages, the label must not make any of them look newer
 * than it is.
 *
 * In memory only; it describes this page, not the store.
 */
const served = new Map<string, number>();
const listeners = new Set<() => void>();
let oldestServed: number | null = null;

function publish(): void {
  let oldest: number | null = null;
  for (const savedAt of served.values()) {
    if (oldest === null || savedAt < oldest) oldest = savedAt;
  }
  if (oldest === oldestServed) return;
  oldestServed = oldest;
  for (const listener of listeners) listener();
}

/** apiFetch fell back to the store for `key`. */
export function markServedFromCache(key: string, savedAt: number): void {
  served.set(key, savedAt);
  publish();
}

/** A fresh response for `key` arrived; whatever was shown for it is current now. */
export function markFresh(key: string): void {
  if (served.delete(key)) publish();
}

/**
 * Drops every mark: the screen that showed them has gone. Called by the shell on
 * every route change, including its first mount after a login; the next screen's
 * own fallbacks mark themselves.
 */
export function forgetServed(): void {
  if (served.size === 0) return;
  served.clear();
  publish();
}

/** For useSyncExternalStore. */
export function subscribeServed(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** For useSyncExternalStore: a primitive, so the snapshot is stable between changes. */
export function oldestServedAt(): number | null {
  return oldestServed;
}
