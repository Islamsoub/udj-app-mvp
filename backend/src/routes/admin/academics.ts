import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma, ProgrammeLevel, AdminRole } from '@prisma/client';
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

// ══════════════════════════════════════════════════════════════════════════
//  FACULTIES  (architecture §5.4)
// ══════════════════════════════════════════════════════════════════════════

router.get('/faculties', adminAuth, rbac(...ALL_ROLES), async (req, res, next) => {
  try {
    const where: Prisma.FacultyWhereInput = {};
    if (req.adminScope?.facultyId) where.id = req.adminScope.facultyId;
    const faculties = await prisma.faculty.findMany({
      where,
      orderBy: { code: 'asc' },
      include: { _count: { select: { programmes: true } } },
    });
    res.status(200).json(faculties);
  } catch (err) {
    next(err);
  }
});

const facultySchema = z.object({
  nameFr: z.string().min(1),
  nameAr: z.string().min(1),
  code: z.string().min(1).max(12),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().optional().default(''),
  hours: z.string().optional().default(''),
});

router.post(
  '/faculties',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('faculty.create', 'Faculty'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = facultySchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid faculty data', 400);
      const dupe = await prisma.faculty.findUnique({ where: { code: parsed.data.code } });
      if (dupe) throw new AppError('Ce code faculté est déjà utilisé', 409);
      const faculty = await prisma.faculty.create({ data: parsed.data });
      res.status(201).json(faculty);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/faculties/:id',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('faculty.update', 'Faculty'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = facultySchema.partial().safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid faculty data', 400);
      const existing = await prisma.faculty.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Faculty not found', 404);
      const faculty = await prisma.faculty.update({ where: { id: String(req.params.id) }, data: parsed.data });
      res.status(200).json(faculty);
    } catch (err) {
      next(err);
    }
  }
);

// ══════════════════════════════════════════════════════════════════════════
//  PROGRAMMES
// ══════════════════════════════════════════════════════════════════════════

router.get('/programmes', adminAuth, rbac(...ALL_ROLES), async (req, res, next) => {
  try {
    const where: Prisma.ProgrammeWhereInput = {
      ...(facultyScopeWhere(req, []) as Prisma.ProgrammeWhereInput),
    };
    const { faculty } = req.query as Record<string, string | undefined>;
    if (faculty) where.facultyId = faculty;
    const programmes = await prisma.programme.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        faculty: { select: { id: true, nameFr: true, code: true } },
        _count: { select: { students: true, subjects: true } },
      },
    });
    res.status(200).json(programmes);
  } catch (err) {
    next(err);
  }
});

const programmeSchema = z.object({
  nameFr: z.string().min(1),
  nameAr: z.string().min(1),
  code: z.string().min(1).max(16),
  facultyId: z.string().uuid(),
  level: z.nativeEnum(ProgrammeLevel),
  durationSemesters: z.number().int().min(2).max(16),
  totalCredits: z.number().int().min(1),
});

router.post(
  '/programmes',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('programme.create', 'Programme'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = programmeSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid programme data', 400);
      const dupe = await prisma.programme.findUnique({ where: { code: parsed.data.code } });
      if (dupe) throw new AppError('Ce code programme est déjà utilisé', 409);
      const programme = await prisma.programme.create({ data: parsed.data });
      res.status(201).json(programme);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/programmes/:id',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('programme.update', 'Programme'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = programmeSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid programme data', 400);
      const existing = await prisma.programme.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Programme not found', 404);
      const programme = await prisma.programme.update({
        where: { id: String(req.params.id) },
        data: parsed.data,
      });
      res.status(200).json(programme);
    } catch (err) {
      next(err);
    }
  }
);

// ══════════════════════════════════════════════════════════════════════════
//  SEMESTERS  (setting one current unsets the previous current)
// ══════════════════════════════════════════════════════════════════════════

router.get('/semesters', adminAuth, rbac(...ALL_ROLES), async (_req, res, next) => {
  try {
    const semesters = await prisma.semester.findMany({
      orderBy: [{ academicYear: 'desc' }, { label: 'asc' }],
    });
    res.status(200).json(semesters);
  } catch (err) {
    next(err);
  }
});

const semesterSchema = z.object({
  label: z.string().min(1),
  academicYear: z.string().min(1),
  startDate: z.string().datetime().or(z.string().min(1)),
  endDate: z.string().datetime().or(z.string().min(1)),
  isCurrent: z.boolean().optional().default(false),
});

router.post(
  '/semesters',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('semester.create', 'Semester'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = semesterSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid semester data', 400);
      const d = parsed.data;

      const semester = await prisma.$transaction(async (tx) => {
        if (d.isCurrent) {
          await tx.semester.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } });
        }
        return tx.semester.create({
          data: {
            label: d.label,
            academicYear: d.academicYear,
            startDate: new Date(d.startDate),
            endDate: new Date(d.endDate),
            isCurrent: d.isCurrent,
          },
        });
      });

      res.status(201).json(semester);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/semesters/:id',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('semester.update', 'Semester'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = semesterSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid semester data', 400);
      const d = parsed.data;

      const existing = await prisma.semester.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Semester not found', 404);

      const semester = await prisma.$transaction(async (tx) => {
        if (d.isCurrent === true) {
          await tx.semester.updateMany({
            where: { isCurrent: true, id: { not: String(req.params.id) } },
            data: { isCurrent: false },
          });
        }
        return tx.semester.update({
          where: { id: String(req.params.id) },
          data: {
            ...(d.label !== undefined ? { label: d.label } : {}),
            ...(d.academicYear !== undefined ? { academicYear: d.academicYear } : {}),
            ...(d.startDate !== undefined ? { startDate: new Date(d.startDate) } : {}),
            ...(d.endDate !== undefined ? { endDate: new Date(d.endDate) } : {}),
            ...(d.isCurrent !== undefined ? { isCurrent: d.isCurrent } : {}),
          },
        });
      });

      res.status(200).json(semester);
    } catch (err) {
      next(err);
    }
  }
);

// ══════════════════════════════════════════════════════════════════════════
//  SUBJECTS  (unique [programmeId, semesterId, code])
// ══════════════════════════════════════════════════════════════════════════

router.get('/subjects', adminAuth, rbac(...ALL_ROLES), async (req, res, next) => {
  try {
    const where: Prisma.SubjectWhereInput = {
      ...(facultyScopeWhere(req, ['programme']) as Prisma.SubjectWhereInput),
    };
    const { programme, semester } = req.query as Record<string, string | undefined>;
    if (programme) where.programmeId = programme;
    if (semester) where.semesterId = semester;
    const subjects = await prisma.subject.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        programme: { select: { id: true, code: true, nameFr: true, facultyId: true } },
        semester: { select: { id: true, label: true } },
        _count: { select: { grades: true } },
      },
    });
    res.status(200).json(subjects);
  } catch (err) {
    next(err);
  }
});

const subjectSchema = z.object({
  nameFr: z.string().min(1),
  nameAr: z.string().min(1),
  code: z.string().min(1).max(16),
  programmeId: z.string().uuid(),
  semesterId: z.string().uuid(),
  coefficient: z.number().min(1).max(10),
  credits: z.number().int().min(1).max(30),
  hoursCm: z.number().min(0).optional().default(0),
  hoursTd: z.number().min(0).optional().default(0),
  hoursTp: z.number().min(0).optional().default(0),
});

async function assertSubjectScope(req: Request, programmeId: string): Promise<void> {
  if (!req.adminScope?.facultyId) return;
  const programme = await prisma.programme.findUnique({ where: { id: programmeId } });
  if (!programme || programme.facultyId !== req.adminScope.facultyId) {
    throw new AppError('Insufficient permissions for this action', 403);
  }
}

router.post(
  '/subjects',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN, AdminRole.FACULTY_ADMIN),
  audit('subject.create', 'Subject'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = subjectSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid subject data', 400);
      const d = parsed.data;
      await assertSubjectScope(req, d.programmeId);

      const dupe = await prisma.subject.findFirst({
        where: { programmeId: d.programmeId, semesterId: d.semesterId, code: d.code },
      });
      if (dupe) throw new AppError('Ce code matière existe déjà pour ce programme/semestre', 409);

      const subject = await prisma.subject.create({ data: d });
      res.status(201).json(subject);
    } catch (err) {
      next(err);
    }
  }
);

router.patch(
  '/subjects/:id',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN, AdminRole.FACULTY_ADMIN),
  audit('subject.update', 'Subject'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = subjectSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid subject data', 400);

      const existing = await prisma.subject.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Subject not found', 404);
      await assertSubjectScope(req, existing.programmeId);

      // If the unique tuple changes, guard against a collision.
      const nextProgramme = parsed.data.programmeId ?? existing.programmeId;
      const nextSemester = parsed.data.semesterId ?? existing.semesterId;
      const nextCode = parsed.data.code ?? existing.code;
      const dupe = await prisma.subject.findFirst({
        where: {
          programmeId: nextProgramme,
          semesterId: nextSemester,
          code: nextCode,
          id: { not: existing.id },
        },
      });
      if (dupe) throw new AppError('Ce code matière existe déjà pour ce programme/semestre', 409);

      const subject = await prisma.subject.update({ where: { id: existing.id }, data: parsed.data });
      res.status(200).json(subject);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
