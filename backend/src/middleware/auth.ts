import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { env } from '../utils/env';

declare global {
  namespace Express {
    interface Request {
      studentId?: string;
    }
  }
}

interface AccessTokenPayload {
  studentId: string;
  type: string;
}

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  const token = authHeader.slice(7);

  let payload: AccessTokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  if (payload.type !== 'access') {
    res.status(401).json({ error: 'Invalid token type' });
    return;
  }

  // Logout is exempt: a suspended student must still be able to revoke their
  // refresh token server-side. originalUrl is used because req.url is rewritten
  // relative to the router's mount point, and the auth router is mounted twice
  // (/auth and /admin/auth) — both tails match.
  const requestPath = (req.originalUrl || req.url).split('?')[0];
  const isLogout = requestPath.endsWith('/auth/logout');

  // A valid JWT is not enough: access tokens live 15 minutes, so a student
  // suspended mid-session would keep full API access until theirs expired.
  // Every other authenticated request re-checks the account's current status.
  if (!isLogout) {
    try {
      const student = await prisma.student.findUnique({
        where: { id: payload.studentId },
        select: { status: true },
      });

      if (!student || student.status !== 'ACTIVE') {
        res.status(403).json({ error: 'Account inactive' });
        return;
      }
    } catch (err) {
      next(err);
      return;
    }
  }

  req.studentId = payload.studentId;
  next();
}
