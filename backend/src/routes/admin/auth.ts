import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import { hashToken } from '../../utils/hash';
import { env } from '../../utils/env';
import { authLoginLimiter } from '../../middleware/rateLimiter';
import adminAuth from '../../middleware/adminAuth';
import { audit } from '../../middleware/auditLog';
import {
  adminEnv,
  ADMIN_ACCESS_TTL,
  ADMIN_REFRESH_TTL_MS,
  BCRYPT_COST,
} from '../../config/adminEnv';

const router = Router();

// ─── Refresh-token cookie ────────────────────────────────────────────────────
// The admin refresh token lives ONLY in an httpOnly cookie — it is never in a
// response body and never reachable from JavaScript, so an XSS on the portal
// cannot exfiltrate a 30-day credential. `path` scopes it to the auth routes so
// it is not attached to every API call.
const REFRESH_COOKIE = 'admin_refresh_token';
const REFRESH_COOKIE_PATH = '/admin/auth';

// Brute-force lockout thresholds for admin login.
const ADMIN_MAX_LOGIN_ATTEMPTS = 5;
const ADMIN_LOCKOUT_MS = 15 * 60 * 1000;

function refreshCookieOptions(maxAge: number) {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    // Production runs the portal (Vercel) and the API (Render) on different
    // sites, so the cookie must be SameSite=None to be sent at all — which the
    // browser only honours together with Secure. Locally both are on localhost,
    // where Lax works and there is no HTTPS to mark Secure against.
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge,
  };
}

// Pre-computed bcrypt hash (cost 12) used to equalize response time when an
// account is missing/inactive, so login timing can't be used to enumerate emails.
const DUMMY_HASH = '$2b$12$LJ3m4ys3Lf0YOm/.0RqRC.6TYnKLkRFMGpdVHw1P6W5yBxJvzNDtC';

// ─── Token helpers ───────────────────────────────────────────────────────────

function signAccessToken(admin: {
  id: string;
  role: string;
  facultyId: string | null;
}): string {
  return jwt.sign(
    { adminId: admin.id, role: admin.role, facultyId: admin.facultyId, type: 'admin_access' },
    adminEnv.JWT_ADMIN_SECRET,
    { expiresIn: ADMIN_ACCESS_TTL }
  );
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email().max(120).trim(),
  password: z.string().min(1).max(100),
  stayConnected: z.boolean().optional(),
});

// Refresh/logout no longer take a body — the token arrives as an httpOnly
// cookie. This validates the cookie value has the shape we issue (a UUID v4).
const refreshTokenSchema = z.string().uuid();

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

// ─── POST /admin/auth/login ──────────────────────────────────────────────────
// Rate limited (10/min per IP, same limiter as student auth).
router.post('/login', authLoginLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const { email, password, stayConnected } = parsed.data;

    const admin = await prisma.admin.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });

    // Uniform 401 whether the account is missing or inactive.
    if (!admin || !admin.isActive) {
      // Equalize timing vs. the found-account path (which runs bcrypt.compare).
      await bcrypt.compare(password, DUMMY_HASH);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const now = new Date();

    // Lockout is checked before the password compare so a locked account can't
    // be probed. 5 attempts / 15 min — stricter than the student side's 3 / 5.
    if (admin.lockedUntil) {
      if (admin.lockedUntil > now) {
        res.status(423).json({ error: 'Account locked', lockedUntil: admin.lockedUntil });
        return;
      }
      // Window elapsed — clear it and let this attempt through.
      await prisma.admin.update({
        where: { id: admin.id },
        data: { lockedUntil: null, failedLoginAttempts: 0 },
      });
      admin.lockedUntil = null;
      admin.failedLoginAttempts = 0;
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      const newAttempts = admin.failedLoginAttempts + 1;
      const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
        failedLoginAttempts: newAttempts,
      };

      if (newAttempts >= ADMIN_MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(now.getTime() + ADMIN_LOCKOUT_MS);
      }

      await prisma.admin.update({
        where: { id: admin.id },
        data: updateData,
      });

      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: now, failedLoginAttempts: 0, lockedUntil: null },
    });

    const accessToken = signAccessToken(admin);

    const plainRefreshToken = crypto.randomUUID();
    // "Rester connecté" unchecked → session-only token (short expiry).
    const refreshMs = stayConnected === false ? 12 * 60 * 60 * 1000 : ADMIN_REFRESH_TTL_MS;
    const expiresAt = new Date(now.getTime() + refreshMs);

    await prisma.adminRefreshToken.create({
      data: {
        adminId: admin.id,
        tokenHash: hashToken(plainRefreshToken),
        expiresAt,
        isRevoked: false,
      },
    });

    res.cookie(REFRESH_COOKIE, plainRefreshToken, refreshCookieOptions(refreshMs));

    // NOTE: the refresh token is deliberately absent from the body.
    res.status(200).json({
      accessToken,
      admin: {
        id: admin.id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        role: admin.role,
        facultyId: admin.facultyId,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /admin/auth/refresh ────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = refreshTokenSchema.safeParse(req.cookies?.[REFRESH_COOKIE]);
    if (!parsed.success) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const tokenHash = hashToken(parsed.data);
    const now = new Date();

    const stored = await prisma.adminRefreshToken.findFirst({
      where: { tokenHash, isRevoked: false, expiresAt: { gt: now } },
      include: { admin: true },
    });

    if (!stored || !stored.admin.isActive) {
      res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    // Rotate: revoke old, issue new (same pattern as student auth).
    await prisma.adminRefreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });

    const newPlain = crypto.randomUUID();
    await prisma.adminRefreshToken.create({
      data: {
        adminId: stored.adminId,
        tokenHash: hashToken(newPlain),
        expiresAt: new Date(now.getTime() + ADMIN_REFRESH_TTL_MS),
        isRevoked: false,
      },
    });

    // Rotation issues a new cookie; the old value is already revoked above.
    res.cookie(REFRESH_COOKIE, newPlain, refreshCookieOptions(ADMIN_REFRESH_TTL_MS));

    res.status(200).json({ accessToken: signAccessToken(stored.admin) });
  } catch (err) {
    next(err);
  }
});

// ─── POST /admin/auth/logout ─────────────────────────────────────────────────
// Deliberately NOT behind `adminAuth`: the access token may already have
// expired when the admin clicks "Se déconnecter", and logout must still clear
// the cookie. Possession of the refresh token is the only authority needed to
// revoke it, and SameSite=Lax blocks cross-site POSTs from carrying the cookie.
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Always clear client-side, even if the token is unknown/already revoked.
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });

    const parsed = refreshTokenSchema.safeParse(req.cookies?.[REFRESH_COOKIE]);
    if (parsed.success) {
      await prisma.adminRefreshToken.updateMany({
        where: { tokenHash: hashToken(parsed.data), isRevoked: false },
        data: { isRevoked: true },
      });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─── GET /admin/auth/me ──────────────────────────────────────────────────────
router.get('/me', adminAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin!.adminId },
      include: { faculty: { select: { id: true, nameFr: true, code: true } } },
    });

    if (!admin) throw new AppError('Admin not found', 404);

    res.status(200).json({
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      role: admin.role,
      facultyId: admin.facultyId,
      faculty: admin.faculty,
      lastLoginAt: admin.lastLoginAt,
    });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /admin/auth/password ──────────────────────────────────────────────
router.patch(
  '/password',
  adminAuth,
  audit('admin.update', 'Admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = passwordSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError('New password must be at least 8 characters', 400);
      }

      const admin = await prisma.admin.findUnique({ where: { id: req.admin!.adminId } });
      if (!admin) throw new AppError('Admin not found', 404);

      const valid = await bcrypt.compare(parsed.data.currentPassword, admin.passwordHash);
      if (!valid) throw new AppError('Mot de passe actuel incorrect', 400);

      const passwordHash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_COST);
      await prisma.admin.update({
        where: { id: admin.id },
        data: { passwordHash },
      });

      // Revoke all refresh tokens so other sessions must re-authenticate.
      await prisma.adminRefreshToken.updateMany({
        where: { adminId: admin.id, isRevoked: false },
        data: { isRevoked: true },
      });

      // The cookie's token was just revoked — drop the dead value too.
      res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });

      res.status(200).json({ id: admin.id, message: 'Mot de passe mis à jour' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
