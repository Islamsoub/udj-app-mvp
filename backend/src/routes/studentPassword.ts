import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { NotificationType, type PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError';
import { BCRYPT_COST } from '../config/adminEnv';
import { PASSWORD_MAX, PASSWORD_MIN } from '../utils/passwordPolicy';
import {
  STUDENT_SESSION_INCLUDE,
  newRefreshToken,
  signStudentAccessToken,
  studentSessionView,
} from '../utils/studentSession';

/**
 * PATCH /student/password — a student changes their own password.
 *
 * Behind authMiddleware (mounted in student.ts), so req.studentId is the
 * verified id from the access token; no student id is taken from the client.
 *
 * SESSIONS. Every refresh token of the student is revoked and a fresh
 * access/refresh pair is returned, in the login response's format, for the
 * device that made the change. The current session cannot be told apart from
 * the others: the access token carries only the student id, no reference to the
 * refresh token it came with, and the request carries no refresh token. So
 * every other device loses its refresh token, and this one carries on with the
 * new pair. An other device's ACCESS token is a stateless JWT and stays valid
 * until it expires (15 minutes at most).
 *
 * ONE TRANSACTION, as the admin reset: the new hash, the revocation, the new
 * refresh token and the notification commit together or not at all.
 *
 * Wrong current password: 400. The login lockout counters are not touched (a
 * student already signed in must not lock themselves out of login); the route
 * has its own rate limit instead (passwordChangeLimiter).
 *
 * Passwords are never logged or returned. Every error thrown here is an
 * AppError with a fixed message, so the error handler logs nothing the client
 * sent, and it never logs the body.
 *
 * The database is injected so the route can be tested end to end without a
 * live Postgres (tests/student-password.test.ts); student.ts passes the real
 * client.
 */

export type StudentPasswordDb = Pick<
  PrismaClient,
  'student' | 'refreshToken' | 'notification' | '$transaction'
>;

const MSG_REQUIRED = 'Mot de passe actuel et nouveau mot de passe requis';
const MSG_LENGTH = `Le nouveau mot de passe doit contenir entre ${PASSWORD_MIN} et ${PASSWORD_MAX} caractères`;
const MSG_SAME = "Le nouveau mot de passe doit être différent de l'actuel";
const MSG_WRONG = 'Mot de passe actuel incorrect';

const schema = z
  .object({
    currentPassword: z.string({ message: MSG_REQUIRED }).min(1, MSG_REQUIRED).max(PASSWORD_MAX, MSG_WRONG),
    newPassword: z
      .string({ message: MSG_REQUIRED })
      .min(PASSWORD_MIN, MSG_LENGTH)
      .max(PASSWORD_MAX, MSG_LENGTH),
  })
  .refine((d) => d.newPassword !== d.currentPassword, { message: MSG_SAME, path: ['newPassword'] });

export const PASSWORD_CHANGED_NOTIFICATION = {
  type: NotificationType.GENERAL,
  titleFr: 'Mot de passe modifié',
  titleAr: 'تم تغيير كلمة المرور',
  bodyFr: 'Votre mot de passe a été modifié.',
  bodyAr: 'تم تغيير كلمة المرور الخاصة بك.',
} as const;

export function createStudentPasswordRouter(db: StudentPasswordDb, limiter: RequestHandler): Router {
  const router = Router();

  router.patch('/', limiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.studentId!;

      const parsed = schema.safeParse(req.body ?? {});
      if (!parsed.success) {
        // The first issue's fixed message; zod's own text is never used.
        throw new AppError(parsed.error.issues[0]?.message ?? MSG_REQUIRED, 400);
      }
      const { currentPassword, newPassword } = parsed.data;

      const student = await db.student.findUnique({
        where: { id: studentId },
        include: STUDENT_SESSION_INCLUDE,
      });
      if (!student) throw new AppError('Student not found', 404);

      const valid = await bcrypt.compare(currentPassword, student.passwordHash);
      if (!valid) throw new AppError(MSG_WRONG, 400);

      const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
      const now = new Date();
      const refresh = newRefreshToken(studentId, req.headers['user-agent'], now);

      await db.$transaction([
        db.student.update({ where: { id: studentId }, data: { passwordHash } }),
        db.refreshToken.updateMany({
          where: { studentId, isRevoked: false },
          data: { isRevoked: true },
        }),
        db.refreshToken.create({ data: refresh.data }),
        db.notification.create({ data: { studentId, ...PASSWORD_CHANGED_NOTIFICATION } }),
      ]);

      res.status(200).json({
        accessToken: signStudentAccessToken(studentId),
        refreshToken: refresh.plain,
        student: studentSessionView(student),
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
