import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

interface SettingsState {
  language: 'fr' | 'ar';
  isRTL: boolean;
  notificationsEnabled: boolean;
  widgetOrder: string[];
  setLanguage: (lang: 'fr' | 'ar') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setWidgetOrder: (order: string[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'fr',
      isRTL: false,
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
    }
  )
);
