import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  QR_SECRET: z.string().min(32),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  PORT: z.string().default('3000'),
  // Defaults to production: a missing NODE_ENV should fail closed (secure
  // cookies, strict CORS) rather than silently run the server in dev mode.
  // Dev and CI set NODE_ENV explicitly in their .env.
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  JWT_ADMIN_SECRET: z.string().min(32),
  JWT_ADMIN_REFRESH_SECRET: z.string().min(32),
  // Comma-separated allowlist, required in every environment. No default — a
  // localhost fallback in production silently disabled the admin portal's CORS
  // instead of failing loudly at boot.
  ADMIN_CORS_ORIGIN: z
    .string()
    .min(1)
    .transform((s) => s.split(',').map((o) => o.trim()).filter(Boolean)),
  // Shared secret the PWA's server-side proxy presents so it may declare the
  // real client IP for rate limiting (see resolveClientIp in
  // middleware/rateLimiter.ts). Optional with no default: unset or empty means
  // the forwarded-IP header is never trusted and req.ip is always used, so the
  // native app — which does not proxy — is unaffected.
  PWA_PROXY_SECRET: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const invalid = result.error.issues.map(i => i.path.join('.')).join(', ');
  console.error(`[env] Missing or invalid environment variables: ${invalid}`);
  process.exit(1);
}

export const env = result.data;
