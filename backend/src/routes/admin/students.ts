import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import {
  Prisma,
  StudentStatus,
  AdminRole,
} from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import adminAuth from '../../middleware/adminAuth';
import { rbac, facultyScopeWhere } from '../../middleware/rbac';
import { audit } from '../../middleware/auditLog';
import {
  generatePassword,
  parsePagination,
  MATRICULE_REGEX,
  EMAIL_REGEX,
} from '../../utils/adminHelpers';
import {
  buildSessionHoursResolver,
  hoursBasedPercentage,
  AttendanceInput,
  SessionHoursResolver,
} from '../../utils/attendance';
import { BCRYPT_COST } from '../../config/adminEnv';

const router = Router();

// Student PII is off-limits to NEWS_EDITOR; only these roles may read it.
const READ_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.REGISTRAR,
  AdminRole.FACULTY_ADMIN,
];
const WRITE_ROLES: AdminRole[] = [AdminRole.SUPER_ADMIN, AdminRole.REGISTRAR];

// ─── Computed helpers (gpa weighted by coefficient, presence %) ──────────────

type GradeForGpa = { noteFinale: number | null; subject: { coefficient: number } };
function computeGpa(grades: GradeForGpa[]): number | null {
  let num = 0;
  let den = 0;
  for (const g of grades) {
    if (g.noteFinale == null) continue;
    num += g.noteFinale * g.subject.coefficient;
    den += g.subject.coefficient;
  }
  if (den === 0) return null;
  return Math.round((num / den) * 100) / 100;
}

// Hours-based presence (architecture doc §4.3), shared with GET /student/attendance
// and GET /admin/attendance/overview so all three surfaces report the same figure.
function computePresence(
  records: AttendanceInput[],
  resolveHours: SessionHoursResolver
): number | null {
  return hoursBasedPercentage(records, resolveHours);
}

// Builds a session-hours resolver covering every subject referenced by the given
// students' attendance records — loaded once so the list maps in memory.
async function buildPresenceResolver(
  students: { attendanceRecords: { subjectId: string }[] }[]
): Promise<SessionHoursResolver> {
  const subjectIds = [
    ...new Set(students.flatMap((s) => s.attendanceRecords.map((r) => r.subjectId))),
  ];
  const slots = subjectIds.length
    ? await prisma.scheduleEntry.findMany({
        where: { subjectId: { in: subjectIds } },
        select: { subjectId: true, dayOfWeek: true, startTime: true, endTime: true },
      })
    : [];
  return buildSessionHoursResolver(slots);
}

// ─── GET /admin/students ─────────────────────────────────────────────────────
// Paginated list; search (name/matricule), filters (faculty, programme,
// semester, status, gpaMin). FACULTY_ADMIN is scoped to their faculty.
router.get(
  '/',
  adminAuth,
  rbac(...READ_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, faculty, programme, semester, status, gpaMin } = req.query as Record<
        string,
        string | undefined
      >;

      const where: Prisma.StudentWhereInput = {
        ...(facultyScopeWhere(req, ['programme']) as Prisma.StudentWhereInput),
      };

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { studentIdDisplay: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (programme) where.programmeId = programme;
      if (faculty) where.programme = { facultyId: faculty };
      if (semester) where.currentSemester = parseInt(semester, 10);
      if (status && status in StudentStatus) where.status = status as StudentStatus;

      const { page, pageSize } = parsePagination(req.query as Record<string, unknown>);
      const gpaMinNum = gpaMin != null && gpaMin !== '' ? parseFloat(gpaMin) : null;

      const include = {
        programme: { include: { faculty: { select: { id: true, nameFr: true, code: true } } } },
        grades: { select: { noteFinale: true, subject: { select: { coefficient: true } } } },
        attendanceRecords: {
          select: { subjectId: true, sessionDate: true, status: true, hoursAttended: true },
        },
      } satisfies Prisma.StudentInclude;

      const shapeRow = (
        s: Prisma.StudentGetPayload<{ include: typeof include }>,
        resolveHours: SessionHoursResolver
      ) => ({
        id: s.id,
        matricule: s.studentIdDisplay,
        firstName: s.firstName,
        lastName: s.lastName,
        name: `${s.firstName} ${s.lastName}`,
        email: s.email,
        photoUrl: s.photoUrl,
        currentSemester: s.currentSemester,
        status: s.status,
        programme: {
          id: s.programme.id,
          nameFr: s.programme.nameFr,
          code: s.programme.code,
          faculty: s.programme.faculty,
        },
        gpa: computeGpa(s.grades),
        presence: computePresence(s.attendanceRecords, resolveHours),
      });

      if (gpaMinNum != null) {
        // GPA is computed, so filter/paginate in memory (dataset is small —
        // ~hundreds of students). Documented tradeoff vs. a SQL view.
        const all = await prisma.student.findMany({ where, include, orderBy: { lastName: 'asc' } });
        const resolveHours = await buildPresenceResolver(all);
        const rows = all
          .map((s) => shapeRow(s, resolveHours))
          .filter((r) => r.gpa != null && r.gpa >= gpaMinNum);
        const total = rows.length;
        const start = (page - 1) * pageSize;
        res.status(200).json({
          data: rows.slice(start, start + pageSize),
          pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
        });
        return;
      }

      const [total, students] = await Promise.all([
        prisma.student.count({ where }),
        prisma.student.findMany({
          where,
          include,
          orderBy: { lastName: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);

      const resolveHours = await buildPresenceResolver(students);
      res.status(200).json({
        data: students.map((s) => shapeRow(s, resolveHours)),
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /admin/students/:id ─────────────────────────────────────────────────
// Full detail: profile + grades + attendance + schedule.
router.get(
  '/:id',
  adminAuth,
  rbac(...READ_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await prisma.student.findUnique({
        where: { id: String(req.params.id) },
        include: {
          programme: { include: { faculty: true } },
          grades: {
            include: { subject: { select: { id: true, code: true, nameFr: true, coefficient: true } }, semester: { select: { id: true, label: true } } },
            orderBy: { createdAt: 'desc' },
          },
          attendanceRecords: {
            include: { subject: { select: { id: true, code: true, nameFr: true } } },
            orderBy: { sessionDate: 'desc' },
          },
        },
      });

      if (!student) throw new AppError('Student not found', 404);

      // Enforce faculty scope for FACULTY_ADMIN.
      const scopeFaculty = req.adminScope?.facultyId;
      if (scopeFaculty && student.programme.facultyId !== scopeFaculty) {
        throw new AppError('Insufficient permissions for this action', 403);
      }

      // Student's schedule = schedule entries for their programme's subjects.
      const schedule = await prisma.scheduleEntry.findMany({
        where: { subject: { programmeId: student.programmeId } },
        include: { subject: { select: { id: true, code: true, nameFr: true } }, semester: { select: { id: true, label: true } } },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      });

      const resolveHours = buildSessionHoursResolver(
        schedule.map((e) => ({
          subjectId: e.subjectId,
          dayOfWeek: e.dayOfWeek,
          startTime: e.startTime,
          endTime: e.endTime,
        }))
      );

      res.status(200).json({
        id: student.id,
        matricule: student.studentIdDisplay,
        firstName: student.firstName,
        lastName: student.lastName,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        photoUrl: student.photoUrl,
        currentSemester: student.currentSemester,
        status: student.status,
        programme: student.programme,
        faculty: student.programme.faculty,
        gpa: computeGpa(student.grades),
        presence: computePresence(student.attendanceRecords, resolveHours),
        grades: student.grades,
        attendance: student.attendanceRecords,
        schedule,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /admin/students ────────────────────────────────────────────────────
const createSchema = z.object({
  firstName: z.string().min(2).max(50).trim(),
  lastName: z.string().min(2).max(50).trim(),
  matricule: z.string().regex(MATRICULE_REGEX, 'Format matricule: UDJ-YYYY-NNNN'),
  email: z.string().regex(EMAIL_REGEX, 'Email invalide').max(120),
  programmeId: z.string().uuid(),
  currentSemester: z.number().int().min(1).max(10),
  status: z.nativeEnum(StudentStatus).optional(),
  password: z.string().min(8).max(100),
});

router.post(
  '/',
  adminAuth,
  rbac(...WRITE_ROLES),
  audit('student.create', 'Student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid student data', 400);
      }
      const d = parsed.data;

      // FACULTY_ADMIN may only create within their faculty.
      const programme = await prisma.programme.findUnique({ where: { id: d.programmeId } });
      if (!programme) throw new AppError('Programme not found', 404);
      if (req.adminScope?.facultyId && programme.facultyId !== req.adminScope.facultyId) {
        throw new AppError('Insufficient permissions for this action', 403);
      }

      const dupe = await prisma.student.findFirst({
        where: { OR: [{ studentIdDisplay: d.matricule }, { email: d.email }] },
      });
      if (dupe) {
        const field = dupe.studentIdDisplay === d.matricule ? 'matricule' : 'email';
        throw new AppError(
          field === 'matricule' ? 'Ce matricule est déjà utilisé' : 'Cet email est déjà utilisé',
          409
        );
      }

      const passwordHash = await bcrypt.hash(d.password, BCRYPT_COST);
      const student = await prisma.student.create({
        data: {
          firstName: d.firstName,
          lastName: d.lastName,
          studentIdDisplay: d.matricule,
          email: d.email,
          programmeId: d.programmeId,
          currentSemester: d.currentSemester,
          status: d.status ?? StudentStatus.ACTIVE,
          passwordHash,
        },
      });

      res.status(201).json({
        id: student.id,
        matricule: student.studentIdDisplay,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        currentSemester: student.currentSemester,
        status: student.status,
        programmeId: student.programmeId,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /admin/students/:id (matricule read-only) ─────────────────────────
const updateSchema = z.object({
  firstName: z.string().min(2).max(50).trim().optional(),
  lastName: z.string().min(2).max(50).trim().optional(),
  email: z.string().regex(EMAIL_REGEX).max(120).optional(),
  programmeId: z.string().uuid().optional(),
  currentSemester: z.number().int().min(1).max(10).optional(),
  status: z.nativeEnum(StudentStatus).optional(),
});

router.patch(
  '/:id',
  adminAuth,
  rbac(...WRITE_ROLES),
  audit('student.update', 'Student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid student data', 400);

      const existing = await prisma.student.findUnique({
        where: { id: String(req.params.id) },
        include: { programme: true },
      });
      if (!existing) throw new AppError('Student not found', 404);
      if (
        req.adminScope?.facultyId &&
        existing.programme.facultyId !== req.adminScope.facultyId
      ) {
        throw new AppError('Insufficient permissions for this action', 403);
      }

      if (parsed.data.email && parsed.data.email !== existing.email) {
        const dupe = await prisma.student.findFirst({
          where: { email: parsed.data.email, id: { not: existing.id } },
        });
        if (dupe) throw new AppError('Cet email est déjà utilisé', 409);
      }

      const student = await prisma.student.update({
        where: { id: existing.id },
        data: parsed.data, // matricule (studentIdDisplay) intentionally not updatable
      });

      res.status(200).json({
        id: student.id,
        matricule: student.studentIdDisplay,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        currentSemester: student.currentSemester,
        status: student.status,
        programmeId: student.programmeId,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /admin/students/:id/reset-password ─────────────────────────────────
router.post(
  '/:id/reset-password',
  adminAuth,
  rbac(...WRITE_ROLES),
  audit('student.resetPassword', 'Student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const student = await prisma.student.findUnique({
        where: { id: String(req.params.id) },
        include: { programme: true },
      });
      if (!student) throw new AppError('Student not found', 404);
      if (req.adminScope?.facultyId && student.programme.facultyId !== req.adminScope.facultyId) {
        throw new AppError('Insufficient permissions for this action', 403);
      }

      const newPassword = generatePassword(12);
      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
      await prisma.student.update({
        where: { id: student.id },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      });

      // Returned once so the admin can hand it to the student (UI specs §4.1).
      res.status(200).json({
        id: student.id,
        matricule: student.studentIdDisplay,
        newPassword,
        message: 'Mot de passe réinitialisé',
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /admin/students/:id/status ────────────────────────────────────────
const statusSchema = z.object({
  status: z.nativeEnum(StudentStatus),
  reason: z.string().max(500).optional(),
});

router.patch(
  '/:id/status',
  adminAuth,
  rbac(...WRITE_ROLES),
  audit('student.status', 'Student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = statusSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid status', 400);

      const student = await prisma.student.findUnique({
        where: { id: String(req.params.id) },
        include: { programme: true },
      });
      if (!student) throw new AppError('Student not found', 404);
      if (req.adminScope?.facultyId && student.programme.facultyId !== req.adminScope.facultyId) {
        throw new AppError('Insufficient permissions for this action', 403);
      }

      const updated = await prisma.student.update({
        where: { id: student.id },
        data: { status: parsed.data.status },
      });

      res.status(200).json({
        id: updated.id,
        status: updated.status,
        reason: parsed.data.reason ?? null,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /admin/students/import (CSV bulk create) ───────────────────────────
// Body: { rows: [{ matricule, prenom, nom, email, programme_code, semestre, mot_de_passe }] }
// The frontend parses the CSV/XLSX client-side and posts the rows.
const importRowSchema = z.object({
  matricule: z.string(),
  prenom: z.string(),
  nom: z.string(),
  email: z.string(),
  programme_code: z.string(),
  semestre: z.union([z.string(), z.number()]),
  mot_de_passe: z.string().optional(),
});
const importSchema = z.object({
  rows: z.array(importRowSchema).min(1).max(2000),
  skipInvalid: z.boolean().optional().default(true),
});

router.post(
  '/import',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('student.bulkCreate', 'Student'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = importSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid import payload', 400);
      const { rows, skipInvalid } = parsed.data;

      // Pre-load programmes by code + existing matricules/emails for validation.
      const programmes = await prisma.programme.findMany({ select: { id: true, code: true } });
      const progByCode = new Map(programmes.map((p) => [p.code.toUpperCase(), p.id]));
      const existing = await prisma.student.findMany({
        select: { studentIdDisplay: true, email: true },
      });
      const usedMatricules = new Set(existing.map((s) => s.studentIdDisplay.toUpperCase()));
      const usedEmails = new Set(existing.map((s) => s.email.toLowerCase()));

      const report: {
        row: number;
        matricule: string;
        status: 'created' | 'error';
        error?: string;
      }[] = [];

      let created = 0;
      for (let i = 0; i < rows.length; i += 1) {
        const r = rows[i];
        const line = i + 1;
        const errors: string[] = [];

        if (!MATRICULE_REGEX.test(r.matricule)) errors.push('matricule invalide');
        else if (usedMatricules.has(r.matricule.toUpperCase())) errors.push('matricule déjà utilisé');
        if (!EMAIL_REGEX.test(r.email)) errors.push('email invalide');
        else if (usedEmails.has(r.email.toLowerCase())) errors.push('email déjà utilisé');
        if (!r.prenom?.trim() || !r.nom?.trim()) errors.push('prénom/nom requis');
        const programmeId = progByCode.get(String(r.programme_code).toUpperCase());
        if (!programmeId) errors.push('code programme inconnu');
        const semestre = parseInt(String(r.semestre), 10);
        if (Number.isNaN(semestre) || semestre < 1 || semestre > 10) errors.push('semestre invalide');

        if (errors.length > 0) {
          report.push({ row: line, matricule: r.matricule, status: 'error', error: errors.join(', ') });
          if (!skipInvalid) {
            throw new AppError(`Ligne ${line}: ${errors.join(', ')}`, 400);
          }
          continue;
        }

        const password = r.mot_de_passe && r.mot_de_passe.length >= 8 ? r.mot_de_passe : generatePassword(12);
        const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
        await prisma.student.create({
          data: {
            firstName: r.prenom.trim(),
            lastName: r.nom.trim(),
            studentIdDisplay: r.matricule,
            email: r.email,
            programmeId: programmeId!,
            currentSemester: semestre,
            status: StudentStatus.ACTIVE,
            passwordHash,
          },
        });
        usedMatricules.add(r.matricule.toUpperCase());
        usedEmails.add(r.email.toLowerCase());
        created += 1;
        report.push({ row: line, matricule: r.matricule, status: 'created' });
      }

      res.status(201).json({
        total: rows.length,
        created,
        skipped: rows.length - created,
        report,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
