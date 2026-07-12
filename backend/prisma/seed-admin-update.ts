/**
 * Admin portal — Pass C supplementary seed.
 *
 * Run AFTER the schema changes are applied (prisma migrate/generate) and after
 * the base seeds (seed.ts, seed-admin.ts):
 *
 *   npx tsx prisma/seed-admin-update.ts
 *
 * Seeds / updates:
 *   • 6 NewsCategory records (the previously-hardcoded set) with slugs + order.
 *   • Backfills NewsArticle.categoryId from each article's existing `category`
 *     slug string (only where categoryId is still null).
 *   • Ensures SystemSettings.justificationDeadlineDays = 8 (default) exists.
 *
 * Idempotent: category upserts key on the unique slug; the backfill only touches
 * rows whose categoryId is null; the settings upsert never clobbers an existing
 * admin-configured value.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// The 6 categories that used to be hardcoded in the app (architecture §7.2).
// Slugs match the `category` strings already stored on NewsArticle rows
// (official, events, scolarite, sport) so the backfill links them up.
const CATEGORY_SEED: { nameFr: string; slug: string; displayOrder: number }[] = [
  { nameFr: 'Officiel', slug: 'official', displayOrder: 0 },
  { nameFr: 'Événements', slug: 'events', displayOrder: 1 },
  { nameFr: 'Scolarité', slug: 'scolarite', displayOrder: 2 },
  { nameFr: 'Sport', slug: 'sport', displayOrder: 3 },
  { nameFr: 'Youth', slug: 'youth', displayOrder: 4 },
  { nameFr: 'Sponsors', slug: 'sponsors', displayOrder: 5 },
];

async function main() {
  // ── NewsCategory upserts ────────────────────────────────────────────────────
  const categoryIdBySlug = new Map<string, string>();
  for (const c of CATEGORY_SEED) {
    const category = await prisma.newsCategory.upsert({
      where: { slug: c.slug },
      create: { nameFr: c.nameFr, slug: c.slug, displayOrder: c.displayOrder },
      update: { nameFr: c.nameFr, displayOrder: c.displayOrder },
    });
    categoryIdBySlug.set(c.slug, category.id);
  }
  console.log(`[seed-admin-update] upserted ${CATEGORY_SEED.length} news categories`);

  // ── Backfill NewsArticle.categoryId from the legacy category slug ───────────
  let linked = 0;
  for (const [slug, categoryId] of categoryIdBySlug) {
    const result = await prisma.newsArticle.updateMany({
      where: { category: slug, categoryId: null },
      data: { categoryId },
    });
    linked += result.count;
  }
  console.log(`[seed-admin-update] linked ${linked} articles to their category`);

  const orphaned = await prisma.newsArticle.count({ where: { categoryId: null } });
  if (orphaned > 0) {
    console.warn(
      `[seed-admin-update] ${orphaned} article(s) have a category slug with no matching NewsCategory — left unlinked`
    );
  }

  // ── SystemSettings.justificationDeadlineDays ────────────────────────────────
  // Create the singleton with the default if missing; never overwrite an
  // existing admin-configured value.
  await prisma.systemSettings.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton', justificationDeadlineDays: 8 },
    update: {},
  });
  const settings = await prisma.systemSettings.findUnique({ where: { id: 'singleton' } });
  console.log(
    `[seed-admin-update] justificationDeadlineDays = ${settings?.justificationDeadlineDays ?? 8}`
  );

  console.log('[seed-admin-update] ✓ done');
}

main()
  .catch((e) => {
    console.error('[seed-admin-update] failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
