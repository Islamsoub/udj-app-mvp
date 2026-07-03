import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma, NotificationType, AdminRole } from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import adminAuth from '../../middleware/adminAuth';
import { rbac, facultyScopeWhere } from '../../middleware/rbac';
import { audit } from '../../middleware/auditLog';
import { computeNoteFinale, mentionFor, isPassing, GradeWeights } from '../../utils/adminHelpers';

const router = Router();

const ALL_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.FACULTY_ADMIN,
  AdminRole.REGISTRAR,
  AdminRole.NEWS_EDITOR,
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
router.get('/', adminAuth, rbac(...ALL_ROLES), async (req, res, next) => {
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
// Publish all grades for a subject (+ semester); notify each affected student.
const publishSchema = z.object({
  subjectId: z.string().uuid(),
  semesterId: z.string().uuid().optional(),
});

router.post(
  '/publish',
  adminAuth,
  rbac(...WRITE_ROLES),
  audit('grade.publish', 'Grade'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = publishSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('subjectId requis', 400);
      const { subjectId, semesterId } = parsed.data;
      await assertGradeScope(req, subjectId);

      const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
      if (!subject) throw new AppError('Subject not found', 404);

      const gradeWhere: Prisma.GradeWhereInput = {
        subjectId,
        ...(semesterId ? { semesterId } : {}),
        noteFinale: { not: null },
      };
      const grades = await prisma.grade.findMany({
        where: gradeWhere,
        select: { id: true, studentId: true },
      });
      if (grades.length === 0) throw new AppError('Aucune note à publier pour cette matière', 400);

      const now = new Date();
      const settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
      const notify = settings?.notifyOnPublish ?? true;

      const result = await prisma.$transaction(async (tx) => {
        await tx.grade.updateMany({
          where: gradeWhere,
          data: { isValidated: true, publishedAt: now },
        });

        let notified = 0;
        if (notify) {
          const studentIds = Array.from(new Set(grades.map((g) => g.studentId)));
          await tx.notification.createMany({
            data: studentIds.map((studentId) => ({
              studentId,
              type: NotificationType.GRADES,
              titleFr: 'Nouvelles notes disponibles',
              titleAr: 'نتائج جديدة متاحة',
              bodyFr: `Vos notes pour « ${subject.nameFr} » sont désormais disponibles.`,
              bodyAr: `أصبحت درجاتك في مادة « ${subject.nameAr} » متاحة الآن.`,
            })),
          });
          notified = studentIds.length;
        }
        return { published: grades.length, notified };
      });

      res.status(200).json({
        subjectId,
        published: result.published,
        notified: result.notified,
        message: 'Notes publiées — notifications envoyées',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
