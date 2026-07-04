import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { AdminRole } from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import adminAuth from '../../middleware/adminAuth';
import { rbac } from '../../middleware/rbac';
import { audit } from '../../middleware/auditLog';
import { EMAIL_REGEX } from '../../utils/adminHelpers';
import { BCRYPT_COST } from '../../config/adminEnv';

const router = Router();

function shape(a: {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AdminRole;
  facultyId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
}) {
  return {
    id: a.id,
    firstName: a.firstName,
    lastName: a.lastName,
    name: `${a.firstName} ${a.lastName}`,
    email: a.email,
    role: a.role,
    facultyId: a.facultyId,
    isActive: a.isActive,
    lastLoginAt: a.lastLoginAt,
  };
}

// ─── GET /admin/users (SUPER_ADMIN only) ─────────────────────────────────────
router.get('/', adminAuth, rbac(AdminRole.SUPER_ADMIN), async (_req, res, next) => {
  try {
    const admins = await prisma.admin.findMany({
      orderBy: { createdAt: 'asc' },
      include: { faculty: { select: { id: true, nameFr: true, code: true } } },
    });
    res.status(200).json(admins.map((a) => ({ ...shape(a), faculty: a.faculty })));
  } catch (err) {
    next(err);
  }
});

// ─── POST /admin/users (SUPER_ADMIN only) ────────────────────────────────────
const createSchema = z
  .object({
    firstName: z.string().min(1).max(50),
    lastName: z.string().min(1).max(50),
    email: z.string().regex(EMAIL_REGEX, 'Email invalide').max(120),
    role: z.nativeEnum(AdminRole),
    facultyId: z.string().uuid().nullable().optional(),
    password: z.string().min(8).max(100),
  })
  .refine((d) => d.role !== AdminRole.FACULTY_ADMIN || !!d.facultyId, {
    message: 'Le périmètre (faculté) est requis pour un admin de faculté',
    path: ['facultyId'],
  });

router.post(
  '/',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('admin.create', 'Admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid admin data', 400);
      }
      const d = parsed.data;

      const dupe = await prisma.admin.findUnique({ where: { email: d.email } });
      if (dupe) throw new AppError('Cet email est déjà utilisé', 409);

      const passwordHash = await bcrypt.hash(d.password, BCRYPT_COST);
      const admin = await prisma.admin.create({
        data: {
          firstName: d.firstName,
          lastName: d.lastName,
          email: d.email,
          role: d.role,
          facultyId: d.role === AdminRole.FACULTY_ADMIN ? d.facultyId ?? null : null,
          passwordHash,
        },
      });

      res.status(201).json(shape(admin));
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /admin/users/:id (role / active status) ───────────────────────────
const updateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.nativeEnum(AdminRole).optional(),
  facultyId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
});

router.patch(
  '/:id',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit(
    (req) => {
      if (req.body?.isActive === true) return 'admin.reactivate';
      if (req.body?.isActive === false) return 'admin.deactivate';
      return 'admin.update';
    },
    'Admin'
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid admin data', 400);
      const d = parsed.data;

      const existing = await prisma.admin.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Admin not found', 404);

      const nextRole = d.role ?? existing.role;
      if (nextRole === AdminRole.FACULTY_ADMIN) {
        const nextFaculty = d.facultyId !== undefined ? d.facultyId : existing.facultyId;
        if (!nextFaculty) throw new AppError('Le périmètre (faculté) est requis pour un admin de faculté', 400);
      }

      const admin = await prisma.admin.update({
        where: { id: existing.id },
        data: {
          ...(d.firstName !== undefined ? { firstName: d.firstName } : {}),
          ...(d.lastName !== undefined ? { lastName: d.lastName } : {}),
          ...(d.role !== undefined ? { role: d.role } : {}),
          ...(d.facultyId !== undefined
            ? { facultyId: nextRole === AdminRole.FACULTY_ADMIN ? d.facultyId : null }
            : {}),
          ...(d.isActive !== undefined ? { isActive: d.isActive } : {}),
        },
      });

      res.status(200).json(shape(admin));
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /admin/users/:id (soft delete → isActive=false) ──────────────────
router.delete(
  '/:id',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('admin.deactivate', 'Admin'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.admin.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Admin not found', 404);

      if (existing.id === req.admin!.adminId) {
        throw new AppError('Vous ne pouvez pas désactiver votre propre compte', 400);
      }

      // Soft delete: never hard-delete (audit history must be retained).
      const admin = await prisma.admin.update({
        where: { id: existing.id },
        data: { isActive: false },
      });
      await prisma.adminRefreshToken.updateMany({
        where: { adminId: admin.id, isRevoked: false },
        data: { isRevoked: true },
      });

      res.status(200).json({ ...shape(admin), deactivated: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
