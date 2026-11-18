import { useAuthStore } from '@/stores/authStore';
import { useNetworkStore } from '@/stores/networkStore';
import { createCourseNote, httpStatusOf } from './api';
import { getCourseNotesDb } from './db';
import { uploadPendingNotes, wipeServerCopies, type UploadResult } from './courseNotesStore';

/**
 * Runs the one-time upload of notes written on the phone before the server
 * stored them (logic and tests: services/courseNotesStore.ts).
 *
 * Started when a student is signed in and online: at launch, at sign-in and at
 * every reconnect (hooks/useCourseNotesUpload.ts). Only one run at a time: two
 * overlapping runs could both read the same pending note and send it twice.
 */

let running: Promise<UploadResult | null> | null = null;
let rateLimitRetry: ReturnType<typeof setTimeout> | null = null;
/** Set by logout: the running upload stops before its next note. */
let stopping = false;

export function runCourseNotesUpload(): Promise<UploadResult | null> {
  if (running) return running;
  running = (async () => {
    const studentId = useAuthStore.getState().student?.id ?? null;
    if (!studentId || !useAuthStore.getState().isAuthenticated) return null;
    stopping = false;
    try {
      const result = await uploadPendingNotes(
        {
          db: await getCourseNotesDb(),
          post: createCourseNote,
          statusOf: httpStatusOf,
          currentStudentId: () =>
            !stopping && useAuthStore.getState().isAuthenticated ? useAuthStore.getState().student?.id ?? null : null,
          isOnline: () => useNetworkStore.getState().isOnline,
          sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
          now: () => Date.now(),
        },
        studentId,
      );
      // 429: the student's own notes (or another device) used this minute's quota.
      // Try again in a minute rather than waiting for the next launch.
      if (result.stop === 'rate_limited' && !rateLimitRetry) {
        rateLimitRetry = setTimeout(() => {
          rateLimitRetry = null;
          void runCourseNotesUpload();
        }, 61_000);
      }
      return result;
    } catch {
      // A local database error. Nothing was lost: pending notes stay pending and
      // are retried next time. Deliberately not logged (the error could quote a note).
      return null;
    } finally {
      running = null;
    }
  })();
  return running;
}

/**
 * Logout: wipe the copies of server notes from this phone; keep every note that
 * is not on the server (still to upload, or refused by the server). A running
 * upload is told to stop before its next note, and the wipe waits for the POST
 * in flight (at most one) to be recorded, so that note is never sent twice.
 */
export async function clearCourseNotesOnLogout(): Promise<void> {
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
  await wipeServerCopies(await getCourseNotesDb());
}
