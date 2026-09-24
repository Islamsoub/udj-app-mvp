/**
 * Theme primitives shared by the server and the client.
 *
 * NOT 'use client', for the same reason as lib/i18n-shared.ts: the root layout
 * resolves the theme from the cookie while rendering on the server, and every
 * export of a client module is a client reference it cannot call. So the cookie
 * name, the narrowing helper and the pre-paint script live here, once.
 *
 * Nothing in this file may import React or touch `document` / `window` at
 * module scope. THEME_BOOTSTRAP is a string; it only runs in the browser.
 */

/** What the student chose. `system` follows the OS setting, live. */
export type ThemePref = 'light' | 'dark' | 'system';

/** What is actually applied to <html data-theme>. */
export type Theme = 'light' | 'dark';

export const DEFAULT_THEME_PREF: ThemePref = 'light';

/**
 * Cookie and storage key, same name, same reasoning as the language: a DISPLAY
 * PREFERENCE that client JavaScript must read and write, so never httpOnly, and
 * not Secure-only because `npm run dev` is plain HTTP. The cookie is what lets
 * the server render the right theme into the first byte of HTML; localStorage
 * mirrors it.
 */
export const THEME_COOKIE = 'unipocket_theme';
export const THEME_STORAGE_KEY = 'unipocket_theme';

/** One year, like the language. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isThemePref(value: unknown): value is ThemePref {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** The cookie is user-editable, so anything unrecognised resolves to the default. */
export function resolveThemePref(value: unknown): ThemePref {
  return isThemePref(value) ? value : DEFAULT_THEME_PREF;
}

/**
 * What the SERVER can put on <html>. It knows an explicit choice exactly, but it
 * cannot see the OS setting — for `system` it renders light and the bootstrap
 * script below corrects it before first paint.
 */
export function serverTheme(pref: ThemePref): Theme {
  return pref === 'dark' ? 'dark' : 'light';
}

/**
 * Runs in <head>, before <body> is parsed, so nothing has been painted yet.
 *
 * It does work in exactly two cases and bails out otherwise:
 *
 *   • `system` in the cookie — the server rendered light because it cannot see
 *     the OS; this reads prefers-color-scheme and fixes the attribute before
 *     the first paint, so a dark-OS student never sees a light flash.
 *   • no cookie but a stored choice — the same migration path as the language:
 *     adopt it now, and the provider writes the cookie on mount.
 *
 * An explicit light/dark cookie needs nothing: the server already rendered it.
 */
export const THEME_BOOTSTRAP = `try{var c=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=([^;]*)/),p=c?decodeURIComponent(c[1]):null;if(!c){p=localStorage.getItem('${THEME_STORAGE_KEY}');}var t=p==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):(!c&&(p==='dark'||p==='light')?p:null);if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}`;
