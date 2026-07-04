import { env } from '../utils/env';

/**
 * Admin-specific environment values. The three admin secrets/origins now live
 * in the single Zod-validated `env.ts` schema (JWT_ADMIN_SECRET,
 * JWT_ADMIN_REFRESH_SECRET, ADMIN_CORS_ORIGIN) so student and admin config
 * share one validator and one source of truth. This module re-exports them
 * under the `adminEnv` name the admin routes/middleware already consume, plus
 * the admin token-lifetime and bcrypt constants.
 */
export const adminEnv = {
  JWT_ADMIN_SECRET: env.JWT_ADMIN_SECRET,
  JWT_ADMIN_REFRESH_SECRET: env.JWT_ADMIN_REFRESH_SECRET,
  ADMIN_CORS_ORIGIN: env.ADMIN_CORS_ORIGIN,
};

// Token lifetimes (task rules: 1h access, 30d refresh).
export const ADMIN_ACCESS_TTL = '1h';
export const ADMIN_ACCESS_TTL_MS = 60 * 60 * 1000;
export const ADMIN_REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// bcrypt cost factor — matches the student auth P0 security rule (cost 12).
export const BCRYPT_COST = 12;
