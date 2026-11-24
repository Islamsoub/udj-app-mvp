import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNetworkStore } from '@/stores/networkStore';
import { runSavedArticlesUpload } from '@/services/savedArticles';

/**
 * Uploads the news saves made on this phone before the server stored them,
 * once the local database is ready, a student is signed in and the phone is
 * online. Runs again at every sign-in and every reconnect, so a run stopped by
 * a network error or a 5xx picks up where it left off.
 */
export function useSavedArticlesUpload(dbReady: boolean): void {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const studentId = useAuthStore((s) => s.student?.id ?? null);
  const isOnline = useNetworkStore((s) => s.isOnline);

  useEffect(() => {
    if (!dbReady || !isAuthenticated || !studentId || !isOnline) return;
    void runSavedArticlesUpload();
  }, [dbReady, isAuthenticated, studentId, isOnline]);
}
