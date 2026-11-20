import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { resolveCurrentSemester } from '../utils/currentSemester';

/**
 * /student/course-notes — a student's private notes on a class.
 *
 * A "class" is a subject on one weekday, the same key the mobile app's local
 * course_notes table uses (subject_code + day_of_week). The app keeps the code;
 * the server stores the subject id it resolves to, so a renamed code cannot
 * orphan a note.
 *
 * OWNERSHIP. Every query carries `studentId: req.studentId` in its WHERE, so
 * another student's note is not found rather than refused: a note id that
 * exists but is not yours answers 404, exactly like one that does not exist, and
 * the API never confirms that someone else's id is real.
 *
 * PRIVACY. The note text is the most personal thing this API stores. It is
 * never logged: the request logger prints method + path only, and the error
 * handler drops the messages that can quote a request body (see
 * middleware/errorHandler.ts). Nothing here logs.
 *
 * The database is injected so the routes can be tested end to end without a
 * live Postgres (tests/course-notes.test.ts); student.ts passes the real client.
 */

export type CourseNotesDb = Pick<PrismaClient, 'student' | 'semester' | 'subject' | 'courseNote'>;

const DAY_OF_WEEK = z.number().int().min(0).max(6);

/** Same bound as the admin portal's subject form. */
const SUBJECT_CODE = z.string().trim().min(1).max(32);

/**
 * Counted in code points, not UTF-16 units, so an emoji is one character and a
 * note of Arabic text gets the same 2000 as one in French.
 */
const BODY = z
  .string()
  .trim()
  .refine((s) => [...s].length >= 1, { message: 'empty' })
  .refine((s) => [...s].length <= 2000, { message: 'too long' });

/**
 * A device clock running a little fast must not make a note created "now"
 * unuploadable, so "the future" starts this far past the server's clock.
 */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

const createSchema = z.object({
  subjectCode: SUBJECT_CODE,
  dayOfWeek: DAY_OF_WEEK,
  body: BODY,
  // ISO 8601 with an offset or Z, as the app's `new Date().toISOString()` writes.
  createdAt: z.string().datetime({ offset: true }).optional(),
});

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NOTE_SELECT = {
  id: true,
  dayOfWeek: true,
  body: true,
  createdAt: true,
  updatedAt: true,
  subject: { select: { code: true } },
} as const;

interface NoteRow {
  id: string;
  dayOfWeek: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  subject: { code: string };
}

function toJson(row: NoteRow) {
  return {
    id: row.id,
    subjectCode: row.subject.code,
    dayOfWeek: row.dayOfWeek,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * The subject behind `code` IF it is in this student's timetable: a subject of
 * the student's programme in the current semester that has at least one
 * schedule entry. That is the set GET /student/schedule draws from, so a code
 * the student can see in their timetable resolves and any other code is 404.
 */
async function resolveScheduledSubject(
  db: CourseNotesDb,
  studentId: string,
  code: string
): Promise<{ id: string } | null> {
  const [student, semester] = await Promise.all([
    db.student.findUnique({ where: { id: studentId }, select: { programmeId: true } }),
    resolveCurrentSemester(db),
  ]);
  if (!student || !semester) return null;

  return db.subject.findFirst({
    where: {
      code,
      programmeId: student.programmeId,
      semesterId: semester.id,
      scheduleEntries: { some: { semesterId: semester.id } },
    },
    select: { id: true },
  });
}

export function createCourseNotesRouter(db: CourseNotesDb, writeLimiter: RequestHandler): Router {
  const router = Router();

  // ── GET /student/course-notes[?subjectCode=&dayOfWeek=] ─────────────────────
  // With both filters: one class's notes. With neither: every note the student
  // has, for the app's offline cache and its one-time upload check. One without
  // the other is a malformed request rather than a guess at what was meant.
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.studentId!;
      const rawCode = req.query.subjectCode;
      const rawDay = req.query.dayOfWeek;

      if (rawCode === undefined && rawDay === undefined) {
        const rows = await db.courseNote.findMany({
          where: { studentId },
          select: NOTE_SELECT,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        });
        res.status(200).json({ notes: rows.map(toJson) });
        return;
      }

      const code = SUBJECT_CODE.safeParse(rawCode);
      const day =
        typeof rawDay === 'string' && /^[0-6]$/.test(rawDay) ? Number(rawDay) : null;
      if (!code.success || day === null) {
        throw new AppError('subjectCode and dayOfWeek (0-6) are required together', 400);
      }

      const subject = await resolveScheduledSubject(db, studentId, code.data);
      if (!subject) throw new AppError('Subject not found', 404);

      const rows = await db.courseNote.findMany({
        where: { studentId, subjectId: subject.id, dayOfWeek: day },
        select: NOTE_SELECT,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      });
      res.status(200).json({ notes: rows.map(toJson) });
    } catch (err) {
      next(err);
    }
  });

  // ── POST /student/course-notes ──────────────────────────────────────────────
  router.post('/', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.studentId!;
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) {
        // A fixed sentence: zod's own message can echo the offending value.
        throw new AppError('Invalid note', 400);
      }
      const { subjectCode, dayOfWeek, body, createdAt } = parsed.data;

      let created: Date | undefined;
      if (createdAt !== undefined) {
        created = new Date(createdAt);
        if (created.getTime() > Date.now() + FUTURE_TOLERANCE_MS) {
          throw new AppError('createdAt cannot be in the future', 400);
        }
      }

      const subject = await resolveScheduledSubject(db, studentId, subjectCode);
      if (!subject) throw new AppError('Subject not found', 404);

      const row = await db.courseNote.create({
        data: {
          studentId,
          subjectId: subject.id,
          dayOfWeek,
          body,
          // Omitted -> the column default, now(). An uploaded note keeps the
          // date it was written on the phone.
          ...(created ? { createdAt: created } : {}),
        },
        select: NOTE_SELECT,
      });

      res.status(201).json(toJson(row));
    } catch (err) {
      next(err);
    }
  });

  // ── DELETE /student/course-notes/:id ────────────────────────────────────────
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.studentId!;
      const id = String(req.params.id ?? '');
      if (!UUID_RE.test(id)) throw new AppError('Invalid note ID', 400);

      // deleteMany, not delete: the studentId in the WHERE is the ownership
      // check, in the same statement as the delete, so there is no window
      // between "is it yours" and "remove it".
      const { count } = await db.courseNote.deleteMany({ where: { id, studentId } });
      if (count === 0) throw new AppError('Note not found', 404);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
