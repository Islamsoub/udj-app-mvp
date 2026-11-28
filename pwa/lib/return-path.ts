/**
 * Where to go after signing in.
 *
 * A student who opens /grades while signed out is sent to /login. Signing in
 * used to land them on Accueil every time, so the page they asked for was lost.
 * The shell remembers it here just before that redirect, and the login form
 * takes it back after a successful sign-in.
 *
 * sessionStorage, not a ?next= in the address: the login address stays clean,
 * the value lives only in this tab, and nothing a link can carry decides where
 * a signed-in student is sent. What comes back is still checked against the
 * app's own pages, so a stale or tampered value can only ever mean Accueil.
 */
const KEY = 'unipocket_return_path';
const HOME = '/';

/** The app's own pages. Anything else returns to Accueil. */
const PAGES = new Set(['/', '/schedule', '/grades', '/attendance', '/news', '/profile']);
/** The one query string a page keeps: an open article. */
const ARTICLE_QUERY = /^\?article=[0-9a-f-]{36}$/i;

function isAllowed(path: string): boolean {
  const q = path.indexOf('?');
  const pathname = q === -1 ? path : path.slice(0, q);
  const search = q === -1 ? '' : path.slice(q);
  if (!PAGES.has(pathname)) return false;
  return search === '' || (pathname === '/news' && ARTICLE_QUERY.test(search));
}

/** Called by the shell right before it sends a signed-out student to /login. */
export function rememberReturnPath(path: string): void {
  try {
    if (isAllowed(path) && path !== HOME) window.sessionStorage.setItem(KEY, path);
  } catch {
    // Private mode or blocked storage: the student lands on Accueil, as before.
  }
}

/** Called once after a successful sign-in. Reads and forgets the remembered page. */
export function takeReturnPath(): string {
  try {
    const path = window.sessionStorage.getItem(KEY);
    window.sessionStorage.removeItem(KEY);
    return path && isAllowed(path) ? path : HOME;
  } catch {
    return HOME;
  }
}
