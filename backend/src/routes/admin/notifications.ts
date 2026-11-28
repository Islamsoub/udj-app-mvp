import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { NotificationType, AdminRole } from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import adminAuth from '../../middleware/adminAuth';
import { rbac } from '../../middleware/rbac';
import { audit } from '../../middleware/auditLog';
import { createNotification } from '../../utils/notify';

const router = Router();

const ALL_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.FACULTY_ADMIN,
  AdminRole.REGISTRAR,
  AdminRole.NEWS_EDITOR,
];
const SEND_ROLES: AdminRole[] = [AdminRole.SUPER_ADMIN, AdminRole.NEWS_EDITOR];

// Target structure per reconciliation §5.
const sendSchema = z.object({
  target: z.enum(['all', 'faculty', 'programme', 'students']),
  facultyId: z.string().uuid().optional(),
  programmeId: z.string().uuid().optional(),
  studentIds: z.array(z.string().uuid()).optional(),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(180),
  // Optional Arabic copy. The admin composer's Arabic fields are a separate
  // frontend task; until then these default to empty on the write below.
  titleAr: z.string().max(120).optional(),
  bodyAr: z.string().max(180).optional(),
});

// Resolves the concrete list of student ids for a target.
async function resolveRecipients(
  d: z.infer<typeof sendSchema>
): Promise<string[]> {
  switch (d.target) {
    case 'all': {
      const students = await prisma.student.findMany({ select: { id: true } });
      return students.map((s) => s.id);
    }
    case 'faculty': {
      if (!d.facultyId) throw new AppError('facultyId requis pour la cible « faculty »', 400);
      const students = await prisma.student.findMany({
        where: { programme: { facultyId: d.facultyId } },
        select: { id: true },
      });
      return students.map((s) => s.id);
    }
    case 'programme': {
      if (!d.programmeId) throw new AppError('programmeId requis pour la cible « programme »', 400);
      const students = await prisma.student.findMany({
        where: { programmeId: d.programmeId },
        select: { id: true },
      });
      return students.map((s) => s.id);
    }
    case 'students': {
      if (!d.studentIds || d.studentIds.length === 0) {
        throw new AppError('studentIds requis pour la cible « students »', 400);
      }
      return d.studentIds;
    }
  }
}

// ─── POST /admin/notifications/send ──────────────────────────────────────────
router.post(
  '/send',
  adminAuth,
  rbac(...SEND_ROLES),
  audit('notification.send', 'Notification'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = sendSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid notification', 400);
      }
      const d = parsed.data;
      const recipientIds = await resolveRecipients(d);

      if (recipientIds.length === 0) throw new AppError('Aucun destinataire pour cette cible', 400);

      // In-app record for each recipient, then the push to their devices —
      // the same helper as every automated send (grades, schedule, news,
      // justifications). This route used to write the records only and answer
      // "Envoyé via FCM": no push ever left the server for a manual send.
      // The push is fire-and-forget, like everywhere else, so the answer says
      // what is known when it is sent: the records exist, the push is queued.
      const count = await createNotification(
        recipientIds,
        NotificationType.GENERAL,
        d.title,
        d.body,
        d.titleAr ?? '',
        d.bodyAr ?? ''
      );

      // The response body becomes the AuditLog `after` snapshot, which the
      // history endpoint reads back (no separate NotificationBatch model needed).
      res.status(201).json({
        target: d.target,
        facultyId: d.facultyId ?? null,
        programmeId: d.programmeId ?? null,
        title: d.title,
        body: d.body,
        count,
        sentAt: new Date().toISOString(),
        status: "Dans l'application · push en cours d'envoi",
        message: `Notification envoyée à ${count} étudiant${count > 1 ? 's' : ''}`,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /admin/notifications/history ────────────────────────────────────────
// Derived from AuditLog `notification.send` entries (target info + counts live
// in each log's `after` snapshot).
router.get('/history', adminAuth, rbac(...ALL_ROLES), async (_req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { action: 'notification.send' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { admin: { select: { firstName: true, lastName: true } } },
    });

    res.status(200).json(
      logs.map((l) => {
        const after = (l.after ?? {}) as Record<string, unknown>;
        return {
          id: l.id,
          title: after.title ?? null,
          body: after.body ?? null,
          target: after.target ?? null,
          count: after.count ?? 0,
          sentBy: `${l.admin.firstName} ${l.admin.lastName}`,
          when: l.createdAt,
          // Entries written before this change say "Envoyé via FCM", which was
          // never true; they are read back as stored.
          status: after.status ?? "Dans l'application",
        };
      })
    );
  } catch (err) {
    next(err);
  }
});

export default router;
