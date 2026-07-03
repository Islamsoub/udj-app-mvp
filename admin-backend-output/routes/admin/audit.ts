import { Router, Request, Response, NextFunction } from 'express';
import { Prisma, AdminRole } from '@prisma/client';
import prisma from '../../utils/prisma';
import adminAuth from '../../middleware/adminAuth';
import { rbac } from '../../middleware/rbac';
import { parsePagination } from '../../utils/adminHelpers';

const router = Router();

// ─── GET /admin/audit (SUPER_ADMIN only) ─────────────────────────────────────
// Search/filter by admin, entityType, action, and date range (from/to).
router.get('/', adminAuth, rbac(AdminRole.SUPER_ADMIN), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { admin, entityType, action, from, to } = req.query as Record<string, string | undefined>;
    const where: Prisma.AuditLogWhereInput = {};

    if (admin) where.adminId = admin;
    if (entityType) where.entityType = entityType;
    if (action) where.action = { startsWith: action }; // e.g. "grade" matches grade.*
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Prisma.DateTimeFilter).gte = new Date(from);
      if (to) (where.createdAt as Prisma.DateTimeFilter).lte = new Date(to);
    }

    const { page, pageSize } = parsePagination(req.query as Record<string, unknown>, 50);

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { admin: { select: { firstName: true, lastName: true, role: true } } },
      }),
    ]);

    res.status(200).json({
      data: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        who: `${l.admin.firstName} ${l.admin.lastName}`,
        role: l.admin.role,
        before: l.before,
        after: l.after,
        ipAddress: l.ipAddress,
        when: l.createdAt,
      })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
