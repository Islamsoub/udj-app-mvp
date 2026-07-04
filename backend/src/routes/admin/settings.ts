import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdminRole } from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import adminAuth from '../../middleware/adminAuth';
import { rbac } from '../../middleware/rbac';
import { audit } from '../../middleware/auditLog';

const router = Router();

const ALL_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.FACULTY_ADMIN,
  AdminRole.REGISTRAR,
  AdminRole.NEWS_EDITOR,
];

// Ensures the singleton settings row exists, then returns it.
async function getOrCreateSettings() {
  return prisma.systemSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton' },
    update: {},
  });
}

// ─── GET /admin/settings ─────────────────────────────────────────────────────
router.get('/', adminAuth, rbac(...ALL_ROLES), async (_req, res, next) => {
  try {
    const settings = await getOrCreateSettings();
    res.status(200).json(settings);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /admin/settings/grade-formula (weights must sum to 1.0) ───────────
const formulaSchema = z.object({
  gradeWeightCc: z.number().min(0).max(1),
  gradeWeightCf: z.number().min(0).max(1),
});

router.patch(
  '/grade-formula',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('settings.update', 'SystemSettings'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = formulaSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Poids CC/CF invalides', 400);
      const { gradeWeightCc, gradeWeightCf } = parsed.data;

      // Tolerate float error; require the pair to sum to 1.00.
      if (Math.abs(gradeWeightCc + gradeWeightCf - 1) > 0.001) {
        throw new AppError('La somme des coefficients doit être égale à 1.00', 400);
      }

      await getOrCreateSettings();
      const settings = await prisma.systemSettings.update({
        where: { id: 'singleton' },
        data: { gradeWeightCc, gradeWeightCf },
      });
      res.status(200).json(settings);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /admin/settings/attendance-threshold (50–100) ─────────────────────
const thresholdSchema = z.object({
  attendanceThreshold: z.number().int().min(50).max(100),
});

router.patch(
  '/attendance-threshold',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('settings.update', 'SystemSettings'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = thresholdSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Le seuil doit être entre 50 et 100', 400);

      await getOrCreateSettings();
      const settings = await prisma.systemSettings.update({
        where: { id: 'singleton' },
        data: { attendanceThreshold: parsed.data.attendanceThreshold },
      });
      res.status(200).json(settings);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /admin/settings/automations (toggles) ─────────────────────────────
const automationsSchema = z.object({
  autoPublishGrades: z.boolean().optional(),
  notifyOnPublish: z.boolean().optional(),
  weeklyRecap: z.boolean().optional(),
});

router.patch(
  '/automations',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('settings.update', 'SystemSettings'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = automationsSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Réglages invalides', 400);

      await getOrCreateSettings();
      const settings = await prisma.systemSettings.update({
        where: { id: 'singleton' },
        data: {
          ...(parsed.data.autoPublishGrades !== undefined
            ? { autoPublishGrades: parsed.data.autoPublishGrades }
            : {}),
          ...(parsed.data.notifyOnPublish !== undefined
            ? { notifyOnPublish: parsed.data.notifyOnPublish }
            : {}),
          ...(parsed.data.weeklyRecap !== undefined ? { weeklyRecap: parsed.data.weeklyRecap } : {}),
        },
      });
      res.status(200).json(settings);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
