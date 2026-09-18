'use client';

/**
 * "Has this already happened once this tab?" — for animations §4 and §5 say run
 * on first visit only.
 *
 * sessionStorage, deliberately, and this is a display detail rather than
 * anything to do with identity:
 *
 *   • NOT localStorage. "Runs once per session" is exactly sessionStorage's
 *     lifetime — per tab, cleared when the tab closes. In localStorage the
 *     stagger would play once on the student's first ever visit and never again
 *     on any later day, which is not what §4 asks for.
 *   • NOT a token, and nothing near one. The only thing written here is the
 *     string '1' against an animation's name. Access tokens live in memory and
 *     the refresh token in an httpOnly cookie; neither storage is ever used for
 *     them (see lib/auth-token.ts).
 *
 * A module-level Set backs it up so the answer is still correct when storage is
 * unavailable — private mode, or a browser with site data blocked. Without it
 * every remount inside one visit would replay the entrance, which is the
 * gimmicky repeat §5 warns about.
 */
const claimed = new Set<string>();

const PREFIX = 'unipocket_seen_';

/**
 * True the first time it is called with a key in this tab, false afterwards.
 *
 * Call it from a lazy `useState` initialiser, never in a render body: it has a
 * side effect, and calling it on every render would burn the flag before the
 * element it belongs to has drawn anything.
 */
export function takeOnce(key: string): boolean {
  if (claimed.has(key)) return false;
  claimed.add(key);

  try {
    const storageKey = PREFIX + key;
    if (window.sessionStorage.getItem(storageKey) !== null) return false;
    window.sessionStorage.setItem(storageKey, '1');
  } catch {
    // Blocked storage: the Set above still prevents a replay within this page.
  }

  return true;
}
