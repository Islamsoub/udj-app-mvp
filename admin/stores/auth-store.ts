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

const AUTH_STORAGE_KEY = 'unipocket-admin-auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      admin: null,
      isAuthenticated: false,
      login: (accessToken, admin) => set({ accessToken, admin, isAuthenticated: true }),
      logout: () => {
        set({ accessToken: null, admin: null, isAuthenticated: false });
        // Leave nothing behind, not even an empty record: the next person on a
        // shared computer finds no trace of who was signed in.
        useAuthStore.persist.clearStorage();
      },
      setAccessToken: (accessToken) => set({ accessToken }),
    }),
    {
      name: AUTH_STORAGE_KEY,
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

/**
 * Sign-out reaches every open tab.
 *
 * Each tab holds its own copy of this store in memory. Signing out in one tab
 * cleared localStorage, but a second tab kept the admin's identity and a live
 * access token (valid up to 15 minutes) and went on showing data — and its
 * next write to the store put the identity back into localStorage. The
 * `storage` event fires in every other tab of the origin when the record is
 * removed or marked signed out; those tabs drop their state too, and the
 * dashboard guard sends them to /login.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== AUTH_STORAGE_KEY && event.key !== null) return; // null: storage.clear()
    let signedIn = false;
    try {
      signedIn = event.newValue ? JSON.parse(event.newValue)?.state?.isAuthenticated === true : false;
    } catch {
      signedIn = false;
    }
    if (!signedIn && useAuthStore.getState().isAuthenticated) {
      useAuthStore.getState().logout();
    }
  });
}
