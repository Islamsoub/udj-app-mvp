import { Request, Response, NextFunction } from 'express';
import { AdminRole } from '@prisma/client';

/**
 * Role-based access control factory.
 *
 *   router.post('/', adminAuth, rbac(AdminRole.SUPER_ADMIN, AdminRole.REGISTRAR), handler)
 *
 * - Returns 403 if `req.admin.role` is not in the allowed list.
 * - For FACULTY_ADMIN, attaches `req.adminScope = { facultyId }` so downstream
 *   handlers can filter queries to that admin's faculty (query-level scoping,
 *   not just response filtering — architecture doc §8.2 / §13).
 *
 * Must run AFTER adminAuth (which populates `req.admin`).
 */
export function rbac(...allowedRoles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ error: 'Admin authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      res.status(403).json({ error: 'Insufficient permissions for this action' });
      return;
    }

    if (req.admin.role === AdminRole.FACULTY_ADMIN) {
      req.adminScope = { facultyId: req.admin.facultyId };
    }

    next();
  };
}

/**
 * Helper used by route handlers to build a Prisma `where` fragment that scopes
 * results to a FACULTY_ADMIN's faculty. Returns `{}` (no restriction) for every
 * other role. The `path` argument is the relation path from the queried model
 * down to `facultyId`.
 *
 *   // On Student (student → programme → faculty):
 *   where: { ...facultyScopeWhere(req, ['programme']) }
 *   // → { programme: { facultyId: '<id>' } } for FACULTY_ADMIN, {} otherwise
 */
export function facultyScopeWhere(
  req: Request,
  relationPath: string[]
): Record<string, unknown> {
  const facultyId = req.adminScope?.facultyId;
  if (!facultyId) return {};

  // Build a nested object ending in { facultyId } along the relation path.
  const leaf: Record<string, unknown> = { facultyId };
  return relationPath.reduceRight<Record<string, unknown>>(
    (acc, key) => ({ [key]: acc }),
    leaf
  );
}
