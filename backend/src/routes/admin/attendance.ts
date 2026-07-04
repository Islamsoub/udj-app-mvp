import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  Prisma,
  AttendanceStatus,
  JustificationStatus,
  AdminRole,
} from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import adminAuth from '../../middleware/adminAuth';
import { rbac, facultyScopeWhere } from '../../middleware/rbac';
import { audit } from '../../middleware/auditLog';

const router = Router();

const ALL_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.FACULTY_ADMIN,
  AdminRole.REGISTRAR,
  AdminRole.NEWS_EDITOR,
];

async function assertAttendanceScope(req: Request, subjectId: string): Promise<void> {
  if (!req.adminScope?.facultyId) return;
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { programme: true },
  });
  if (!subject || subject.programme.facultyId !== req.adminScope.facultyId) {
    throw new AppError('Insufficient permissions for this action', 403);
  }
}

// ─── GET /admin/attendance ───────────────────────────────────────────────────
// Overview + pending justification count. Filter by subject, student, status.
router.get('/', adminAuth, rbac(...ALL_ROLES), async (req, res, next) => {
  try {
    const { subject, student, status } = req.query as Record<string, string | undefined>;
    const where: Prisma.AttendanceRecordWhereInput = {
      ...(facultyScopeWhere(req, ['subject', 'programme']) as Prisma.AttendanceRecordWhereInput),
    };
    if (subject) where.subjectId = subject;
    if (student) where.studentId = student;
    if (status && status in AttendanceStatus) where.status = status as AttendanceStatus;

    const [records, pendingJustifications, statusCounts] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        orderBy: { sessionDate: 'desc' },
        take: 500,
        include: {
          student: { select: { id: true, studentIdDisplay: true, firstName: true, lastName: true } },
          subject: { select: { id: true, code: true, nameFr: true } },
        },
      }),
      prisma.attendanceRecord.count({
        where: {
          ...(facultyScopeWhere(req, ['subject', 'programme']) as Prisma.AttendanceRecordWhereInput),
          justificationStatus: JustificationStatus.PENDING,
        },
      }),
      prisma.attendanceRecord.groupBy({ by: ['status'], where, _count: { _all: true } }),
    ]);

    res.status(200).json({
      records,
      pendingJustifications,
      statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count._all })),
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /admin/attendance/pending-justifications ────────────────────────────
router.get('/pending-justifications', adminAuth, rbac(...ALL_ROLES), async (req, res, next) => {
  try {
    const where: Prisma.AttendanceRecordWhereInput = {
      ...(facultyScopeWhere(req, ['subject', 'programme']) as Prisma.AttendanceRecordWhereInput),
      justificationStatus: JustificationStatus.PENDING,
    };
    const pending = await prisma.attendanceRecord.findMany({
      where,
      orderBy: { sessionDate: 'desc' },
      include: {
        student: { select: { id: true, studentIdDisplay: true, firstName: true, lastName: true } },
        subject: { select: { id: true, code: true, nameFr: true } },
      },
    });
    res.status(200).json(pending);
  } catch (err) {
    next(err);
  }
});

// ─── POST /admin/attendance/record ───────────────────────────────────────────
// Record a session: { subjectId, sessionDate, records: [{ studentId, status }] }
const recordSchema = z.object({
  subjectId: z.string().uuid(),
  sessionDate: z.string(),
  records: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        status: z.nativeEnum(AttendanceStatus),
      })
    )
    .min(1)
    .max(500),
});

router.post(
  '/record',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN, AdminRole.FACULTY_ADMIN),
  audit('attendance.record', 'AttendanceRecord'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = recordSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid attendance payload', 400);
      const { subjectId, sessionDate, records } = parsed.data;
      await assertAttendanceScope(req, subjectId);

      const date = new Date(sessionDate);
      let saved = 0;
      for (const r of records) {
        await prisma.attendanceRecord.upsert({
          where: {
            studentId_subjectId_sessionDate: { studentId: r.studentId, subjectId, sessionDate: date },
          },
          create: { studentId: r.studentId, subjectId, sessionDate: date, status: r.status },
          update: { status: r.status },
        });
        saved += 1;
      }

      res.status(201).json({ subjectId, sessionDate, saved });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /admin/attendance/:id/justification (approve/reject) ──────────────
const justifySchema = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().max(500).optional(),
});

router.patch(
  '/:id/justification',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN, AdminRole.FACULTY_ADMIN, AdminRole.REGISTRAR),
  audit(
    (req) => (req.body?.decision === 'reject' ? 'attendance.reject' : 'attendance.approve'),
    'AttendanceRecord'
  ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = justifySchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Décision invalide', 400);

      const record = await prisma.attendanceRecord.findUnique({ where: { id: String(req.params.id) } });
      if (!record) throw new AppError('Attendance record not found', 404);
      await assertAttendanceScope(req, record.subjectId);

      const approve = parsed.data.decision === 'approve';
      const updated = await prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          justificationStatus: approve ? JustificationStatus.APPROVED : JustificationStatus.REJECTED,
          // An approved justification converts the absence to JUSTIFIED.
          ...(approve ? { status: AttendanceStatus.JUSTIFIED } : {}),
          ...(parsed.data.note !== undefined ? { justificationNote: parsed.data.note } : {}),
        },
      });

      res.status(200).json({
        id: updated.id,
        justificationStatus: updated.justificationStatus,
        status: updated.status,
        message: approve ? 'Justificatif approuvé' : 'Justificatif rejeté',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
