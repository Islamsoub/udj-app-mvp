// The QR code the student card shows, and which one to show. Pure — no React
// Native imports — so tests run under plain node.
//
// The server (GET /student/qr-token, backend utils/studentCard.ts) issues two
// signed codes, each a link to the public check page:
//   - live:    valid 60 s, refreshed every 55 s while online;
//   - offline: valid 24 h, kept in SecureStore for when there is no network.
// Before this, the card fell back to the bare matricule when offline — which
// anyone can turn into a QR code, and which no scanner can check.

export type CardCodeKind = 'live' | 'offline';

export interface CardCode {
  /** What the QR encodes: the check-page link (or a bare token from an older server). */
  value: string;
  kind: CardCodeKind;
  expiresAt: string;
}

export interface QrTokenResponse {
  token: string;
  expiresAt: string;
  url?: string;
  offline?: { token: string; url: string; expiresAt: string };
}

/** The live code from a server answer. */
export function liveCode(res: QrTokenResponse): CardCode {
  return { value: res.url ?? res.token, kind: 'live', expiresAt: res.expiresAt };
}

/** The offline code to keep, or null when the server sent none. */
export function offlineCode(res: QrTokenResponse): CardCode | null {
  const o = res.offline;
  if (!o || typeof o.url !== 'string' || typeof o.expiresAt !== 'string') return null;
  return { value: o.url, kind: 'offline', expiresAt: o.expiresAt };
}

/**
 * A stored offline code, if it is well-formed and still valid at `now`. An
 * expired one is useless to a scanner (it reads "Code expiré"), so it is not
 * shown at all.
 */
export function usableOffline(raw: string | null, now: Date = new Date()): CardCode | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as Partial<CardCode>;
    if (c.kind !== 'offline' || typeof c.value !== 'string' || typeof c.expiresAt !== 'string') return null;
    const exp = Date.parse(c.expiresAt);
    if (!Number.isFinite(exp) || exp <= now.getTime()) return null;
    return { value: c.value, kind: 'offline', expiresAt: c.expiresAt };
  } catch {
    return null;
  }
}

/** Seconds left on a code at `now`, never below 0. */
export function secondsLeft(code: CardCode, now: Date = new Date()): number {
  return Math.max(0, Math.round((Date.parse(code.expiresAt) - now.getTime()) / 1000));
}
