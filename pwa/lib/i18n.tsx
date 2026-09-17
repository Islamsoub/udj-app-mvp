'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  arMessages,
  frMessages,
  type TranslationKey,
  type TranslationParams,
} from '@/lib/i18n-types';

export type Lang = 'fr' | 'ar';
export type Dir = 'ltr' | 'rtl';

/**
 * Where the language preference is persisted.
 *
 * localStorage is the right home for THIS value and the wrong home for tokens —
 * the distinction is what an attacker gains by reading it. A stolen access token
 * is an account; a stolen "the user reads Arabic" is nothing. The language must
 * also survive a reload and be readable by a blocking script before React
 * mounts (see the inline script in app/layout.tsx), which rules out holding it
 * in memory the way lib/auth-token.ts holds the access token.
 *
 * Nothing else may go in here. Tokens stay in memory and in the httpOnly cookie.
 */
export const LANG_STORAGE_KEY = 'unipocket_lang';

export const DEFAULT_LANG: Lang = 'fr';

const dictionaries: Record<Lang, unknown> = { fr: frMessages, ar: arMessages };

export function isLang(value: unknown): value is Lang {
  return value === 'fr' || value === 'ar';
}

export function dirFor(lang: Lang): Dir {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/** Walks a dotted path. Returns null for a missing path or a non-string leaf. */
function lookup(tree: unknown, key: string): string | null {
  let node: unknown = tree;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return null;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : null;
}

/**
 * Replaces `{{name}}` with the matching param. An unmatched placeholder is left
 * in place rather than blanked — a visible `{{minutes}}` in a screenshot is a
 * bug report, whereas an empty gap reads as intentional and goes unnoticed.
 */
function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match
  );
}

export interface I18nValue {
  lang: Lang;
  dir: Dir;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Starts on the default so the server-rendered markup and the first client
  // render agree; the stored preference is applied in the effect below. The
  // <html> lang/dir are already correct by then — the blocking script in the
  // root layout sets them before first paint.
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
      if (isLang(stored)) setLangState(stored);
    } catch {
      // Private mode or blocked storage: stay on the default.
    }
  }, []);

  // Keeps the document in step with the state, including the very first pass —
  // which corrects <html> if storage was unreadable by the blocking script.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = dirFor(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // Not persisting is survivable; the session still switches.
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams): string => {
      const template = lookup(dictionaries[lang], key);

      if (template === null) {
        // The key itself, so a gap in the UI names the thing that is missing.
        // The typed TranslationKey union plus the fr/ar shape check should make
        // this unreachable; if it fires, one of those guards was bypassed.
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[i18n] missing translation: ${lang}.${key}`);
        }
        return key;
      }

      return interpolate(template, params);
    },
    [lang]
  );

  const value = useMemo<I18nValue>(
    () => ({ lang, dir: dirFor(lang), setLang, t }),
    [lang, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside an I18nProvider');
  return ctx;
}

/** Shorthand for components that only need the translate function. */
export function useTranslation() {
  return useI18n().t;
}
