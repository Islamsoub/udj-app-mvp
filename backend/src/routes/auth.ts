import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { env } from '../utils/env';
import { authRateLimiter } from '../middleware/rateLimiter';
import authMiddleware from '../middleware/auth';
import { hashToken } from '../utils/hash';

const router = Router();

router.use(authRateLimiter);

const loginSchema = z.object({
  studentId: z.string().min(1).max(20).trim(),
  password: z.string().min(1).max(100),
});

const refreshSchema = z.object({
  refreshToken: z.string().uuid(),
});

const logoutSchema = z.object({
  refreshToken: z.string().uuid(),
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Student ID and password are required' });
      return;
    }

    const { studentId, password } = parsed.data;

    const student = await prisma.student.findFirst({
      where: {
        studentIdDisplay: {
          equals: studentId.trim(),
          mode: 'insensitive',
        },
      },
      include: {
        programme: {
          include: {
            faculty: true,
          },
        },
      },
    });

    if (!student) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const now = new Date();

    if (student.lockedUntil) {
      if (student.lockedUntil > now) {
        res.status(423).json({ error: 'Account locked', lockedUntil: student.lockedUntil });
        return;
      }
      await prisma.student.update({
        where: { id: student.id },
        data: { lockedUntil: null, failedLoginAttempts: 0 },
      });
      student.lockedUntil = null;
      student.failedLoginAttempts = 0;
    }

    const passwordValid = await bcrypt.compare(password, student.passwordHash);

    if (!passwordValid) {
      const newAttempts = student.failedLoginAttempts + 1;
      const updateData: { failedLoginAttempts: number; lockedUntil?: Date } = {
        failedLoginAttempts: newAttempts,
      };

      if (newAttempts >= 3) {
        updateData.lockedUntil = new Date(now.getTime() + 5 * 60 * 1000);
      }

      await prisma.student.update({
        where: { id: student.id },
        data: updateData,
      });

      res.status(401).json({ error: 'Invalid credentials', attemptsLeft: 3 - newAttempts });
      return;
    }

    await prisma.student.update({
      where: { id: student.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    const accessToken = jwt.sign(
      { studentId: student.id, type: 'access' },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const plainRefreshToken = crypto.randomUUID();
    const refreshTokenHash = hashToken(plainRefreshToken);

    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        studentId: student.id,
        tokenHash: refreshTokenHash,
        deviceName: ((req.headers['user-agent'] as string) || '').slice(0, 256) || null,
        issuedAt: now,
        expiresAt,
        isRevoked: false,
      },
    });

    res.status(200).json({
      accessToken,
      refreshToken: plainRefreshToken,
      student: {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentIdDisplay: student.studentIdDisplay,
        email: student.email,
        photoUrl: student.photoUrl,
        currentSemester: student.currentSemester,
        status: student.status,
        programme: {
          id: student.programme.id,
          nameFr: student.programme.nameFr,
          nameAr: student.programme.nameAr,
          code: student.programme.code,
          level: student.programme.level,
        },
        faculty: {
          id: student.programme.faculty.id,
          nameFr: student.programme.faculty.nameFr,
          nameAr: student.programme.faculty.nameAr,
          code: student.programme.faculty.code,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const { refreshToken } = parsed.data;
    const tokenHash = hashToken(refreshToken);
    const now = new Date();

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        isRevoked: false,
        expiresAt: { gt: now },
      },
    });

    if (!storedToken) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    const accessToken = jwt.sign(
      { studentId: storedToken.studentId, type: 'access' },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const newPlainRefreshToken = crypto.randomUUID();
    const newTokenHash = hashToken(newPlainRefreshToken);
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        studentId: storedToken.studentId,
        tokenHash: newTokenHash,
        deviceName: storedToken.deviceName,
        issuedAt: now,
        expiresAt,
        isRevoked: false,
      },
    });

    res.status(200).json({
      accessToken,
      refreshToken: newPlainRefreshToken,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = logoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    const { refreshToken } = parsed.data;
    const tokenHash = hashToken(refreshToken);

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        studentId: req.studentId,
        isRevoked: false,
      },
    });

    if (!storedToken) {
      res.status(404).json({ error: 'Token not found' });
      return;
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
