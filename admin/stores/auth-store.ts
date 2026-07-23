import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AdminIdentity } from '@/lib/types';

/**
 * Admin auth state.
 *
 * The refresh token is NOT here and never touches JavaScript — the backend
 * issues it as an httpOnly cookie scoped to /admin/auth, so an XSS on the
 * portal cannot exfiltrate a 30-day credential.
 *
 * The 1-hour access token and the admin identity persist in localStorage so a
 * page reload doesn't flash the login screen; the short TTL keeps the exposure
 * bounded, and the cookie silently re-issues it.
 */
export interface AuthState {
  accessToken: string | null;
  admin: AdminIdentity | null;
  isAuthenticated: boolean;
  login: (accessToken: string, admin: AdminIdentity) => void;
  logout: () => void;
  setAccessToken: (accessToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      admin: null,
      isAuthenticated: false,
      login: (accessToken, admin) => set({ accessToken, admin, isAuthenticated: true }),
      logout: () => set({ accessToken: null, admin: null, isAuthenticated: false }),
      setAccessToken: (accessToken) => set({ accessToken }),
    }),
    {
      name: 'unipocket-admin-auth',
      storage: createJSONStorage(() => localStorage),
      // Whitelist what reaches localStorage — a future state field can never
      // leak in by accident, and `refreshToken` can never come back.
      partialize: (state) => ({
        accessToken: state.accessToken,
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
      // v0 → v1: v0 persisted a 30-day `refreshToken`. Drop it (and the stale
      // session with it) so existing browsers purge the value on next load.
      version: 1,
      migrate: () => ({ accessToken: null, admin: null, isAuthenticated: false }),
    }
  )
);
