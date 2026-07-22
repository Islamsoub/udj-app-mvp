import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { fromBuffer } from 'file-type';
import { z } from 'zod';
import { AttendanceStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { env } from '../utils/env';
import { supabase, JUSTIFICATION_BUCKET } from '../utils/supabase';
import authMiddleware from '../middleware/auth';
import { AppError } from '../utils/AppError';
import {
  buildSessionHoursResolver,
  hoursBasedPercentage,
  AttendanceInput,
} from '../utils/attendance';

const router = Router();
router.use(authMiddleware);

// ── Multer for justification uploads ──────────────────────────────────────────

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const ALLOWED_MAGIC_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

const justificationUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError('Invalid file type. Allowed: JPEG, PNG, WebP, PDF', 400));
    }
  },
});

function justificationUploadMiddleware(req: Request, res: Response, next: NextFunction): void {
  justificationUpload.single('justification')(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new AppError('File too large. Max 5MB', 400));
        return;
      }
      next(new AppError(err.message, 400));
      return;
    }
    next(err);
  });
}

function computeMention(gpa: number): string {
  if (gpa >= 16) return 'Très Bien';
  if (gpa >= 14) return 'Bien';
  if (gpa >= 12) return 'Assez Bien';
  if (gpa >= 10) return 'Passable';
  return 'Insuffisant';
}

function computeGPA(
  grades: { noteFinale: number | null; subject: { coefficient: number } }[]
): number | null {
  const graded = grades.filter((g) => g.noteFinale !== null);
  if (graded.length === 0) return null;
  const totalCoeff = graded.reduce((s, g) => s + g.subject.coefficient, 0);
  if (totalCoeff === 0) return null;
  const weighted = graded.reduce((s, g) => s + g.noteFinale! * g.subject.coefficient, 0);
  return Math.round((weighted / totalCoeff) * 100) / 100;
}

// ── GET /student/me ───────────────────────────────────────────────────────────

router.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.studentId!;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        programme: {
          include: { faculty: true },
        },
      },
    });

    if (!student) throw new AppError('Student not found', 404);

    const currentSemester = await prisma.semester.findFirst({
      where: { isCurrent: true },
    });

    const [
      semesterGrades,
      semesterValidatedGrades,
      allValidatedGrades,
      semesterSubjects,
      attendanceRecords,
      scheduleSlots,
    ] = await Promise.all([
      // GPA reflects only NF-published finals (Pass C: GPA hidden until results).
      currentSemester
        ? prisma.grade.findMany({
            where: {
              studentId,
              semesterId: currentSemester.id,
              noteFinale: { not: null },
              publishedNfAt: { not: null },
            },
            select: { noteFinale: true, subject: { select: { coefficient: true } } },
          })
        : Promise.resolve([] as { noteFinale: number | null; subject: { coefficient: number } }[]),

      currentSemester
        ? prisma.grade.findMany({
            where: { studentId, semesterId: currentSemester.id, isValidated: true },
            select: { subject: { select: { credits: true } } },
          })
        : Promise.resolve([] as { subject: { credits: number } }[]),

      prisma.grade.findMany({
        where: { studentId, isValidated: true },
        select: { subject: { select: { credits: true } } },
      }),

      currentSemester
        ? prisma.subject.findMany({
            where: { programmeId: student.programmeId, semesterId: currentSemester.id },
            select: { credits: true },
          })
        : Promise.resolve([] as { credits: number }[]),

      // Hours-based attendance (Pass C §4.3): fetch status + hoursAttended.
      currentSemester
        ? prisma.attendanceRecord.findMany({
            where: { studentId, subject: { semesterId: currentSemester.id } },
            select: { subjectId: true, sessionDate: true, status: true, hoursAttended: true },
          })
        : Promise.resolve(
            [] as {
              subjectId: string;
              sessionDate: Date;
              status: AttendanceStatus;
              hoursAttended: number | null;
            }[]
          ),

      // Schedule slots for the programme drive the per-session hour lengths.
      currentSemester
        ? prisma.scheduleEntry.findMany({
            where: { semesterId: currentSemester.id, subject: { programmeId: student.programmeId } },
            select: { subjectId: true, dayOfWeek: true, startTime: true, endTime: true },
          })
        : Promise.resolve(
            [] as { subjectId: string; dayOfWeek: number; startTime: string; endTime: string }[]
          ),
    ]);

    const gpa = computeGPA(semesterGrades);
    const mention = gpa !== null ? computeMention(gpa) : null;

    const semesterCreditsEarned = semesterValidatedGrades.reduce(
      (s, g) => s + g.subject.credits,
      0
    );
    const semesterCreditsTotal = semesterSubjects.reduce((s, sub) => s + sub.credits, 0);
    const totalCreditsEarned = allValidatedGrades.reduce((s, g) => s + g.subject.credits, 0);

    let attendancePercentage: number | null = null;
    if (attendanceRecords.length > 0) {
      const resolveHours = buildSessionHoursResolver(scheduleSlots);
      const inputs: AttendanceInput[] = attendanceRecords.map((r) => ({
        subjectId: r.subjectId,
        sessionDate: r.sessionDate,
        status: r.status,
        hoursAttended: r.hoursAttended,
      }));
      attendancePercentage = hoursBasedPercentage(inputs, resolveHours);
    }

    res.status(200).json({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentIdDisplay: student.studentIdDisplay,
      email: student.email,
      photoUrl: student.photoUrl,
      currentSemester: student.currentSemester,
      status: student.status,
      programme: {
        id: student.programme.id,
        nameFr: student.programme.nameFr,
        nameAr: student.programme.nameAr,
        code: student.programme.code,
        level: student.programme.level,
        durationSemesters: student.programme.durationSemesters,
        totalCredits: student.programme.totalCredits,
      },
      faculty: {
        id: student.programme.faculty.id,
        nameFr: student.programme.faculty.nameFr,
        nameAr: student.programme.faculty.nameAr,
        code: student.programme.faculty.code,
        email: student.programme.faculty.email,
        phone: student.programme.faculty.phone,
        address: student.programme.faculty.address,
        hours: student.programme.faculty.hours,
      },
      stats: {
        gpa,
        mention,
        semesterCredits: { earned: semesterCreditsEarned, total: semesterCreditsTotal },
        totalCredits: { earned: totalCreditsEarned, total: student.programme.totalCredits },
        attendancePercentage,
      },
      preferences: {
        notifGrades: student.notifGrades,
        notifCourses: student.notifCourses,
        notifAttendance: student.notifAttendance,
        quietHoursStart: student.quietHoursStart,
        quietHoursEnd: student.quietHoursEnd,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /student/schedule ─────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/schedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.studentId!;
    const querySemesterId = req.query.semesterId as string | undefined;

    if (querySemesterId && !UUID_RE.test(querySemesterId)) {
      throw new AppError('Invalid semester ID', 400);
    }

    const [student, semester] = await Promise.all([
      prisma.student.findUnique({
        where: { id: studentId },
        select: { programmeId: true },
      }),
      querySemesterId
        ? prisma.semester.findUnique({ where: { id: querySemesterId } })
        : prisma.semester.findFirst({ where: { isCurrent: true } }),
    ]);

    if (!student) throw new AppError('Student not found', 404);
    if (!semester) throw new AppError('Semester not found', 404);

    const now = new Date();
    const entries = await prisma.scheduleEntry.findMany({
      where: {
        semesterId: semester.id,
        subject: { programmeId: student.programmeId },
        effectiveDate: { lte: now },
        OR: [{ expiryDate: null }, { expiryDate: { gte: now } }],
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        room: true,
        professorName: true,
        type: true,
        subject: {
          select: { id: true, nameFr: true, nameAr: true, code: true, coefficient: true },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    res.status(200).json({ semesterId: semester.id, entries });
  } catch (err) {
    next(err);
  }
});

// ── GET /student/grades ───────────────────────────────────────────────────────
// Two-phase visibility (Pass C §3.6):
//   • neither timestamp set → grade is unpublished, omitted entirely
//   • publishedCcAt only    → CC visible; CF / NF returned as null
//   • publishedNfAt set      → all scores visible
// GPA / mention reflect only NF-published grades.

router.get('/grades', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.studentId!;
    const querySemesterId = req.query.semesterId as string | undefined;
    const allSemesters = req.query.allSemesters === 'true';

    if (querySemesterId && !UUID_RE.test(querySemesterId)) {
      throw new AppError('Invalid semester ID', 400);
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { programmeId: true },
    });
    if (!student) throw new AppError('Student not found', 404);

    if (allSemesters) {
      const allGrades = await prisma.grade.findMany({
        where: { studentId },
        select: {
          noteFinale: true,
          isValidated: true,
          semesterId: true,
          publishedNfAt: true,
          semester: { select: { id: true, label: true, academicYear: true } },
          subject: { select: { coefficient: true, credits: true } },
        },
      });

      const semesterIds = [...new Set(allGrades.map((g) => g.semesterId))];

      const semesterSubjects = await prisma.subject.findMany({
        where: { programmeId: student.programmeId, semesterId: { in: semesterIds } },
        select: { semesterId: true, credits: true },
      });

      const totalCreditsBySem = new Map<string, number>();
      for (const s of semesterSubjects) {
        totalCreditsBySem.set(s.semesterId, (totalCreditsBySem.get(s.semesterId) ?? 0) + s.credits);
      }

      const gradesBySem = new Map<string, typeof allGrades>();
      for (const g of allGrades) {
        if (!gradesBySem.has(g.semesterId)) gradesBySem.set(g.semesterId, []);
        gradesBySem.get(g.semesterId)!.push(g);
      }

      const semesters = semesterIds.map((semId) => {
        const semGrades = gradesBySem.get(semId) ?? [];
        const semInfo = semGrades[0]?.semester ?? { id: semId, label: '', academicYear: '' };
        // Only NF-published grades count toward the historical GPA / credits.
        const nfGrades = semGrades.filter((g) => g.publishedNfAt !== null);
        const gpa = computeGPA(nfGrades);
        const mention = gpa !== null ? computeMention(gpa) : null;
        const earned = nfGrades
          .filter((g) => g.isValidated)
          .reduce((s, g) => s + g.subject.credits, 0);
        const total = totalCreditsBySem.get(semId) ?? 0;
        return {
          id: semInfo.id,
          label: semInfo.label,
          academicYear: semInfo.academicYear,
          gpa,
          mention,
          credits: { earned, total },
        };
      });

      res.status(200).json({ semesters });
      return;
    }

    const semester = querySemesterId
      ? await prisma.semester.findUnique({
          where: { id: querySemesterId },
          select: { id: true, label: true, academicYear: true },
        })
      : await prisma.semester.findFirst({
          where: { isCurrent: true },
          select: { id: true, label: true, academicYear: true },
        });

    if (!semester) throw new AppError('Semester not found', 404);

    const [grades, semesterSubjects] = await Promise.all([
      prisma.grade.findMany({
        where: { studentId, semesterId: semester.id },
        select: {
          id: true,
          noteCc: true,
          noteCf: true,
          noteFinale: true,
          isValidated: true,
          publishedCcAt: true,
          publishedNfAt: true,
          subject: {
            select: {
              id: true,
              nameFr: true,
              nameAr: true,
              code: true,
              coefficient: true,
              credits: true,
            },
          },
        },
      }),
      prisma.subject.findMany({
        where: { programmeId: student.programmeId, semesterId: semester.id },
        select: { credits: true },
      }),
    ]);

    // Drop unpublished grades; mask CF/NF until final results are published.
    const visible = grades.filter((g) => g.publishedCcAt !== null || g.publishedNfAt !== null);
    const shapedGrades = visible.map((g) => {
      const nfPublished = g.publishedNfAt !== null;
      return {
        id: g.id,
        noteCc: g.noteCc,
        noteCf: nfPublished ? g.noteCf : null,
        noteFinale: nfPublished ? g.noteFinale : null,
        isValidated: nfPublished ? g.isValidated : false,
        subject: g.subject,
      };
    });

    const nfGrades = visible.filter((g) => g.publishedNfAt !== null);
    const gpa = computeGPA(nfGrades);
    const mention = gpa !== null ? computeMention(gpa) : null;
    const earned = nfGrades
      .filter((g) => g.isValidated)
      .reduce((s, g) => s + g.subject.credits, 0);
    const total = semesterSubjects.reduce((s, sub) => s + sub.credits, 0);

    res.status(200).json({
      semester,
      gpa,
      mention,
      credits: { earned, total },
      ccPublished: visible.some((g) => g.publishedCcAt !== null),
      nfPublished: visible.some((g) => g.publishedNfAt !== null),
      grades: shapedGrades,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /student/attendance ───────────────────────────────────────────────────
// Hours-based percentages (Pass C §4.3), with PARTIAL sessions surfaced.

router.get('/attendance', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.studentId!;

    const currentSemester = await prisma.semester.findFirst({ where: { isCurrent: true } });
    if (!currentSemester) {
      res.status(200).json({ overall: null, subjects: [] });
      return;
    }

    const records = await prisma.attendanceRecord.findMany({
      where: { studentId, subject: { semesterId: currentSemester.id } },
      select: {
        id: true,
        status: true,
        hoursAttended: true,
        subjectId: true,
        sessionDate: true,
        justificationUrl: true,
        justificationStatus: true,
        justificationNote: true,
        subject: { select: { id: true, nameFr: true, nameAr: true, code: true } },
      },
      orderBy: { sessionDate: 'desc' },
    });

    // Session lengths come from the subjects' schedule entries.
    const subjectIds = [...new Set(records.map((r) => r.subjectId))];
    const slots = subjectIds.length
      ? await prisma.scheduleEntry.findMany({
          where: { subjectId: { in: subjectIds }, semesterId: currentSemester.id },
          select: { subjectId: true, dayOfWeek: true, startTime: true, endTime: true },
        })
      : [];
    const resolveHours = buildSessionHoursResolver(slots);

    const pathsToSign = [
      ...new Set(
        records
          .filter((r) => r.justificationUrl && (r.status === 'ABSENT' || r.status === 'JUSTIFIED'))
          .map((r) => r.justificationUrl!)
      ),
    ];
    const signedUrlMap = new Map<string, string>();
    if (pathsToSign.length > 0) {
      await Promise.all(
        pathsToSign.map(async (path) => {
          const { data } = await supabase.storage
            .from(JUSTIFICATION_BUCKET)
            .createSignedUrl(path, 3600);
          if (data?.signedUrl) signedUrlMap.set(path, data.signedUrl);
        })
      );
    }

    type SubjectInfo = { id: string; nameFr: string; nameAr: string; code: string };
    type AbsenceEntry = {
      id: string;
      date: string;
      status: 'ABSENT' | 'JUSTIFIED';
      subjectName: string;
      subjectNameAr: string;
      justificationUrl: string | null;
      justificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
      justificationNote: string | null;
    };
    const subjectMap = new Map<
      string,
      {
        subject: SubjectInfo;
        present: number;
        absent: number;
        justified: number;
        partial: number;
        inputs: AttendanceInput[];
        absences: AbsenceEntry[];
      }
    >();

    for (const r of records) {
      if (!subjectMap.has(r.subjectId)) {
        subjectMap.set(r.subjectId, {
          subject: r.subject,
          present: 0,
          absent: 0,
          justified: 0,
          partial: 0,
          inputs: [],
          absences: [],
        });
      }
      const entry = subjectMap.get(r.subjectId)!;
      if (r.status === 'PRESENT') entry.present++;
      else if (r.status === 'ABSENT') entry.absent++;
      else if (r.status === 'JUSTIFIED') entry.justified++;
      else if (r.status === 'PARTIAL') entry.partial++;

      entry.inputs.push({
        subjectId: r.subjectId,
        sessionDate: r.sessionDate,
        status: r.status,
        hoursAttended: r.hoursAttended,
      });

      if (r.status === 'ABSENT' || r.status === 'JUSTIFIED') {
        entry.absences.push({
          id: r.id,
          date: r.sessionDate.toISOString(),
          status: r.status,
          subjectName: r.subject.nameFr,
          subjectNameAr: r.subject.nameAr,
          justificationUrl: r.justificationUrl
            ? (signedUrlMap.get(r.justificationUrl) ?? null)
            : null,
          justificationStatus: r.justificationStatus,
          justificationNote: r.justificationNote,
        });
      }
    }

    const subjects = [...subjectMap.values()].map(
      ({ subject, present, absent, justified, partial, inputs, absences }) => {
        const total = present + absent + justified + partial;
        const percentage = hoursBasedPercentage(inputs, resolveHours) ?? 0;
        return { subject, total, present, absent, justified, partial, percentage, absences };
      }
    );

    const totalAll = records.length;
    const presentAll = records.filter((r) => r.status === 'PRESENT').length;
    const absentAll = records.filter((r) => r.status === 'ABSENT').length;
    const justifiedAll = records.filter((r) => r.status === 'JUSTIFIED').length;
    const partialAll = records.filter((r) => r.status === 'PARTIAL').length;
    const overallInputs: AttendanceInput[] = records.map((r) => ({
      subjectId: r.subjectId,
      sessionDate: r.sessionDate,
      status: r.status,
      hoursAttended: r.hoursAttended,
    }));
    const percentageAll = hoursBasedPercentage(overallInputs, resolveHours);

    res.status(200).json({
      overall: {
        total: totalAll,
        present: presentAll,
        absent: absentAll,
        justified: justifiedAll,
        partial: partialAll,
        percentage: percentageAll,
      },
      subjects,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /student/notifications ────────────────────────────────────────────────

router.get('/notifications', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.studentId!;
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '20', 10), 1), 100);
    const offset = Math.max(parseInt((req.query.offset as string) || '0', 10), 0);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          type: true,
          titleFr: true,
          titleAr: true,
          bodyFr: true,
          bodyAr: true,
          isRead: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where: { studentId, isRead: false } }),
    ]);

    res.status(200).json({ unreadCount, notifications });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /student/notifications/read-all ────────────────────────────────────

router.patch(
  '/notifications/read-all',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.studentId!;
      const result = await prisma.notification.updateMany({
        where: { studentId, isRead: false },
        data: { isRead: true },
      });
      res.status(200).json({ updated: result.count });
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /student/notifications/:id/read ────────────────────────────────────

router.patch(
  '/notifications/:id/read',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.studentId!;
      const notificationId = req.params.id as string;

      if (!UUID_RE.test(notificationId)) {
        res.status(400).json({ error: 'Invalid notification ID' });
        return;
      }

      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, studentId },
        select: { id: true },
      });

      if (!notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /student/preferences ────────────────────────────────────────────────

const HH_MM = /^\d{2}:\d{2}$/;

const prefsSchema = z.object({
  notifGrades: z.boolean().optional(),
  notifCourses: z.boolean().optional(),
  notifAttendance: z.boolean().optional(),
  quietHoursStart: z.string().regex(HH_MM).nullable().optional(),
  quietHoursEnd: z.string().regex(HH_MM).nullable().optional(),
});

router.patch('/preferences', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.studentId!;
    const parsed = prefsSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid preferences' });
      return;
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: parsed.data,
      select: {
        notifGrades: true,
        notifCourses: true,
        notifAttendance: true,
        quietHoursStart: true,
        quietHoursEnd: true,
      },
    });

    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
});

// ── POST /student/push-token ──────────────────────────────────────────────────

const pushTokenSchema = z.object({
  token: z.string().min(1).max(256),
  platform: z.string().min(1).max(32).optional(),
});

router.post('/push-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.studentId!;
    const parsed = pushTokenSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid token' });
      return;
    }

    const platform = parsed.data.platform ?? 'android';

    // Upsert — same student can re-register (app reinstall, token refresh)
    await prisma.pushToken.upsert({
      where: { token: parsed.data.token },
      update: {
        studentId,
        platform,
        updatedAt: new Date(),
      },
      create: {
        studentId,
        token: parsed.data.token,
        platform,
      },
    });

    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── GET /student/qr-token ─────────────────────────────────────────────────────

router.get('/qr-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const studentId = req.studentId!;

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { firstName: true, lastName: true, studentIdDisplay: true },
    });
    if (!student) throw new AppError('Student not found', 404);

    await prisma.qrToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60_000);

    const token = jwt.sign(
      {
        studentId,
        studentIdDisplay: student.studentIdDisplay,
        firstName: student.firstName,
        lastName: student.lastName,
        issuedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      env.QR_SECRET,
      { expiresIn: '60s' }
    );

    await prisma.qrToken.create({
      data: { studentId, jwtToken: token, issuedAt: now, expiresAt },
    });

    res.status(200).json({ token, expiresAt: expiresAt.toISOString() });
  } catch (err) {
    next(err);
  }
});

// ── POST /student/attendance/:recordId/justification ──────────────────────────

router.post(
  '/attendance/:recordId/justification',
  justificationUploadMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.studentId!;
      const recordId = String(req.params.recordId ?? '');

      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recordId)) {
        throw new AppError('Invalid record ID', 400);
      }
      if (!req.file) {
        throw new AppError('Missing file field "justification"', 400);
      }

      // Optional free-text reason supplied alongside the file (multipart text field).
      const rawNote: unknown = req.body?.note;
      let note: string | null = null;
      if (rawNote !== undefined && rawNote !== null && rawNote !== '') {
        if (typeof rawNote !== 'string') {
          throw new AppError('Invalid note', 400);
        }
        const trimmed = rawNote.trim();
        if (trimmed.length > 80) {
          throw new AppError('Note must be 80 characters or fewer', 400);
        }
        note = trimmed.length > 0 ? trimmed : null;
      }

      const fileTypeResult = await fromBuffer(req.file.buffer);
      if (!fileTypeResult || !ALLOWED_MAGIC_TYPES.includes(fileTypeResult.mime)) {
        throw new AppError('Invalid file type. Allowed: JPEG, PNG, WebP, PDF', 400);
      }
      const contentType = fileTypeResult.mime;

      const record = await prisma.attendanceRecord.findUnique({
        where: { id: recordId },
        select: { id: true, studentId: true, status: true, sessionDate: true },
      });

      if (!record || record.studentId !== studentId) {
        throw new AppError('Attendance record not found', 404);
      }

      if (record.status !== 'ABSENT') {
        throw new AppError('Justification can only be uploaded for ABSENT records', 409);
      }

      // Enforce the configurable justification deadline (Pass C §4.4): students
      // cannot submit after N days from the absence date.
      const settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
      const deadlineDays = settings?.justificationDeadlineDays ?? 8;
      const deadline = new Date(record.sessionDate.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
      if (new Date() > deadline) {
        throw new AppError(`Délai de soumission dépassé (${deadlineDays} jours)`, 409);
      }

      const ext = EXT_BY_MIME[contentType];
      const objectPath = `${studentId}/${recordId}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(JUSTIFICATION_BUCKET)
        .upload(objectPath, req.file.buffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        throw new AppError(`Storage upload failed: ${uploadError.message}`, 500);
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from(JUSTIFICATION_BUCKET)
        .createSignedUrl(objectPath, 3600);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        throw new AppError('Failed to generate file URL', 500);
      }

      const updated = await prisma.attendanceRecord.update({
        where: { id: recordId },
        data: {
          justificationUrl: objectPath,
          justificationStatus: 'PENDING',
          justificationNote: note ?? null,
        },
        select: { justificationStatus: true, justificationNote: true },
      });

      res.status(200).json({
        success: true,
        justificationUrl: signedUrlData.signedUrl,
        justificationStatus: updated.justificationStatus,
        justificationNote: updated.justificationNote,
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
