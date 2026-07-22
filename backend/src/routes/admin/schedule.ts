import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma, ScheduleEntryType, NotificationType, AdminRole } from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import adminAuth from '../../middleware/adminAuth';
import { rbac, facultyScopeWhere } from '../../middleware/rbac';
import { audit } from '../../middleware/auditLog';
import { createNotification } from '../../utils/notify';

const router = Router();

const ALL_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.FACULTY_ADMIN,
  AdminRole.REGISTRAR,
  AdminRole.NEWS_EDITOR,
];
const WRITE_ROLES: AdminRole[] = [AdminRole.SUPER_ADMIN, AdminRole.FACULTY_ADMIN];

// "HH:MM" 24h validator.
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Overlapping schedule entry with the context needed to describe a room clash.
type ConflictEntry = Prisma.ScheduleEntryGetPayload<{
  include: {
    subject: {
      select: {
        code: true;
        nameFr: true;
        programme: { select: { code: true; nameFr: true } };
      };
    };
    semester: { select: { id: true; label: true } };
  };
}>;

/**
 * Returns every schedule entry that clashes with the given room + weekday +
 * time window (open-interval overlap). Exposed to the frontend via
 * GET /admin/schedule/conflicts and reused by the create/update soft warning.
 * Deliberately NOT semester-scoped (a room is a physical resource) — callers
 * that want same-semester precision filter the result by `semester.id`.
 */
async function checkRoomConflict(
  room: string,
  dayOfWeek: number,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<ConflictEntry[]> {
  const sameRoom = await prisma.scheduleEntry.findMany({
    where: {
      room,
      dayOfWeek,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: {
      subject: {
        select: {
          code: true,
          nameFr: true,
          programme: { select: { code: true, nameFr: true } },
        },
      },
      semester: { select: { id: true, label: true } },
    },
  });
  return sameRoom.filter((e) => startTime < e.endTime && endTime > e.startTime);
}

async function assertScheduleScope(req: Request, subjectId: string): Promise<void> {
  if (!req.adminScope?.facultyId) return;
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: { programme: true },
  });
  if (!subject || subject.programme.facultyId !== req.adminScope.facultyId) {
    throw new AppError('Insufficient permissions for this action', 403);
  }
}

// Notifies every student in the subject's programme that the timetable changed
// (architecture doc §5.4). Returns the number of notifications created.
async function notifyProgrammeScheduleChange(subjectId: string): Promise<number> {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { programmeId: true },
  });
  if (!subject) return 0;
  const students = await prisma.student.findMany({
    where: { programmeId: subject.programmeId },
    select: { id: true },
  });
  return createNotification(
    students.map((s) => s.id),
    NotificationType.SCHEDULE,
    'Votre emploi du temps a été mis à jour',
    'Vérifiez les changements dans votre emploi du temps.',
    'تم تحديث جدولك الزمني',
    'تحقق من التغييرات في جدولك.'
  );
}

// ─── GET /admin/schedule/conflicts ───────────────────────────────────────────
// Real-time room-clash check used by the ScheduleForm as the admin edits.
router.get('/conflicts', adminAuth, rbac(...ALL_ROLES), async (req, res, next) => {
  try {
    const { room, dayOfWeek, startTime, endTime, excludeId } = req.query as Record<
      string,
      string | undefined
    >;
    if (!room || dayOfWeek == null || dayOfWeek === '' || !startTime || !endTime) {
      throw new AppError('room, dayOfWeek, startTime et endTime requis', 400);
    }
    if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
      throw new AppError('Heure invalide (HH:MM)', 400);
    }
    const day = parseInt(dayOfWeek, 10);
    if (Number.isNaN(day) || day < 0 || day > 6) throw new AppError('dayOfWeek invalide', 400);

    const conflicts = await checkRoomConflict(room, day, startTime, endTime, excludeId || undefined);

    res.status(200).json({
      count: conflicts.length,
      conflicts: conflicts.map((e) => ({
        id: e.id,
        room: e.room,
        dayOfWeek: e.dayOfWeek,
        startTime: e.startTime,
        endTime: e.endTime,
        semesterId: e.semester.id,
        semesterLabel: e.semester.label,
        subjectCode: e.subject.code,
        subjectName: e.subject.nameFr,
        programmeCode: e.subject.programme.code,
        programmeName: e.subject.programme.nameFr,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /admin/schedule ─────────────────────────────────────────────────────
// Modes (architecture doc §5.1):
//   • default   → filter by programme (+ optional day/semester)
//   • ?room=     → all entries for that room across programmes (ignores programme)
//   • ?professorName= → all entries for that professor across programmes
// Faculty scope always applies (a FACULTY_ADMIN never sees other faculties).
router.get('/', adminAuth, rbac(...ALL_ROLES), async (req, res, next) => {
  try {
    const { programme, day, semester, room, professorName } = req.query as Record<
      string,
      string | undefined
    >;

    const subjectWhere: Prisma.SubjectWhereInput = {
      ...(facultyScopeWhere(req, ['programme']) as Prisma.SubjectWhereInput),
    };
    // The programme filter is ignored in par-salle / par-enseignant modes.
    if (!room && !professorName && programme) {
      subjectWhere.programmeId = programme;
    }

    const where: Prisma.ScheduleEntryWhereInput = { subject: subjectWhere };
    if (room) where.room = room;
    if (professorName) where.professorName = professorName;
    if (day != null && day !== '') where.dayOfWeek = parseInt(day, 10);
    if (semester) where.semesterId = semester;

    const entries = await prisma.scheduleEntry.findMany({
      where,
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      include: {
        subject: {
          select: {
            id: true,
            code: true,
            nameFr: true,
            programme: { select: { id: true, code: true, nameFr: true, facultyId: true } },
          },
        },
        semester: { select: { id: true, label: true } },
      },
    });
    res.status(200).json(entries);
  } catch (err) {
    next(err);
  }
});

const scheduleSchema = z.object({
  subjectId: z.string().uuid(),
  semesterId: z.string().uuid(),
  professorName: z.string().min(1),
  room: z.string().min(1),
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(TIME_REGEX, 'Heure invalide (HH:MM)'),
  endTime: z.string().regex(TIME_REGEX, 'Heure invalide (HH:MM)'),
  type: z.nativeEnum(ScheduleEntryType),
  effectiveDate: z.string().optional(),
});

// Builds the soft-warning string for a same-semester room clash (or null).
function roomWarning(conflicts: ConflictEntry[], semesterId: string, room: string): string | null {
  const clash = conflicts.find((e) => e.semester.id === semesterId);
  if (!clash) return null;
  return `Salle ${room} est déjà réservée par ${clash.subject.code} (${clash.subject.programme.nameFr}) à ce créneau`;
}

// ─── POST /admin/schedule ────────────────────────────────────────────────────
router.post(
  '/',
  adminAuth,
  rbac(...WRITE_ROLES),
  audit('schedule.create', 'ScheduleEntry'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = scheduleSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new AppError(parsed.error.issues[0]?.message ?? 'Invalid schedule data', 400);
      }
      const d = parsed.data;

      if (d.endTime <= d.startTime) {
        throw new AppError("L'heure de fin doit être après l'heure de début", 400);
      }
      await assertScheduleScope(req, d.subjectId);

      const conflicts = await checkRoomConflict(d.room, d.dayOfWeek, d.startTime, d.endTime);

      const effectiveDate = d.effectiveDate ? new Date(d.effectiveDate) : new Date();
      const entry = await prisma.scheduleEntry.create({
        data: {
          subjectId: d.subjectId,
          semesterId: d.semesterId,
          professorName: d.professorName,
          room: d.room,
          dayOfWeek: d.dayOfWeek,
          startTime: d.startTime,
          endTime: d.endTime,
          type: d.type,
          effectiveDate,
        },
      });

      const notified = await notifyProgrammeScheduleChange(d.subjectId);

      res.status(201).json({
        ...entry,
        warning: roomWarning(conflicts, d.semesterId, d.room),
        notified,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /admin/schedule/:id ───────────────────────────────────────────────
router.patch(
  '/:id',
  adminAuth,
  rbac(...WRITE_ROLES),
  audit('schedule.update', 'ScheduleEntry'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = scheduleSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid schedule data', 400);
      const d = parsed.data;

      const existing = await prisma.scheduleEntry.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Schedule entry not found', 404);
      await assertScheduleScope(req, d.subjectId ?? existing.subjectId);

      const start = d.startTime ?? existing.startTime;
      const end = d.endTime ?? existing.endTime;
      if (end <= start) {
        throw new AppError("L'heure de fin doit être après l'heure de début", 400);
      }

      const room = d.room ?? existing.room;
      const semesterId = d.semesterId ?? existing.semesterId;
      const conflicts = await checkRoomConflict(
        room,
        d.dayOfWeek ?? existing.dayOfWeek,
        start,
        end,
        existing.id
      );

      const entry = await prisma.scheduleEntry.update({
        where: { id: existing.id },
        data: {
          ...(d.subjectId !== undefined ? { subjectId: d.subjectId } : {}),
          ...(d.semesterId !== undefined ? { semesterId: d.semesterId } : {}),
          ...(d.professorName !== undefined ? { professorName: d.professorName } : {}),
          ...(d.room !== undefined ? { room: d.room } : {}),
          ...(d.dayOfWeek !== undefined ? { dayOfWeek: d.dayOfWeek } : {}),
          ...(d.startTime !== undefined ? { startTime: d.startTime } : {}),
          ...(d.endTime !== undefined ? { endTime: d.endTime } : {}),
          ...(d.type !== undefined ? { type: d.type } : {}),
          ...(d.effectiveDate !== undefined ? { effectiveDate: new Date(d.effectiveDate) } : {}),
        },
      });

      const notified = await notifyProgrammeScheduleChange(entry.subjectId);

      res.status(200).json({
        ...entry,
        warning: roomWarning(conflicts, semesterId, room),
        notified,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /admin/schedule/:id ──────────────────────────────────────────────
router.delete(
  '/:id',
  adminAuth,
  rbac(...WRITE_ROLES),
  audit('schedule.delete', 'ScheduleEntry'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.scheduleEntry.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Schedule entry not found', 404);
      await assertScheduleScope(req, existing.subjectId);
      await prisma.scheduleEntry.delete({ where: { id: existing.id } });

      const notified = await notifyProgrammeScheduleChange(existing.subjectId);

      res.status(200).json({ id: existing.id, deleted: true, notified });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
