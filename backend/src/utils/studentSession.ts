import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { Prisma } from '@prisma/client';
import { env } from './env';
import { hashToken } from './hash';

/**
 * A student session: a 15-minute access JWT and a 30-day refresh token, of
 * which only the SHA-256 hash is stored. Shared by POST /auth/login and
 * PATCH /student/password so both hand out exactly the same pair.
 */

export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function signStudentAccessToken(studentId: string): string {
  return jwt.sign({ studentId, type: 'access' }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

/**
 * A new refresh token: the plain value for the client, and the row to store
 * (passed to prisma.refreshToken.create by the caller, so it can sit inside the
 * caller's transaction).
 */
export function newRefreshToken(
  studentId: string,
  userAgent: string | undefined,
  now: Date
): { plain: string; data: Prisma.RefreshTokenUncheckedCreateInput } {
  const plain = crypto.randomUUID();
  return {
    plain,
    data: {
      studentId,
      tokenHash: hashToken(plain),
      deviceName: (userAgent || '').slice(0, 256) || null,
      issuedAt: now,
      expiresAt: new Date(now.getTime() + REFRESH_TOKEN_TTL_MS),
      isRevoked: false,
    },
  };
}

/** The student object of the login response. */
export const STUDENT_SESSION_INCLUDE = {
  programme: { include: { faculty: true } },
} as const;

type SessionStudent = Prisma.StudentGetPayload<{ include: typeof STUDENT_SESSION_INCLUDE }>;

export function studentSessionView(student: SessionStudent) {
  return {
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
    },
    faculty: {
      id: student.programme.faculty.id,
      nameFr: student.programme.faculty.nameFr,
      nameAr: student.programme.faculty.nameAr,
      code: student.programme.faculty.code,
    },
  };
}
