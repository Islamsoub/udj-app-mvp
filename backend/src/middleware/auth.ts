import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
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

export default function authMiddleware(req: Request, res: Response, next: NextFunction): void {
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

  req.studentId = payload.studentId;
  next();
}
