import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AdminIdentity } from '@/lib/types';

/**
 * Admin auth state. Tokens persist in localStorage (web-only portal — the
 * mobile-app SecureStore rule does not apply here; documented decision in the
 * task spec). The admin identity comes from the login response and refreshes
 * survive because the JWT only carries { adminId, role, facultyId }.
 */
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  admin: AdminIdentity | null;
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string, admin: AdminIdentity) => void;
  logout: () => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      admin: null,
      isAuthenticated: false,
      login: (accessToken, refreshToken, admin) =>
        set({ accessToken, refreshToken, admin, isAuthenticated: true }),
      logout: () =>
        set({ accessToken: null, refreshToken: null, admin: null, isAuthenticated: false }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
    }),
    {
      name: 'unipocket-admin-auth',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
