'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_THEME_PREF,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  THEME_STORAGE_KEY,
  isThemePref,
  serverTheme,
  type Theme,
  type ThemePref,
} from '@/lib/theme-shared';

export type { Theme, ThemePref } from '@/lib/theme-shared';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** Set on <html> for the length of one theme crossfade; see globals.css. */
const SWITCHING_ATTR = 'data-theme-switching';

function readThemeCookie(): ThemePref | null {
  const match = document.cookie.match(/(?:^|;\s*)unipocket_theme=([^;]*)/);
  if (!match) return null;
  const value = decodeURIComponent(match[1]);
  return isThemePref(value) ? value : null;
}

function writeThemeCookie(pref: ThemePref): void {
  document.cookie = `${THEME_COOKIE}=${pref}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function writeThemeStorage(pref: ThemePref): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Not persisting here is survivable — the cookie is the one the server reads.
  }
}

function systemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function resolve(pref: ThemePref): Theme {
  return pref === 'system' ? systemTheme() : pref;
}

/** A duration token from :root, in milliseconds. */
function tokenMs(name: string): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return 0;
  return raw.endsWith('ms') ? value : value * 1000;
}

export interface ThemeValue {
  /** The student's choice. */
  pref: ThemePref;
  /** What is applied right now — `system` resolved against the OS. */
  theme: Theme;
  setPref: (pref: ThemePref) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * Owns <html data-theme> after first paint. Before first paint it belongs to
 * the server (explicit choices) and to THEME_BOOTSTRAP (`system`), which is why
 * nothing here runs during render.
 *
 * ── §6: THE CROSSFADE ────────────────────────────────────────────────────────
 *
 * "All color-token-driven properties (background, text, borders) crossfade over
 * --dur-slow by transitioning background-color, color, and border-color
 * globally (a single CSS rule on * scoped to these three properties, removed
 * immediately after the transition ends to avoid interfering with hover/focus
 * timing)."
 *
 * That rule is in globals.css, keyed on SWITCHING_ATTR. A switch is: set the
 * attribute, force a style flush so every element has the transition BEFORE its
 * colours change (otherwise nothing animates — there is no "before" value to
 * animate from), swap data-theme, then remove the attribute once --dur-slow has
 * elapsed. Not on transitionend: thousands of elements fire it, at slightly
 * different times, and the rule must go when the LAST one is done.
 *
 * Under prefers-reduced-motion the same rule collapses to --dur-instant with no
 * curve (§2), and the removal waits that long instead.
 */
export function ThemeProvider({
  initialPref = DEFAULT_THEME_PREF,
  children,
}: {
  /** The preference the SERVER resolved from the cookie, so the first client
   *  render agrees with the markup that was sent. */
  initialPref?: ThemePref;
  children: ReactNode;
}) {
  const [pref, setPrefState] = useState<ThemePref>(initialPref);
  // Starts from the server's value so the first client render matches the HTML;
  // the mount effect below replaces it with the resolved theme.
  const [theme, setTheme] = useState<Theme>(serverTheme(initialPref));

  const switchTimer = useRef<number | null>(null);

  /** Applies a theme to <html>, crossfading unless told not to. */
  const apply = useCallback((next: Theme, animate: boolean) => {
    const root = document.documentElement;
    if (root.getAttribute('data-theme') === next) return;

    if (!animate) {
      root.setAttribute('data-theme', next);
      return;
    }

    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const duration = tokenMs(reduced ? '--dur-instant' : '--dur-slow');

    root.setAttribute(SWITCHING_ATTR, '');
    // Style flush: the transition has to be in place before the colours move.
    void document.body.offsetHeight;
    root.setAttribute('data-theme', next);

    if (switchTimer.current !== null) window.clearTimeout(switchTimer.current);
    switchTimer.current = window.setTimeout(() => {
      root.removeAttribute(SWITCHING_ATTR);
      switchTimer.current = null;
    }, duration);
  }, []);

  useEffect(
    () => () => {
      if (switchTimer.current !== null) window.clearTimeout(switchTimer.current);
    },
    []
  );

  // Reconciles the two stores once on mount, exactly as the language does: the
  // cookie is authoritative because it is what the server rendered from, and a
  // stored choice with no cookie is adopted and written back as one.
  useEffect(() => {
    const fromCookie = readThemeCookie();
    let adopted: ThemePref | null = null;

    if (fromCookie) {
      writeThemeStorage(fromCookie);
      if (fromCookie !== pref) adopted = fromCookie;
    } else {
      let stored: string | null = null;
      try {
        stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      } catch {
        // Private mode or blocked storage: nothing to migrate.
      }
      if (isThemePref(stored)) {
        adopted = stored;
        writeThemeCookie(stored);
      }
    }

    if (adopted !== null) setPrefState(adopted);
    // Mount only, against the server's value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * Keeps <html> in step with the preference, and — for `system` — with the OS,
   * live. The first run is not animated: it can only be confirming or
   * correcting what was painted, and a crossfade on page load would be a flash
   * with extra steps.
   */
  const mounted = useRef(false);
  useEffect(() => {
    const animate = mounted.current;
    mounted.current = true;

    const next = resolve(pref);
    apply(next, animate);
    setTheme(next);

    if (pref !== 'system') return;

    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      const followed = media.matches ? 'dark' : 'light';
      apply(followed, true);
      setTheme(followed);
    };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [pref, apply]);

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next);
    // Cookie first — it decides what the next navigation renders.
    writeThemeCookie(next);
    writeThemeStorage(next);
  }, []);

  const value = useMemo<ThemeValue>(() => ({ pref, theme, setPref }), [pref, theme, setPref]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside a ThemeProvider');
  return ctx;
}
