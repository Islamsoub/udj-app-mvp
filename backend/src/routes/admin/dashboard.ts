import { Router, Request, Response, NextFunction } from 'express';
import { Prisma, StudentStatus, JustificationStatus } from '@prisma/client';
import prisma from '../../utils/prisma';
import adminAuth from '../../middleware/adminAuth';
import { rbac, facultyScopeWhere } from '../../middleware/rbac';
import { AdminRole } from '@prisma/client';
import { mentionFor } from '../../utils/adminHelpers';
import {
  buildSessionHoursResolver,
  hoursBasedPercentage,
  AttendanceInput,
} from '../../utils/attendance';

const router = Router();

// Dashboard aggregates student/grade/attendance data, off-limits to NEWS_EDITOR.
const READ_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.REGISTRAR,
  AdminRole.FACULTY_ADMIN,
];

// ─── GET /admin/dashboard/stats ──────────────────────────────────────────────
router.get(
  '/stats',
  adminAuth,
  rbac(...READ_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentWhere = facultyScopeWhere(req, ['programme']) as Prisma.StudentWhereInput;
      const gradeWhere = facultyScopeWhere(req, [
        'subject',
        'programme',
      ]) as Prisma.GradeWhereInput;
      const attWhere = facultyScopeWhere(req, [
        'subject',
        'programme',
      ]) as Prisma.AttendanceRecordWhereInput;

      const settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
      const threshold = settings?.attendanceThreshold ?? 75;

      const [
        studentsCount,
        studentsSuspended,
        currentSemester,
        pendingJustifications,
        attendanceRecords,
        publishedGrades,
      ] = await Promise.all([
        prisma.student.count({ where: studentWhere }),
        prisma.student.count({ where: { ...studentWhere, status: StudentStatus.SUSPENDED } }),
        prisma.semester.findFirst({ where: { isCurrent: true } }),
        prisma.attendanceRecord.count({
          where: { ...attWhere, justificationStatus: JustificationStatus.PENDING },
        }),
        // Hours-based attendance (architecture doc §4.3): pull the records and
        // resolve session lengths from the schedule, matching GET /student/attendance
        // and GET /admin/attendance/overview instead of session-count math.
        prisma.attendanceRecord.findMany({
          where: attWhere,
          select: {
            subjectId: true,
            studentId: true,
            sessionDate: true,
            status: true,
            hoursAttended: true,
          },
        }),
        // Admin dashboard: count every grade with a computed final score,
        // regardless of publication status. The registrar needs full visibility
        // (unlike the student-facing route, which gates on publishedNfAt).
        prisma.grade.findMany({
          where: { ...gradeWhere, noteFinale: { not: null } },
          select: { studentId: true, noteFinale: true },
        }),
      ]);

      // Session lengths for every subject that appears in the attendance records.
      const attSubjectIds = [...new Set(attendanceRecords.map((r) => r.subjectId))];
      const attSlots = attSubjectIds.length
        ? await prisma.scheduleEntry.findMany({
            where: { subjectId: { in: attSubjectIds } },
            select: { subjectId: true, dayOfWeek: true, startTime: true, endTime: true },
          })
        : [];
      const resolveHours = buildSessionHoursResolver(attSlots);

      // Average GPA across published grades (/20 scale).
      const finals = publishedGrades
        .map((g) => g.noteFinale)
        .filter((n): n is number => n != null);
      const averageGpa =
        finals.length > 0
          ? Math.round((finals.reduce((a, b) => a + b, 0) / finals.length) * 10) / 10
          : 0;

      // Grade distribution buckets.
      const buckets = { '<10': 0, '10-12': 0, '12-14': 0, '14-16': 0, '16+': 0 };
      for (const n of finals) {
        if (n < 10) buckets['<10'] += 1;
        else if (n < 12) buckets['10-12'] += 1;
        else if (n < 14) buckets['12-14'] += 1;
        else if (n < 16) buckets['14-16'] += 1;
        else buckets['16+'] += 1;
      }

      // Students at risk: average published grade < 10, OR attendance < threshold.
      const perStudent = new Map<string, { sum: number; count: number }>();
      for (const g of publishedGrades) {
        if (g.noteFinale == null) continue;
        const cur = perStudent.get(g.studentId) ?? { sum: 0, count: 0 };
        cur.sum += g.noteFinale;
        cur.count += 1;
        perStudent.set(g.studentId, cur);
      }
      // Per-student hours-based attendance for the at-risk check.
      const attByStudent = new Map<string, AttendanceInput[]>();
      for (const r of attendanceRecords) {
        const arr = attByStudent.get(r.studentId) ?? [];
        arr.push({
          subjectId: r.subjectId,
          sessionDate: r.sessionDate,
          status: r.status,
          hoursAttended: r.hoursAttended,
        });
        attByStudent.set(r.studentId, arr);
      }

      const atRiskIds = new Set<string>();
      for (const [sid, agg] of perStudent) {
        if (agg.count > 0 && agg.sum / agg.count < 10) atRiskIds.add(sid);
      }
      for (const [sid, recs] of attByStudent) {
        const pct = hoursBasedPercentage(recs, resolveHours);
        if (pct != null && pct < threshold) atRiskIds.add(sid);
      }

      const attendancePercentage = hoursBasedPercentage(attendanceRecords, resolveHours) ?? 0;

      res.status(200).json({
        studentsCount,
        studentsAtRisk: atRiskIds.size,
        studentsSuspended,
        attendancePercentage,
        attendanceThreshold: threshold,
        averageGpa,
        gpaScale: 20,
        gpaMention: mentionFor(averageGpa),
        currentSemester: currentSemester?.label ?? null,
        pendingJustifications,
        gradeDistribution: [
          { range: '<10', count: buckets['<10'] },
          { range: '10-12', count: buckets['10-12'] },
          { range: '12-14', count: buckets['12-14'] },
          { range: '14-16', count: buckets['14-16'] },
          { range: '16+', count: buckets['16+'] },
        ],
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /admin/dashboard/recent-activity ────────────────────────────────────
// Last 20 audit log entries with admin name + action details.
router.get(
  '/recent-activity',
  adminAuth,
  rbac(...READ_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // The audit log records entityType/entityId as free text with no faculty
      // column, so there is no reliable way to filter it down to one faculty's
      // scope. Rather than leak university-wide activity — including actions on
      // students and grades outside the caller's remit — a non-SUPER_ADMIN sees
      // only their own actions. Broader per-faculty visibility needs a faculty
      // reference on AuditLog first.
      const isSuperAdmin = req.admin?.role === AdminRole.SUPER_ADMIN;

      const logs = await prisma.auditLog.findMany({
        where: isSuperAdmin ? {} : { adminId: req.admin?.adminId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          admin: { select: { firstName: true, lastName: true, role: true } },
        },
      });

      res.status(200).json(
        logs.map((l) => ({
          id: l.id,
          action: l.action,
          entityType: l.entityType,
          entityId: l.entityId,
          who: `${l.admin.firstName} ${l.admin.lastName}`,
          role: l.admin.role,
          before: l.before,
          after: l.after,
          when: l.createdAt,
        }))
      );
    } catch (err) {
      next(err);
    }
  }
);

export default router;
