import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'udj_jwt';
const REFRESH_KEY = 'udj_refresh';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  studentId: string | null;
  isLoggedIn: boolean;
  showSessionExpired: boolean;
  loaded: boolean;
  setAuth: (token: string, refreshToken: string, studentId: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  setShowSessionExpired: (show: boolean) => void;
  loadAuthFromStorage: () => Promise<void>;
}

function decodeStudentId(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub ?? payload.studentId ?? null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  refreshToken: null,
  studentId: null,
  isLoggedIn: false,
  showSessionExpired: false,
  loaded: false,

  setAuth: async (token, refreshToken, studentId) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    set({ token, refreshToken, studentId, isLoggedIn: true, showSessionExpired: false });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    set({ token: null, refreshToken: null, studentId: null, isLoggedIn: false });
  },

  setShowSessionExpired: (show) => set({ showSessionExpired: show }),

  loadAuthFromStorage: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (token && refreshToken) {
        const studentId = decodeStudentId(token);
        set({ token, refreshToken, studentId, isLoggedIn: true, loaded: true });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },
}));
