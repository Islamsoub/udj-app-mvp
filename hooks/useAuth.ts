import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { isAuthenticated, accessToken, student, showSessionExpired, loaded, loadAuthFromStorage } =
    useAuthStore();

  useEffect(() => {
    if (!loaded) {
      loadAuthFromStorage();
    }
  }, [loaded, loadAuthFromStorage]);

  return { isAuthenticated, accessToken, student, showSessionExpired, loaded };
}
