import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  Prisma,
  AttendanceStatus,
  JustificationStatus,
  NotificationType,
  AdminRole,
} from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import adminAuth from '../../middleware/adminAuth';
import { rbac, facultyScopeWhere } from '../../middleware/rbac';
import { audit } from '../../middleware/auditLog';
import { createNotification } from '../../utils/notify';
import {
  buildSessionHoursResolver,
  hoursBasedPercentage,
  AttendanceInput,
} from '../../utils/attendance';

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

// DD/MM/YYYY from the stored session date (UTC parts, tz-stable for display).
function formatSessionDate(d: Date): string {
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getUTCFullYear()}`;
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

// ─── GET /admin/attendance/overview ──────────────────────────────────────────
// Programme-level table (architecture doc §4.7): per subject → sessions, class
// average (hours-based), students at risk. Threshold from SystemSettings.
router.get('/overview', adminAuth, rbac(...ALL_ROLES), async (req, res, next) => {
  try {
    const programmeId = (req.query.programmeId as string | undefined) ?? '';
    if (!programmeId) throw new AppError('programmeId requis', 400);

    // Faculty scope guard: a FACULTY_ADMIN may only view their own programmes.
    if (req.adminScope?.facultyId) {
      const programme = await prisma.programme.findUnique({
        where: { id: programmeId },
        select: { facultyId: true },
      });
      if (!programme || programme.facultyId !== req.adminScope.facultyId) {
        throw new AppError('Insufficient permissions for this action', 403);
      }
    }

    const settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
    const threshold = settings?.attendanceThreshold ?? 75;

    const currentSemester = await prisma.semester.findFirst({ where: { isCurrent: true } });
    if (!currentSemester) {
      res.status(200).json({ programmeId, threshold, subjects: [] });
      return;
    }

    const subjects = await prisma.subject.findMany({
      where: { programmeId, semesterId: currentSemester.id },
      select: { id: true, code: true, nameFr: true },
      orderBy: { code: 'asc' },
    });
    const subjectIds = subjects.map((s) => s.id);

    if (subjectIds.length === 0) {
      res.status(200).json({ programmeId, threshold, subjects: [] });
      return;
    }

    const [slots, records] = await Promise.all([
      prisma.scheduleEntry.findMany({
        where: { subjectId: { in: subjectIds }, semesterId: currentSemester.id },
        select: { subjectId: true, dayOfWeek: true, startTime: true, endTime: true },
      }),
      prisma.attendanceRecord.findMany({
        where: { subjectId: { in: subjectIds } },
        select: {
          subjectId: true,
          studentId: true,
          sessionDate: true,
          status: true,
          hoursAttended: true,
        },
      }),
    ]);

    const resolveHours = buildSessionHoursResolver(slots);

    // Weekly session count per subject (for the planned-sessions estimate).
    const weeklySessions = new Map<string, number>();
    for (const s of slots) {
      weeklySessions.set(s.subjectId, (weeklySessions.get(s.subjectId) ?? 0) + 1);
    }
    const spanMs = currentSemester.endDate.getTime() - currentSemester.startDate.getTime();
    const weeksInSemester = Math.max(1, Math.ceil(spanMs / (7 * 24 * 60 * 60 * 1000)));

    const recordsBySubject = new Map<string, typeof records>();
    for (const r of records) {
      const arr = recordsBySubject.get(r.subjectId) ?? [];
      arr.push(r);
      recordsBySubject.set(r.subjectId, arr);
    }

    const overview = subjects.map((subject) => {
      const subjectRecords = recordsBySubject.get(subject.id) ?? [];
      const inputs: AttendanceInput[] = subjectRecords.map((r) => ({
        subjectId: r.subjectId,
        sessionDate: r.sessionDate,
        status: r.status,
        hoursAttended: r.hoursAttended,
      }));

      const completedSessions = new Set(
        subjectRecords.map((r) => r.sessionDate.toISOString().slice(0, 10))
      ).size;

      const weekly = weeklySessions.get(subject.id) ?? 0;
      const totalSessions =
        weekly > 0 ? Math.max(completedSessions, weekly * weeksInSemester) : completedSessions;

      const classAveragePercentage = hoursBasedPercentage(inputs, resolveHours);

      // Per-student hours-based percentage → count those below threshold.
      const perStudent = new Map<string, AttendanceInput[]>();
      for (const r of subjectRecords) {
        const arr = perStudent.get(r.studentId) ?? [];
        arr.push({
          subjectId: r.subjectId,
          sessionDate: r.sessionDate,
          status: r.status,
          hoursAttended: r.hoursAttended,
        });
        perStudent.set(r.studentId, arr);
      }
      let studentsAtRisk = 0;
      for (const [, recs] of perStudent) {
        const pct = hoursBasedPercentage(recs, resolveHours);
        if (pct != null && pct < threshold) studentsAtRisk += 1;
      }

      return {
        subjectId: subject.id,
        subjectName: subject.nameFr,
        subjectCode: subject.code,
        totalSessions,
        completedSessions,
        classAveragePercentage,
        studentsAtRisk,
        belowThreshold: classAveragePercentage != null && classAveragePercentage < threshold,
      };
    });

    res.status(200).json({ programmeId, threshold, subjects: overview });
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
      orderBy: { sessionDate: 'asc' }, // oldest first — urgency-based (architecture §4.1)
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
// Record a session: { subjectId, sessionDate, records: [{ studentId, status, hoursAttended? }] }
// PARTIAL requires hoursAttended (0 < h ≤ session total). PRESENT/ABSENT store
// null (full / zero implied, derived from the ScheduleEntry at read time).
const recordSchema = z.object({
  subjectId: z.string().uuid(),
  sessionDate: z.string(),
  records: z
    .array(
      z.object({
        studentId: z.string().uuid(),
        status: z.nativeEnum(AttendanceStatus),
        hoursAttended: z.number().positive().optional(),
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

      // Session length for this subject/date, derived from its ScheduleEntry.
      const slots = await prisma.scheduleEntry.findMany({
        where: { subjectId },
        select: { subjectId: true, dayOfWeek: true, startTime: true, endTime: true },
      });
      const sessionHours = buildSessionHoursResolver(slots)(subjectId, date);

      let saved = 0;
      for (const r of records) {
        let hoursAttended: number | null = null;
        if (r.status === AttendanceStatus.PARTIAL) {
          if (r.hoursAttended == null) {
            throw new AppError('hoursAttended requis pour un statut PARTIAL', 400);
          }
          if (r.hoursAttended <= 0 || r.hoursAttended > sessionHours) {
            throw new AppError(
              `hoursAttended doit être supérieur à 0 et ≤ ${sessionHours}h (durée de la séance)`,
              400
            );
          }
          hoursAttended = r.hoursAttended;
        }

        await prisma.attendanceRecord.upsert({
          where: {
            studentId_subjectId_sessionDate: { studentId: r.studentId, subjectId, sessionDate: date },
          },
          create: { studentId: r.studentId, subjectId, sessionDate: date, status: r.status, hoursAttended },
          update: { status: r.status, hoursAttended },
        });
        saved += 1;
      }

      res.status(201).json({ subjectId, sessionDate, sessionHours, saved });
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

      const record = await prisma.attendanceRecord.findUnique({
        where: { id: String(req.params.id) },
        include: { subject: { select: { nameFr: true } } },
      });
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

      // Automated notification to the individual student (architecture §6.1).
      const dateStr = formatSessionDate(record.sessionDate);
      const subjectName = record.subject.nameFr;
      await createNotification(
        [record.studentId],
        NotificationType.ATTENDANCE,
        approve ? `Justificatif approuvé — ${subjectName}` : `Justificatif rejeté — ${subjectName}`,
        approve
          ? `Votre justificatif pour ${subjectName} (${dateStr}) a été approuvé.`
          : `Votre justificatif pour ${subjectName} (${dateStr}) a été rejeté.`
      );

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
