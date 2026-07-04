import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma, ScheduleEntryType, AdminRole } from '@prisma/client';
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
const WRITE_ROLES: AdminRole[] = [AdminRole.SUPER_ADMIN, AdminRole.FACULTY_ADMIN];

// "HH:MM" 24h validator.
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// ─── GET /admin/schedule ─────────────────────────────────────────────────────
// Filter by programme, day (0=Sun … 4=Thu, Djibouti week), semester.
router.get('/', adminAuth, rbac(...ALL_ROLES), async (req, res, next) => {
  try {
    const { programme, day, semester } = req.query as Record<string, string | undefined>;
    const where: Prisma.ScheduleEntryWhereInput = {
      subject: {
        ...(facultyScopeWhere(req, ['programme']) as Prisma.SubjectWhereInput),
        ...(programme ? { programmeId: programme } : {}),
      },
    };
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

// Detects a room clash: same room + day + semester, overlapping time window.
async function findRoomConflict(
  room: string,
  dayOfWeek: number,
  semesterId: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): Promise<boolean> {
  const sameSlot = await prisma.scheduleEntry.findMany({
    where: {
      room,
      dayOfWeek,
      semesterId,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { startTime: true, endTime: true },
  });
  return sameSlot.some((e) => startTime < e.endTime && endTime > e.startTime);
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

      const conflict = await findRoomConflict(
        d.room,
        d.dayOfWeek,
        d.semesterId,
        d.startTime,
        d.endTime
      );

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

      res.status(201).json({
        ...entry,
        warning: conflict ? 'Conflit de salle détecté pour ce créneau' : null,
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

      const conflict = await findRoomConflict(
        d.room ?? existing.room,
        d.dayOfWeek ?? existing.dayOfWeek,
        d.semesterId ?? existing.semesterId,
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

      res.status(200).json({
        ...entry,
        warning: conflict ? 'Conflit de salle détecté pour ce créneau' : null,
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
      res.status(200).json({ id: existing.id, deleted: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
