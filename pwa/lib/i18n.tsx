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

/**
 * Cookie name, storage key, DEFAULT_LANG and the narrowing helpers live in
 * lib/i18n-shared.ts, not here. This module is 'use client', which turns every
 * one of its exports into a client reference — the root layout has to resolve
 * the language on the SERVER, and calling a client export from there fails at
 * runtime. Only types are re-exported below; import the values from i18n-shared.
 */
import {
  DEFAULT_LANG,
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  LANG_STORAGE_KEY,
  dirFor,
  isLang,
  type Dir,
  type Lang,
} from '@/lib/i18n-shared';

export type { Dir, Lang } from '@/lib/i18n-shared';

const dictionaries: Record<Lang, unknown> = { fr: frMessages, ar: arMessages };

function readLangCookie(): Lang | null {
  const match = document.cookie.match(/(?:^|;\s*)unipocket_lang=([^;]*)/);
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  return isLang(value) ? value : null;
}

function writeLangCookie(lang: Lang): void {
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function writeLangStorage(lang: Lang): void {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    // Not persisting here is survivable — the cookie is the one the server reads.
  }
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

export interface I18nProviderProps {
  /**
   * The language the SERVER rendered in, resolved from the cookie. Starting here
   * rather than at DEFAULT_LANG is the whole point of the cookie: the first
   * client render matches the HTML that was sent, so there is no French-to-Arabic
   * swap after mount and no hydration mismatch.
   */
  initialLang?: Lang;
  children: ReactNode;
}

export function I18nProvider({ initialLang = DEFAULT_LANG, children }: I18nProviderProps) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  // Reconciles the two stores once on mount.
  //
  // The cookie is authoritative, because it is what the server just rendered
  // from — believing localStorage over it would mean re-rendering away from the
  // markup already on screen, which is the flash this change exists to remove.
  //
  // The localStorage branch is the migration path: a student who picked a
  // language before this shipped has storage but no cookie. Adopt it, write the
  // cookie, and every later load is server-correct.
  useEffect(() => {
    const fromCookie = readLangCookie();

    if (fromCookie) {
      if (fromCookie !== lang) setLangState(fromCookie);
      writeLangStorage(fromCookie);
      return;
    }

    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(LANG_STORAGE_KEY);
    } catch {
      // Private mode or blocked storage: nothing to migrate.
    }

    if (isLang(stored)) {
      setLangState(stored);
      writeLangCookie(stored);
    }
    // `lang` is read but intentionally not a dependency: this runs once, at
    // mount, against the value the server chose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps the document in step with the state. On a cookie-backed load the
  // attributes already match and this is a no-op; it earns its keep on a
  // switch, and on the migration path above.
  useEffect(() => {
    const el = document.documentElement;
    el.lang = lang;
    el.dir = dirFor(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    // Cookie first — it is the one that decides what the next navigation renders.
    writeLangCookie(next);
    writeLangStorage(next);
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
