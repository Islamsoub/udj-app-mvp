import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { isLoggedIn, token, studentId, showSessionExpired, loaded, loadAuthFromStorage } =
    useAuthStore();

  useEffect(() => {
    if (!loaded) {
      loadAuthFromStorage();
    }
  }, [loaded, loadAuthFromStorage]);

  return { isLoggedIn, token, studentId, showSessionExpired, loaded };
}
