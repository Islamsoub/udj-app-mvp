import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

/**
 * Admin-specific environment variables. These are kept separate from the
 * student `env.ts` schema so that the student auth secrets and admin auth
 * secrets never mix. Add the following keys to backend/.env (and .env.example):
 *
 *   JWT_ADMIN_SECRET=<32+ char secret, DIFFERENT from JWT_SECRET>
 *   JWT_ADMIN_REFRESH_SECRET=<32+ char secret, DIFFERENT from REFRESH_SECRET>
 *   ADMIN_CORS_ORIGIN=https://admin-unipocket.vercel.app
 *
 * Integration note: you can instead merge these three keys into the existing
 * `src/utils/env.ts` zod schema and import from there. This standalone file
 * lets the admin backend drop in without touching the student env validator.
 */
const adminEnvSchema = z.object({
  JWT_ADMIN_SECRET: z.string().min(32),
  JWT_ADMIN_REFRESH_SECRET: z.string().min(32),
  ADMIN_CORS_ORIGIN: z.string().url().optional(),
});

const result = adminEnvSchema.safeParse(process.env);

if (!result.success) {
  const invalid = result.error.issues.map((i) => i.path.join('.')).join(', ');
  console.error(`[adminEnv] Missing or invalid admin environment variables: ${invalid}`);
  process.exit(1);
}

export const adminEnv = result.data;

// Token lifetimes (task rules: 1h access, 30d refresh).
export const ADMIN_ACCESS_TTL = '1h';
export const ADMIN_ACCESS_TTL_MS = 60 * 60 * 1000;
export const ADMIN_REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

// bcrypt cost factor — matches the student auth P0 security rule (cost 12).
export const BCRYPT_COST = 12;
