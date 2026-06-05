import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';

type TextSizeValue = 'small' | 'normal' | 'large';

interface SettingsState {
  language: 'fr' | 'ar';
  isRTL: boolean;
  notificationsEnabled: boolean;
  widgetOrder: string[];
  textSize: TextSizeValue;
  setLanguage: (lang: 'fr' | 'ar') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setWidgetOrder: (order: string[]) => void;
  setTextSize: (size: TextSizeValue) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'fr',
      isRTL: false,
      notificationsEnabled: true,
      widgetOrder: ['agenda', 'stats', 'news'],
      textSize: 'normal',
      setLanguage: (lang) => {
        const isRTL = lang === 'ar';
        I18nManager.allowRTL(true);
        I18nManager.forceRTL(isRTL);
        set({ language: lang, isRTL });
      },
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setWidgetOrder: (order) => set({ widgetOrder: order }),
      setTextSize: (size) => set({ textSize: size }),
    }),
    {
      name: 'udj-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
