import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import authMiddleware from '../middleware/auth';
import { AppError } from '../utils/AppError';

const router = Router();

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Published means `publishedAt` has been reached: an article dated in the
 * future is a scheduled one, not yet out. NewsArticle has no other status
 * (savedArticles.ts applies the same rule). Students never see a scheduled
 * article; the admin portal lists and edits them through /admin/news, which is
 * a separate router and is not filtered.
 *
 * Built per request, so an article appears as soon as its date passes.
 */
function publishedNow() {
  return { publishedAt: { lte: new Date() } };
}

// ── GET /news/categories ──────────────────────────────────────────────────────
// PUBLIC (registered before the auth middleware): category names aren't sensitive
// and the mobile filter chips must load before the user authenticates/scrolls.
router.get('/categories', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.newsCategory.findMany({
      orderBy: { displayOrder: 'asc' },
      select: { id: true, nameFr: true, nameAr: true, slug: true, displayOrder: true },
    });
    res.status(200).json({ categories });
  } catch (err) {
    next(err);
  }
});

// Everything below requires a valid student session.
router.use(authMiddleware);

// ── GET /news ─────────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Pass the slug straight to the WHERE clause. An unknown slug simply matches
    // no rows and returns an empty list — no hardcoded allow-list to maintain.
    const category =
      typeof req.query.category === 'string' ? req.query.category.toLowerCase() : undefined;
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '10', 10), 1), 100);
    const offset = Math.max(parseInt((req.query.offset as string) || '0', 10), 0);

    const articles = await prisma.newsArticle.findMany({
      where: { ...publishedNow(), ...(category ? { category } : {}) },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        titleFr: true,
        titleAr: true,
        category: true,
        heroImageUrl: true,
        readTimeMinutes: true,
        isUrgent: true,
        publishedAt: true,
      },
    });

    res.status(200).json({ articles });
  } catch (err) {
    next(err);
  }
});

// ── GET /news/:id ─────────────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    if (!UUID_RE.test(id)) throw new AppError('Invalid article ID', 400);
    // An unknown and a scheduled article answer the same 404, so the API never
    // confirms that a scheduled article exists.
    const article = await prisma.newsArticle.findFirst({
      where: { id, ...publishedNow() },
    });

    if (!article) throw new AppError('Article not found', 404);

    res.status(200).json(article);
  } catch (err) {
    next(err);
  }
});

export default router;
