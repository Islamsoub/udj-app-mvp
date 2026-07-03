import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import { hashToken } from '../../utils/hash';
import { authRateLimiter } from '../../middleware/rateLimiter';
import adminAuth from '../../middleware/adminAuth';
import { audit } from '../../middleware/auditLog';
import {
  adminEnv,
  ADMIN_ACCESS_TTL,
  ADMIN_REFRESH_TTL_MS,
  BCRYPT_COST,
} from '../../config/adminEnv';

const router = Router();

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

const refreshSchema = z.object({
  refreshToken: z.string().uuid(),
});

const logoutSchema = z.object({
  refreshToken: z.string().uuid(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(100),
});

// ─── POST /admin/auth/login ──────────────────────────────────────────────────
// Rate limited (10/min per IP, same limiter as student auth).
router.post('/login', authRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
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
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const now = new Date();
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: now },
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

    res.status(200).json({
      accessToken,
      refreshToken: plainRefreshToken,
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
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const tokenHash = hashToken(parsed.data.refreshToken);
    const now = new Date();

    const stored = await prisma.adminRefreshToken.findFirst({
      where: { tokenHash, isRevoked: false, expiresAt: { gt: now } },
      include: { admin: true },
    });

    if (!stored || !stored.admin.isActive) {
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

    res.status(200).json({
      accessToken: signAccessToken(stored.admin),
      refreshToken: newPlain,
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /admin/auth/logout ─────────────────────────────────────────────────
router.post('/logout', adminAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = logoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const tokenHash = hashToken(parsed.data.refreshToken);
    const stored = await prisma.adminRefreshToken.findFirst({
      where: { tokenHash, adminId: req.admin!.adminId, isRevoked: false },
    });

    if (!stored) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    await prisma.adminRefreshToken.update({
      where: { id: stored.id },
      data: { isRevoked: true },
    });

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

      res.status(200).json({ id: admin.id, message: 'Mot de passe mis à jour' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
