// Must run before i18n.init. i18next resolves plural forms through
// Intl.PluralRules, which Hermes on Android does not ship; without it i18next
// silently falls back to one/other only, and Arabic loses its zero, two, few
// and many forms. The polyfill installs itself only when the native
// implementation is missing or incomplete.
import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    ar: { translation: ar },
  },
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
