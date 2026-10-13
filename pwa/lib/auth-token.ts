/**
 * The access token, and nothing else.
 *
 * Deliberately a module-level closure variable — not React state, not
 * localStorage, not sessionStorage, not a client-readable cookie. An injected
 * XSS payload can read every one of those synchronously; it cannot read a
 * variable that is never exposed on `window`. Nothing is lost by keeping it out
 * of storage: the refresh token lives in an httpOnly cookie, so a page reload
 * restores the session through `restoreSession()` rather than through a token
 * the page had lying around.
 *
 * The 15-minute access token being lost on reload is the intended trade.
 */

let accessToken: string | null = null;

/**
 * Fired when a refresh attempt fails and the session is genuinely over. A single
 * slot rather than a listener list: there is exactly one thing to do about a
 * dead session, and a set would let a remounting component register the same
 * handler twice and show the sheet twice.
 */
let sessionExpiredHandler: (() => void) | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * The `studentId` claim of the held access token, or null.
 *
 * Decoded, NOT verified — the client has no key to verify with and needs none.
 * This is used for one thing: labelling and matching offline-cache entries
 * (lib/offline-cache). It answers "whose data did the server just send under
 * this token?", which the server already decided when it accepted the token.
 * It is never an authorisation decision and must not become one.
 *
 * The claim is the same id GET /student/me returns as `id` (both are the
 * Student row's primary key — backend/src/routes/auth.ts signs it), and unlike
 * /me it is available on every response, including the dashboard's, which never
 * calls /me.
 */
export function tokenStudentId(): string | null {
  if (accessToken === null) return null;
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return null;
    // base64url -> base64. atob's forgiving decoder accepts the missing padding.
    const claims: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const id = (claims as { studentId?: unknown } | null)?.studentId;
    return typeof id === 'string' && id !== '' ? id : null;
  } catch {
    return null;
  }
}

/**
 * Registers the session-expired callback, replacing any previous one. Returns an
 * unregister function so a component can clean up on unmount without clearing a
 * handler some other mount has since installed.
 */
export function onSessionExpired(cb: () => void): () => void {
  sessionExpiredHandler = cb;
  return () => {
    if (sessionExpiredHandler === cb) sessionExpiredHandler = null;
  };
}

/** Invokes the registered handler, if any. Called only by the refresh path. */
export function notifySessionExpired(): void {
  sessionExpiredHandler?.();
}
