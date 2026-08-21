import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AdminRole } from '@prisma/client';
import prisma from '../utils/prisma';
import { adminEnv } from '../config/adminEnv';

/**
 * Admin authentication context attached to every authenticated admin request.
 * `req.admin` carries the identity extracted from the admin JWT.
 * `req.adminScope` is set by the rbac() middleware for FACULTY_ADMIN so route
 * handlers can filter their queries by faculty.
 */
export interface AdminContext {
  adminId: string;
  role: AdminRole;
  facultyId: string | null;
}

export interface AdminScope {
  facultyId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: AdminContext;
      adminScope?: AdminScope;
    }
  }
}

interface AdminAccessTokenPayload {
  adminId: string;
  role: AdminRole;
  facultyId: string | null;
  type: string;
}

/**
 * Verifies the admin access token (separate secret: JWT_ADMIN_SECRET).
 * A student token can never pass this check because it is signed with a
 * different secret and lacks `type: 'admin_access'`. Access tokens have a
 * 1-hour TTL (enforced at sign time in routes/admin/auth.ts).
 */
export default async function adminAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin access token required' });
    return;
  }

  const token = authHeader.slice(7);

  let payload: AdminAccessTokenPayload;
  try {
    payload = jwt.verify(token, adminEnv.JWT_ADMIN_SECRET) as AdminAccessTokenPayload;
  } catch (err: unknown) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
      return;
    }
    res.status(401).json({ error: 'Invalid token' });
    return;
  }

  if (payload.type !== 'admin_access') {
    res.status(401).json({ error: 'Invalid token type' });
    return;
  }

  // The JWT is a 1-hour snapshot. Re-read the account so deactivation takes
  // effect on the next request instead of when the token happens to expire, and
  // so rbac() downstream authorises against the live role rather than the role
  // baked into the token at sign time (a demotion must apply immediately).
  let admin: { isActive: boolean; role: AdminRole; facultyId: string | null } | null;
  try {
    admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { isActive: true, role: true, facultyId: true },
    });
  } catch (err) {
    next(err);
    return;
  }

  if (!admin || !admin.isActive) {
    res.status(403).json({ error: 'Account inactive' });
    return;
  }

  req.admin = {
    adminId: payload.adminId,
    role: admin.role,
    facultyId: admin.facultyId,
  };

  next();
}
