import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
// AsyncStorage (not SecureStore) — theme preference is not sensitive.

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeStore {
  mode: ThemeMode;
  // False until the persisted mode has been read back from AsyncStorage.
  // Rendering before then flashes the default ('system') over the saved choice.
  _hasHydrated: boolean;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      mode: 'system',
      _hasHydrated: false,
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => AsyncStorage),
      // See settingsStore — fires on both the success and error paths, so the
      // boot gate releases even if the storage read fails.
      onRehydrateStorage: () => () => {
        useThemeStore.setState({ _hasHydrated: true });
      },
    }
  )
);
