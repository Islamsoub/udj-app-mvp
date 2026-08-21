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
 * The access token is deliberately NOT persisted — it lives in memory only.
 * localStorage is readable by any script on the origin, so a single XSS handed
 * an attacker a live bearer token for whatever role the victim held. Nothing to
 * read means nothing to steal.
 *
 * No UX cost: the admin identity still persists (so a reload doesn't flash the
 * login screen), and the first API call after a reload goes out unauthenticated,
 * gets a 401, and the interceptor in lib/api.ts silently exchanges the httpOnly
 * refresh cookie for a fresh access token and retries the request.
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
      // leak in by accident, and no token of any kind can come back.
      // `accessToken` is absent by design; see the note above.
      partialize: (state) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
      }),
      // v0 → v1: v0 persisted a 30-day `refreshToken`.
      // v1 → v2: v1 persisted the access token. Both migrations drop the stored
      // credential; v2 keeps the session flag so the reload path stays silent,
      // and the 401 interceptor mints a new access token on the first call.
      version: 2,
      migrate: (persisted) => {
        const prev = (persisted ?? {}) as Partial<AuthState>;
        return {
          accessToken: null,
          admin: prev.admin ?? null,
          isAuthenticated: prev.isAuthenticated ?? false,
        };
      },
    }
  )
);
