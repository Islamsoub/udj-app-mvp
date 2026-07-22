import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma, NotificationType, AdminRole } from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import adminAuth from '../../middleware/adminAuth';
import { rbac, facultyScopeWhere } from '../../middleware/rbac';
import { audit } from '../../middleware/auditLog';
import { computeNoteFinale, mentionFor, isPassing, GradeWeights } from '../../utils/adminHelpers';
import { createNotification } from '../../utils/notify';

const router = Router();

// Grade data is off-limits to NEWS_EDITOR; only these roles may read it.
const READ_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.REGISTRAR,
  AdminRole.FACULTY_ADMIN,
];
const WRITE_ROLES: AdminRole[] = [AdminRole.SUPER_ADMIN, AdminRole.REGISTRAR];

async function getWeights(): Promise<GradeWeights> {
  const settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
  return {
    gradeWeightCc: settings?.gradeWeightCc ?? 0.4,
    gradeWeightCf: settings?.gradeWeightCf ?? 0.6,
  };
}

async function assertGradeScope(req: Request, subjectId: string): Promise<void> {
  if (!req.adminScope?.facultyId) return;
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { programme: true },
  });
  if (!subject || subject.programme.facultyId !== req.adminScope.facultyId) {
    throw new AppError('Insufficient permissions for this action', 403);
  }
}

// ─── GET /admin/grades ───────────────────────────────────────────────────────
// Filter by subject, semester, student.
router.get('/', adminAuth, rbac(...READ_ROLES), async (req, res, next) => {
  try {
    const { subject, semester, student } = req.query as Record<string, string | undefined>;
    const where: Prisma.GradeWhereInput = {
      ...(facultyScopeWhere(req, ['subject', 'programme']) as Prisma.GradeWhereInput),
    };
    if (subject) where.subjectId = subject;
    if (semester) where.semesterId = semester;
    if (student) where.studentId = student;

    const grades = await prisma.grade.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        student: { select: { id: true, studentIdDisplay: true, firstName: true, lastName: true } },
        subject: { select: { id: true, code: true, nameFr: true, coefficient: true } },
        semester: { select: { id: true, label: true } },
      },
    });

    res.status(200).json(
      grades.map((g) => ({
        ...g,
        mention: mentionFor(g.noteFinale),
        passed: isPassing(g.noteFinale),
      }))
    );
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /admin/grades/:id (recompute NF from settings) ────────────────────
const updateSchema = z.object({
  noteCc: z.number().min(0).max(20).nullable().optional(),
  noteCf: z.number().min(0).max(20).nullable().optional(),
});

router.patch(
  '/:id',
  adminAuth,
  rbac(...WRITE_ROLES),
  audit('grade.update', 'Grade'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('CC/CF doivent être entre 0 et 20', 400);

      const existing = await prisma.grade.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Grade not found', 404);
      await assertGradeScope(req, existing.subjectId);

      const noteCc = parsed.data.noteCc !== undefined ? parsed.data.noteCc : existing.noteCc;
      const noteCf = parsed.data.noteCf !== undefined ? parsed.data.noteCf : existing.noteCf;
      const weights = await getWeights();
      const noteFinale = computeNoteFinale(noteCc, noteCf, weights);

      const grade = await prisma.grade.update({
        where: { id: existing.id },
        data: { noteCc, noteCf, noteFinale },
      });

      res.status(200).json({
        ...grade,
        mention: mentionFor(grade.noteFinale),
        passed: isPassing(grade.noteFinale),
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /admin/grades/:id/change (post-publication correction) ─────────────
// Corrects one field of an already-published grade. A mandatory `reason` is
// recorded in the audit log alongside the old and new values (architecture
// doc §3.4). SUPER_ADMIN / REGISTRAR only.
const changeSchema = z.object({
  field: z.enum(['cc', 'cf']),
  value: z.number().min(0).max(20),
  reason: z.string().trim().min(1, 'Un motif est requis'),
});

router.post(
  '/:id/change',
  adminAuth,
  rbac(...WRITE_ROLES),
  audit('grade.change', 'Grade'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = changeSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues[0]?.message ?? 'Correction invalide (field, value 0–20, reason requis)',
          400
        );
      }
      const { field, value, reason } = parsed.data;

      const existing = await prisma.grade.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Grade not found', 404);
      await assertGradeScope(req, existing.subjectId);

      const oldValue = field === 'cc' ? existing.noteCc : existing.noteCf;
      const noteCc = field === 'cc' ? value : existing.noteCc;
      const noteCf = field === 'cf' ? value : existing.noteCf;
      const weights = await getWeights();
      const noteFinale = computeNoteFinale(noteCc, noteCf, weights);

      const grade = await prisma.grade.update({
        where: { id: existing.id },
        data: { noteCc, noteCf, noteFinale },
      });

      // The audit middleware persists this response body as the `after`
      // snapshot, so `reason` + old/new values are recorded in the audit log.
      res.status(200).json({
        ...grade,
        mention: mentionFor(grade.noteFinale),
        passed: isPassing(grade.noteFinale),
        reason,
        correction: { field, oldValue, newValue: value, reason },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /admin/grades/bulk (from parsed CSV rows) ──────────────────────────
// Body: { subjectId, semesterId, rows: [{ matricule|studentId, noteCc, noteCf }] }
const bulkSchema = z.object({
  subjectId: z.string().uuid(),
  semesterId: z.string().uuid(),
  rows: z
    .array(
      z.object({
        matricule: z.string().optional(),
        studentId: z.string().uuid().optional(),
        noteCc: z.number().min(0).max(20).nullable().optional(),
        noteCf: z.number().min(0).max(20).nullable().optional(),
      })
    )
    .min(1)
    .max(1000),
});

router.post(
  '/bulk',
  adminAuth,
  rbac(...WRITE_ROLES),
  audit('grade.bulkCreate', 'Grade'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = bulkSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid bulk grade payload', 400);
      const { subjectId, semesterId, rows } = parsed.data;
      await assertGradeScope(req, subjectId);

      const weights = await getWeights();
      const students = await prisma.student.findMany({
        select: { id: true, studentIdDisplay: true },
      });
      const idByMatricule = new Map(students.map((s) => [s.studentIdDisplay.toUpperCase(), s.id]));

      const report: { studentId?: string; matricule?: string; status: 'saved' | 'error'; error?: string }[] = [];
      let saved = 0;

      for (const r of rows) {
        const studentId = r.studentId ?? (r.matricule ? idByMatricule.get(r.matricule.toUpperCase()) : undefined);
        if (!studentId) {
          report.push({ matricule: r.matricule, status: 'error', error: 'matricule inconnu' });
          continue;
        }
        const noteFinale = computeNoteFinale(r.noteCc ?? null, r.noteCf ?? null, weights);
        await prisma.grade.upsert({
          where: {
            studentId_subjectId_semesterId: { studentId, subjectId, semesterId },
          },
          create: {
            studentId,
            subjectId,
            semesterId,
            noteCc: r.noteCc ?? null,
            noteCf: r.noteCf ?? null,
            noteFinale,
          },
          update: {
            noteCc: r.noteCc ?? null,
            noteCf: r.noteCf ?? null,
            noteFinale,
          },
        });
        saved += 1;
        report.push({ studentId, matricule: r.matricule, status: 'saved' });
      }

      res.status(201).json({ total: rows.length, saved, skipped: rows.length - saved, report });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /admin/grades/publish ──────────────────────────────────────────────
// Two-phase publication (architecture doc §3.3):
//   type: 'cc' → publishes contrôle continu scores (sets publishedCcAt)
//   type: 'nf' → publishes final results (sets publishedNfAt); requires CC
//                already published and all NFs computed.
// Targets one subject (subjectId) or every subject in a semester (optionally
// narrowed by programmeId). Notifies every affected student.
const publishSchema = z.object({
  type: z.enum(['cc', 'nf']),
  semesterId: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  programmeId: z.string().uuid().optional(),
});

router.post(
  '/publish',
  adminAuth,
  rbac(...WRITE_ROLES),
  audit('grade.publish', 'Grade'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = publishSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(
          parsed.error.issues[0]?.message ?? 'type et semesterId requis',
          400
        );
      }
      const { type, semesterId, subjectId, programmeId } = parsed.data;

      const semester = await prisma.semester.findUnique({ where: { id: semesterId } });
      if (!semester) throw new AppError('Semester not found', 404);

      // Resolve the set of subjects to publish.
      let subjectIds: string[];
      if (subjectId) {
        await assertGradeScope(req, subjectId);
        subjectIds = [subjectId];
      } else {
        const subjects = await prisma.subject.findMany({
          where: {
            semesterId,
            ...(programmeId ? { programmeId } : {}),
            ...(facultyScopeWhere(req, ['programme']) as Prisma.SubjectWhereInput),
          },
          select: { id: true },
        });
        subjectIds = subjects.map((s) => s.id);
      }
      if (subjectIds.length === 0) {
        throw new AppError('Aucune matière à publier pour ce périmètre', 400);
      }

      const gradeWhere: Prisma.GradeWhereInput = {
        subjectId: { in: subjectIds },
        semesterId,
      };
      const grades = await prisma.grade.findMany({
        where: gradeWhere,
        select: {
          id: true,
          studentId: true,
          noteCc: true,
          noteCf: true,
          noteFinale: true,
          publishedCcAt: true,
        },
      });
      if (grades.length === 0) {
        throw new AppError('Aucune note à publier pour ce périmètre', 400);
      }

      // Phase-specific validation.
      if (type === 'cc') {
        if (grades.some((g) => g.noteCc == null)) {
          throw new AppError(
            'Toutes les notes de contrôle continu doivent être saisies avant publication',
            400
          );
        }
      } else {
        if (grades.some((g) => g.publishedCcAt == null)) {
          throw new AppError(
            'Les notes CC doivent être publiées avant les résultats finaux',
            400
          );
        }
        if (grades.some((g) => g.noteCf == null || g.noteFinale == null)) {
          throw new AppError(
            'Toutes les notes CF doivent être saisies et les NF calculées avant publication',
            400
          );
        }
      }

      const now = new Date();
      const studentIds = Array.from(new Set(grades.map((g) => g.studentId)));

      const titleFr =
        type === 'cc'
          ? `Vos notes de contrôle continu (${semester.label}) sont disponibles`
          : `Vos résultats finaux (${semester.label}) sont disponibles`;
      const titleAr =
        type === 'cc'
          ? `نتائج الامتحان الجزئي (${semester.label}) متاحة`
          : `نتائجك النهائية (${semester.label}) متاحة`;
      const bodyFr =
        type === 'cc'
          ? 'Consultez vos résultats de CC dans l’application.'
          : 'Consultez votre relevé complet dans l’application.';
      const bodyAr =
        type === 'cc'
          ? 'اطلع على نتائج الامتحان الجزئي في التطبيق.'
          : 'اطلع على كشفك الكامل في التطبيق.';

      const result = await prisma.$transaction(async (tx) => {
        await tx.grade.updateMany({
          where: gradeWhere,
          data:
            type === 'cc'
              ? { publishedCcAt: now }
              : { publishedNfAt: now, isValidated: true },
        });
        const notified = await createNotification(
          studentIds,
          NotificationType.GRADES,
          titleFr,
          bodyFr,
          titleAr,
          bodyAr,
          tx
        );
        return { notified };
      });

      res.status(200).json({
        type,
        semesterId,
        subjectIds,
        published: grades.length,
        notified: result.notified,
        message:
          type === 'cc'
            ? 'Notes CC publiées — notifications envoyées'
            : 'Résultats finaux publiés — notifications envoyées',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
