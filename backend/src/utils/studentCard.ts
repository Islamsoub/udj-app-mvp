import jwt from 'jsonwebtoken';
import prisma from './prisma';
import { env } from './env';

/**
 * The student card's QR code, and how it is checked.
 *
 * The QR holds a link — CARD_VERIFY_URL + "#t=" + a token — so any phone
 * camera opens the public check page, and the admin scanner and the app's
 * scanner read the same token out of it. The token sits after "#", which a
 * browser never sends to a server, so it does not end up in access logs.
 *
 * The token is an HS256 JWT signed with QR_SECRET (HMAC-SHA256; the key never
 * leaves the server — CLAUDE.md, security rules). It names the student by
 * internal id only: who the student is comes from the database at check time,
 * so a suspended or graduated student's card stops checking as valid at once.
 *
 * Two kinds:
 *  - live    — 60 seconds, shown while the app is online and refreshed every
 *              55 s. A screenshot is useless a minute later.
 *  - offline — 24 hours, fetched alongside the live one and kept by the app
 *              for when there is no network. Weaker by design (a screenshot
 *              works for a day), so every check says which kind it saw and
 *              when it was issued.
 */

export type CardKind = 'live' | 'offline';

const TTL_SECONDS: Record<CardKind, number> = { live: 60, offline: 24 * 60 * 60 };
const TOKEN_TYPE: Record<CardKind, string> = { live: 'card', offline: 'card_offline' };

/** Where the QR link points. The student website's public check page. */
export const CARD_VERIFY_URL = 'https://app.unipocket.io/verify';

export interface IssuedCard {
  token: string;
  url: string;
  issuedAt: string;
  expiresAt: string;
}

export function issueCardToken(studentId: string, kind: CardKind, now = new Date()): IssuedCard {
  const iat = Math.floor(now.getTime() / 1000);
  const exp = iat + TTL_SECONDS[kind];
  // iat and exp are set explicitly (jsonwebtoken keeps a given iat), so the
  // dates returned below are exactly the ones signed.
  const token = jwt.sign({ sub: studentId, typ: TOKEN_TYPE[kind], iat, exp }, env.QR_SECRET, {
    algorithm: 'HS256',
  });
  return {
    token,
    url: `${CARD_VERIFY_URL}#t=${token}`,
    issuedAt: new Date(iat * 1000).toISOString(),
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}

/**
 * What a scanner read: the whole link, or the bare token (older app builds
 * showed the token alone). Anything else yields null.
 */
export function extractCardToken(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const raw = input.trim();
  if (raw.length === 0 || raw.length > 2048) return null;
  const m = raw.match(/[#?&]t=([A-Za-z0-9_\-.]+)/);
  const candidate = m ? m[1] : raw;
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(candidate) ? candidate : null;
}

export type CardCheck =
  | { ok: true; studentId: string; kind: CardKind; issuedAt: string; expiresAt: string }
  | { ok: false; reason: 'expired' | 'invalid'; expiredAt?: string };

export function checkCardToken(token: string): CardCheck {
  try {
    const p = jwt.verify(token, env.QR_SECRET, { algorithms: ['HS256'] }) as jwt.JwtPayload;
    const kind: CardKind | null =
      p.typ === TOKEN_TYPE.live ? 'live' : p.typ === TOKEN_TYPE.offline ? 'offline' : null;
    if (!kind || typeof p.sub !== 'string' || typeof p.iat !== 'number' || typeof p.exp !== 'number') {
      return { ok: false, reason: 'invalid' };
    }
    return {
      ok: true,
      studentId: p.sub,
      kind,
      issuedAt: new Date(p.iat * 1000).toISOString(),
      expiresAt: new Date(p.exp * 1000).toISOString(),
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return { ok: false, reason: 'expired', expiredAt: err.expiredAt.toISOString() };
    }
    return { ok: false, reason: 'invalid' };
  }
}

export interface CardHolder {
  id: string;
  firstName: string;
  lastName: string;
  studentIdDisplay: string;
  photoUrl: string | null;
  status: string;
  currentSemester: number;
  programme: { nameFr: string; nameAr: string; level: string };
  faculty: { id: string; nameFr: string; nameAr: string };
}

export async function loadCardHolder(studentId: string): Promise<CardHolder | null> {
  const s = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      studentIdDisplay: true,
      photoUrl: true,
      status: true,
      currentSemester: true,
      programme: {
        select: {
          nameFr: true,
          nameAr: true,
          level: true,
          faculty: { select: { id: true, nameFr: true, nameAr: true } },
        },
      },
    },
  });
  if (!s) return null;
  const { faculty, ...programme } = s.programme;
  return { ...s, status: String(s.status), programme: { ...programme, level: String(programme.level) }, faculty };
}

/**
 * The answer every scanner gets. `student` is present when the token is
 * genuine (even if the student is no longer active, so the person checking
 * sees who it is and why it fails); absent for expired or forged codes, which
 * reveal nothing.
 */
export interface CardVerdict {
  valid: boolean;
  reason?: 'expired' | 'invalid' | 'inactive';
  kind?: CardKind;
  issuedAt?: string;
  expiresAt?: string;
  checkedAt: string;
  student?: Omit<CardHolder, 'id' | 'faculty'> & { faculty: Omit<CardHolder['faculty'], 'id'> };
}

export async function verifyCard(input: unknown): Promise<{ verdict: CardVerdict; holder: CardHolder | null }> {
  const checkedAt = new Date().toISOString();
  const token = extractCardToken(input);
  if (!token) return { verdict: { valid: false, reason: 'invalid', checkedAt }, holder: null };

  const check = checkCardToken(token);
  if (!check.ok) {
    return {
      verdict: { valid: false, reason: check.reason, checkedAt, ...(check.expiredAt ? { expiresAt: check.expiredAt } : {}) },
      holder: null,
    };
  }

  const holder = await loadCardHolder(check.studentId);
  if (!holder) return { verdict: { valid: false, reason: 'invalid', checkedAt }, holder: null };

  const { id: _id, faculty, ...rest } = holder;
  const student = { ...rest, faculty: { nameFr: faculty.nameFr, nameAr: faculty.nameAr } };
  const active = holder.status === 'ACTIVE';
  return {
    verdict: {
      valid: active,
      ...(active ? {} : { reason: 'inactive' as const }),
      kind: check.kind,
      issuedAt: check.issuedAt,
      expiresAt: check.expiresAt,
      checkedAt,
      student,
    },
    holder,
  };
}
