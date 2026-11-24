import { useAuthStore } from '@/stores/authStore';
import { useNetworkStore } from '@/stores/networkStore';
import {
  getSavedArticlesFromServer,
  httpStatusOf,
  saveArticleOnServer,
  unsaveArticleOnServer,
} from './api';
import { getSavedArticlesDb } from './db';
import {
  recordSaved,
  recordUnsaved,
  refreshBookmarkFlags,
  replaceServerCopy,
  uploadPendingSaves,
  wipeServerCopies,
  type UploadResult,
} from './savedArticlesStore';

/**
 * Saved news articles, server-backed (logic and tests:
 * services/savedArticlesStore.ts).
 *
 *   • syncSavedFromServer — GET, then the local copy is made to match.
 *   • setArticleSaved     — PUT or DELETE; the local copy changes only after
 *                           the server's 204.
 *   • runSavedArticlesUpload — the one-time upload of the saves made on the
 *                           phone before; one run at a time.
 *   • clearSavedArticlesOnLogout — wipe the server copies, keep the pending.
 *
 * Every write ends with refreshBookmarkFlags, so news_cache.bookmarked (what the
 * list and the reader show, online or offline) always follows the table.
 */

function currentStudentId(): string | null {
  const s = useAuthStore.getState();
  return s.isAuthenticated ? s.student?.id ?? null : null;
}

/**
 * Re-derives news_cache.bookmarked for the signed-in student. Called after any
 * news_cache write that may add rows (a list sync, an article fetch), whose new
 * rows arrive with bookmarked = 0.
 */
export async function refreshSavedFlags(): Promise<void> {
  await refreshBookmarkFlags(await getSavedArticlesDb(), currentStudentId());
}

/**
 * Reads the student's saves from the server and keeps a local copy for
 * offline display. Throws when the server cannot be reached: the caller then
 * shows what the local copy already holds.
 */
export async function syncSavedFromServer(): Promise<void> {
  const studentId = currentStudentId();
  if (!studentId) return;
  const saved = await getSavedArticlesFromServer();
  // The student may have signed out while the request was in flight.
  if (currentStudentId() !== studentId) return;
  const db = await getSavedArticlesDb();
  await replaceServerCopy(db, studentId, saved.map((s) => s.articleId));
  await refreshBookmarkFlags(db, studentId);
}

/**
 * Saves or unsaves one article on the server, then records it locally.
 * Nothing changes on the phone until the server's 204: on any failure this
 * throws and the caller keeps the previous state.
 */
export async function setArticleSaved(articleId: string, saved: boolean): Promise<void> {
  const studentId = currentStudentId();
  if (!studentId) throw new Error('signed_out');
  if (saved) await saveArticleOnServer(articleId);
  else await unsaveArticleOnServer(articleId);

  const db = await getSavedArticlesDb();
  if (saved) await recordSaved(db, studentId, articleId);
  else await recordUnsaved(db, studentId, articleId);
  await refreshBookmarkFlags(db, currentStudentId());
}

// ─── One-time upload ────────────────────────────────────────────────────────

let running: Promise<UploadResult | null> | null = null;
let rateLimitRetry: ReturnType<typeof setTimeout> | null = null;
/** Set by logout: the running upload stops before its next save. */
let stopping = false;

/**
 * Uploads the saves made on this phone before the server stored them. Started
 * when a student is signed in and online: at launch, at sign-in and at every
 * reconnect (hooks/useSavedArticlesUpload.ts). Only one run at a time.
 */
export function runSavedArticlesUpload(): Promise<UploadResult | null> {
  if (running) return running;
  running = (async () => {
    const studentId = currentStudentId();
    if (!studentId) return null;
    stopping = false;
    try {
      const db = await getSavedArticlesDb();
      const result = await uploadPendingSaves(
        {
          db,
          put: (id) => saveArticleOnServer(id),
          statusOf: httpStatusOf,
          currentStudentId: () => (stopping ? null : currentStudentId()),
          isOnline: () => useNetworkStore.getState().isOnline,
          sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
          now: () => Date.now(),
        },
        studentId,
      );
      await refreshBookmarkFlags(db, currentStudentId());
      // 429: another client used this minute's quota. Try again in a minute
      // rather than waiting for the next launch.
      if (result.stop === 'rate_limited' && !rateLimitRetry) {
        rateLimitRetry = setTimeout(() => {
          rateLimitRetry = null;
          void runSavedArticlesUpload();
        }, 61_000);
      }
      return result;
    } catch {
      // A local database error. Nothing was lost: pending saves stay pending
      // and are retried next time.
      return null;
    } finally {
      running = null;
    }
  })();
  return running;
}

/**
 * Logout: wipe the copies of the server's saves from this phone; keep every
 * save not yet uploaded. A running upload is told to stop before its next PUT,
 * and the wipe waits for the PUT in flight (at most one) to be recorded, so it
 * is never sent twice.
 */
export async function clearSavedArticlesOnLogout(): Promise<void> {
  stopping = true;
  if (rateLimitRetry) {
    clearTimeout(rateLimitRetry);
    rateLimitRetry = null;
  }
  try {
    await running;
  } catch {
    // The upload's own failure doesn't matter here.
  }
  const db = await getSavedArticlesDb();
  await wipeServerCopies(db);
  await refreshBookmarkFlags(db, null);
}
