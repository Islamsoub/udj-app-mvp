/**
 * Safety rails shared by the seed scripts.
 *
 * seed.ts starts by deleting every table; seed-admin.ts deletes every admin,
 * refresh token and audit entry. Pointed at the live database — one wrong
 * DATABASE_URL in a shell — either would wipe production with no prompt. The
 * repository is public, and both scripts also gave every account a password
 * written in the source.
 */
import { randomBytes } from 'node:crypto';

/** host/database from DATABASE_URL, never the credentials. */
export function seedTarget(): string {
  const raw = process.env.DATABASE_URL ?? '';
  try {
    const u = new URL(raw);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return '(DATABASE_URL not set or unreadable)';
  }
}

/** The host alone — what SEED_WIPE_CONFIRM must repeat. */
function seedHost(): string {
  try {
    return new URL(process.env.DATABASE_URL ?? '').hostname;
  } catch {
    return '';
  }
}

/**
 * Refuses to go on when the tables about to be wiped already hold data, unless
 * SEED_WIPE_CONFIRM names the database host. An empty database (a fresh local
 * or staging project) seeds without ceremony; a database with real rows needs
 * the operator to type which one they are wiping.
 */
export function assertSafeToWipe(script: string, existing: Record<string, number>): void {
  const target = seedTarget();
  const nonEmpty = Object.entries(existing).filter(([, n]) => n > 0);
  console.log(`[${script}] target: ${target}`);
  if (nonEmpty.length === 0) return;

  const host = seedHost();
  if (host && process.env.SEED_WIPE_CONFIRM === host) {
    console.warn(`[${script}] SEED_WIPE_CONFIRM matches — wiping existing data on ${target}.`);
    return;
  }

  const found = nonEmpty.map(([table, n]) => `${n} ${table}`).join(', ');
  throw new Error(
    `[${script}] refused: ${target} already holds ${found}, and this script deletes them.\n` +
      `If this is really the database you mean to wipe, run it again with\n` +
      `  SEED_WIPE_CONFIRM=${host || '<database host>'}\n` +
      `Never against the live database.`
  );
}

/**
 * The password for seeded accounts: from the named environment variable, or a
 * random one printed once at the end of the run. Never a fixed string in the
 * source — anything committed here is readable by anyone.
 */
export function seedPassword(envName: string): { password: string; generated: boolean } {
  const fromEnv = process.env[envName];
  if (fromEnv && fromEnv.length >= 8) return { password: fromEnv, generated: false };
  if (fromEnv) throw new Error(`${envName} must be at least 8 characters.`);
  return { password: randomBytes(12).toString('base64url'), generated: true };
}

export function announcePassword(script: string, envName: string, who: string, p: { password: string; generated: boolean }): void {
  if (p.generated) {
    console.log(`[${script}] ${who} password (generated, shown once): ${p.password}`);
    console.log(`[${script}] set ${envName} to choose it instead.`);
  } else {
    console.log(`[${script}] ${who} password: the value of ${envName}.`);
  }
}
