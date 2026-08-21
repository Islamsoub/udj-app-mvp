import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

interface SettingsState {
  language: 'fr' | 'ar';
  isRTL: boolean;
  notificationsEnabled: boolean;
  widgetOrder: string[];
  // False until persisted settings have been read back from AsyncStorage.
  // Boot-time consumers (app/_layout.tsx) must wait for this before applying
  // language/RTL, or they apply the defaults and overwrite the saved values.
  _hasHydrated: boolean;
  setLanguage: (lang: 'fr' | 'ar') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setWidgetOrder: (order: string[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'fr',
      isRTL: false,
      _hasHydrated: false,
      notificationsEnabled: true,
      widgetOrder: ['agenda', 'stats', 'news'],
      setLanguage: (lang) => {
        const isRTL = lang === 'ar';
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(isRTL);
        set({ language: lang, isRTL });
      },
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setWidgetOrder: (order) => set({ widgetOrder: order }),
    }),
    {
      name: 'udj-settings',
      storage: createJSONStorage(() => AsyncStorage),
      // Fires on success AND on a failed storage read (where zustand passes
      // state as undefined), so setState is used instead of the callback's
      // state arg — a read failure must still release the boot gate rather
      // than leave the app on a blank screen forever.
      onRehydrateStorage: () => () => {
        useSettingsStore.setState({ _hasHydrated: true });
      },
    }
  )
);
