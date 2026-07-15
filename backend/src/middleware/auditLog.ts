import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

/**
 * Audit logging middleware for mutation routes (POST, PATCH, DELETE).
 *
 * Usage — place AFTER adminAuth + rbac, BEFORE the handler:
 *
 *   router.patch('/:id',
 *     adminAuth,
 *     rbac(AdminRole.SUPER_ADMIN, AdminRole.REGISTRAR),
 *     audit('student.update', 'Student'),
 *     handler,
 *   );
 *
 * Behaviour:
 *  1. BEFORE the handler runs, if there is an `:id` param and the entityType is
 *     one we know how to read, it snapshots the current row into `before`.
 *  2. It wraps `res.json` so the response body becomes the `after` snapshot.
 *  3. When the response finishes with a 2xx status, it writes one AuditLog row
 *     with { adminId, action, entityType, entityId, before, after, ipAddress }.
 *
 * `action` strings must follow reconciliation doc §6 exactly (dot notation).
 * The write is best-effort: an audit failure is logged but never breaks the
 * user-facing response (the mutation has already succeeded).
 */

// Maps an entityType string to the Prisma delegate used to read the "before"
// snapshot by primary key. Extend this as new audited entities are added.
type FindUnique = (args: { where: { id: string } }) => Promise<unknown>;

const modelReaders: Record<string, FindUnique> = {
  Student: (args) => prisma.student.findUnique(args),
  Grade: (args) => prisma.grade.findUnique(args),
  NewsArticle: (args) => prisma.newsArticle.findUnique(args),
  ScheduleEntry: (args) => prisma.scheduleEntry.findUnique(args),
  AttendanceRecord: (args) => prisma.attendanceRecord.findUnique(args),
  Subject: (args) => prisma.subject.findUnique(args),
  Faculty: (args) => prisma.faculty.findUnique(args),
  Programme: (args) => prisma.programme.findUnique(args),
  Semester: (args) => prisma.semester.findUnique(args),
  Admin: (args) => prisma.admin.findUnique(args),
  SystemSettings: (args) => prisma.systemSettings.findUnique(args),
};

// Strip secrets/PII before persisting a snapshot (P0: no PII / no password hashes).
function redact(entity: unknown): unknown {
  if (!entity || typeof entity !== 'object') return entity;
  const clone: Record<string, unknown> = { ...(entity as Record<string, unknown>) };
  delete clone.passwordHash;
  delete clone.password_hash;
  delete clone.tokenHash;
  delete clone.newPassword;
  delete clone.password;
  return clone;
}

function clientIp(req: Request): string | null {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.ip ?? req.socket?.remoteAddress ?? null;
}

// `action` may be a static dot-notation string or a function that derives it
// from the request (e.g. approve vs reject share one route but log differently).
export function audit(action: string | ((req: Request) => string), entityType: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const resolvedAction = typeof action === 'function' ? action(req) : action;
    const entityIdParam =
      (req.params?.id as string | undefined) ?? undefined;

    // 1. Capture BEFORE state for updates/deletes.
    let before: unknown = null;
    if (entityIdParam && modelReaders[entityType]) {
      try {
        before = await modelReaders[entityType]({ where: { id: entityIdParam } });
      } catch {
        before = null;
      }
    }

    // 2. Intercept the response body to use as the AFTER snapshot.
    let responseBody: unknown = null;
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      responseBody = body;
      return originalJson(body);
    };

    // 3. On finish, persist the audit entry (best-effort).
    res.on('finish', () => {
      if (res.statusCode < 200 || res.statusCode >= 300) return;
      if (!req.admin) return;

      const isDelete = req.method === 'DELETE';
      const after = isDelete ? null : redact(responseBody);
      const entityId =
        entityIdParam ??
        (responseBody && typeof responseBody === 'object'
          ? ((responseBody as Record<string, unknown>).id as string | undefined)
          : undefined) ??
        null;

      prisma.auditLog
        .create({
          data: {
            adminId: req.admin.adminId,
            action: resolvedAction,
            entityType,
            entityId,
            before: (redact(before) as object) ?? undefined,
            after: (after as object) ?? undefined,
            ipAddress: clientIp(req),
          },
        })
        .catch((err) => {
          console.error(`[audit] failed to write "${action}" log:`, err?.message ?? err);
        });
    });

    next();
  };
}
