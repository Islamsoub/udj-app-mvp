/**
 * Language primitives shared by the server and the client.
 *
 * Deliberately NOT marked 'use client'. lib/i18n.tsx is a client module, and in
 * the App Router every export of a client module becomes a client reference —
 * calling one from a server component fails at runtime with "Attempted to call
 * X() from the server". The root layout has to resolve the language while
 * rendering on the server, so the cookie name and the narrowing helpers live
 * here, where both sides can reach them, instead of being duplicated into a
 * second string literal that would silently drift.
 *
 * Nothing in this file may import React or touch `document` / `window`.
 */

export type Lang = 'fr' | 'ar';
export type Dir = 'ltr' | 'rtl';

export const DEFAULT_LANG: Lang = 'fr';

/**
 * localStorage key for the language preference. Mirrors the cookie so the
 * blocking script in app/layout.tsx can read it before React mounts.
 *
 * Either store is the right home for THIS value and the wrong home for tokens —
 * the distinction is what an attacker gains by reading it. A stolen access token
 * is an account; a stolen "the user reads Arabic" is nothing. Nothing else may
 * go in here: tokens stay in memory and in the httpOnly cookie.
 */
export const LANG_STORAGE_KEY = 'unipocket_lang';

/**
 * The language cookie. Same name as the storage key, deliberately.
 *
 * DO NOT make this httpOnly, and do not "harden" it to match the refresh-token
 * cookie. The two have opposite requirements and only the mechanism in common:
 *
 *   • unipocket_refresh is a CREDENTIAL. httpOnly exists precisely so page
 *     scripts cannot read it, and the client is never meant to see its value.
 *   • unipocket_lang is a DISPLAY PREFERENCE. It must be readable and writable
 *     by client JavaScript — the provider writes it on every switch and the
 *     blocking script reads it before React mounts. Marking it httpOnly would
 *     silently break both: a language switch would appear to work until reload,
 *     then revert.
 *
 * Not Secure-only either: `npm run dev` serves plain HTTP on localhost and a
 * Secure cookie would never be stored there. It carries nothing worth protecting
 * in transit.
 */
export const LANG_COOKIE = 'unipocket_lang';

/** One year. Long enough that a returning student never re-picks a language. */
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLang(value: unknown): value is Lang {
  return value === 'fr' || value === 'ar';
}

export function dirFor(lang: Lang): Dir {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Narrows an untrusted value to a Lang, falling back to French.
 *
 * The cookie is user-editable, so `unipocket_lang=xx` — or anything else — has
 * to resolve to the default rather than be indexed into the dictionaries.
 */
export function resolveLang(value: unknown): Lang {
  return isLang(value) ? value : DEFAULT_LANG;
}

/**
 * The six CLDR plural categories. A plural message in the locale files is an
 * object with exactly these keys, in BOTH files — see PluralForms in
 * lib/i18n-types.ts for why French carries rows it never selects.
 */
export const PLURAL_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'] as const;
export type PluralCategory = (typeof PLURAL_CATEGORIES)[number];

/**
 * One Intl.PluralRules per language, built on first use. Construction is the
 * expensive part (it loads locale data); select() is cheap.
 */
const pluralRules: Partial<Record<Lang, Intl.PluralRules>> = {};

function rulesFor(lang: Lang): Intl.PluralRules {
  let rules = pluralRules[lang];
  if (!rules) {
    rules = new Intl.PluralRules(lang);
    pluralRules[lang] = rules;
  }
  return rules;
}

/**
 * Picks the plural category for `n` in `lang`.
 *
 * `n === 0` is `zero` in every language, ahead of Intl. Design writes the zero
 * row as a distinct sentence ("plus aucune absence possible"), and French Intl
 * files 0 under `one` — Intl alone could never reach that row in French. For
 * Arabic, Intl already says `zero` at 0, so the override changes nothing there.
 *
 * Every other n goes to Intl.PluralRules, which knows Arabic's few (3–10,
 * 103–110…) and many (11–99, 111–199…) ranges. Pure: no React, no DOM, so it is
 * safe on the server and testable under Node.
 */
export function pluralCategory(lang: Lang, n: number): PluralCategory {
  if (n === 0) return 'zero';
  return rulesFor(lang).select(n) as PluralCategory;
}
