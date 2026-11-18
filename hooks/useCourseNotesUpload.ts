import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNetworkStore } from '@/stores/networkStore';
import { runCourseNotesUpload } from '@/services/courseNotesSync';

/**
 * Uploads the notes written on this phone before the server stored them, once
 * the local database is ready, a student is signed in and the phone is online.
 * Runs again at every sign-in and every reconnect, so a run stopped by a network
 * error picks up where it left off.
 */
export function useCourseNotesUpload(dbReady: boolean): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const studentId = useAuthStore((s) => s.student?.id ?? null);
  const isOnline = useNetworkStore((s) => s.isOnline);

  useEffect(() => {
    if (!dbReady || !isAuthenticated || !studentId || !isOnline) return;
    void runCourseNotesUpload();
  }, [dbReady, isAuthenticated, studentId, isOnline]);
}
