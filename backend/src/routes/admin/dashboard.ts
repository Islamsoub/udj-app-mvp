import { Router, Request, Response, NextFunction } from 'express';
import { Prisma, StudentStatus, AttendanceStatus, JustificationStatus } from '@prisma/client';
import prisma from '../../utils/prisma';
import adminAuth from '../../middleware/adminAuth';
import { rbac, facultyScopeWhere } from '../../middleware/rbac';
import { AdminRole } from '@prisma/client';
import { mentionFor } from '../../utils/adminHelpers';

const router = Router();

const ALL_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.FACULTY_ADMIN,
  AdminRole.REGISTRAR,
  AdminRole.NEWS_EDITOR,
];

// ─── GET /admin/dashboard/stats ──────────────────────────────────────────────
router.get(
  '/stats',
  adminAuth,
  rbac(...ALL_ROLES),
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
        attendanceTotal,
        attendancePresent,
        publishedGrades,
      ] = await Promise.all([
        prisma.student.count({ where: studentWhere }),
        prisma.student.count({ where: { ...studentWhere, status: StudentStatus.SUSPENDED } }),
        prisma.semester.findFirst({ where: { isCurrent: true } }),
        prisma.attendanceRecord.count({
          where: { ...attWhere, justificationStatus: JustificationStatus.PENDING },
        }),
        prisma.attendanceRecord.count({ where: attWhere }),
        prisma.attendanceRecord.count({
          where: {
            ...attWhere,
            status: { in: [AttendanceStatus.PRESENT, AttendanceStatus.JUSTIFIED] },
          },
        }),
        prisma.grade.findMany({
          where: { ...gradeWhere, noteFinale: { not: null }, publishedAt: { not: null } },
          select: { studentId: true, noteFinale: true },
        }),
      ]);

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
      const attAgg = await prisma.attendanceRecord.groupBy({
        by: ['studentId'],
        where: attWhere,
        _count: { _all: true },
      });
      const attPresentAgg = await prisma.attendanceRecord.groupBy({
        by: ['studentId'],
        where: {
          ...attWhere,
          status: { in: [AttendanceStatus.PRESENT, AttendanceStatus.JUSTIFIED] },
        },
        _count: { _all: true },
      });
      const presentByStudent = new Map(
        attPresentAgg.map((a) => [a.studentId, a._count._all])
      );

      const atRiskIds = new Set<string>();
      for (const [sid, agg] of perStudent) {
        if (agg.count > 0 && agg.sum / agg.count < 10) atRiskIds.add(sid);
      }
      for (const a of attAgg) {
        const total = a._count._all;
        const present = presentByStudent.get(a.studentId) ?? 0;
        if (total > 0 && (present / total) * 100 < threshold) atRiskIds.add(a.studentId);
      }

      const attendancePercentage =
        attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;

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
  rbac(...ALL_ROLES),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const logs = await prisma.auditLog.findMany({
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
