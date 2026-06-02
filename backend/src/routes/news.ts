import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import authMiddleware from '../middleware/auth';
import { AppError } from '../utils/AppError';

const router = Router();
router.use(authMiddleware);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_CATEGORIES = new Set(['official', 'events', 'scolarite', 'sport', 'youth', 'sponsors']);

// ── GET /news ─────────────────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawCategory = typeof req.query.category === 'string' ? req.query.category.toLowerCase() : undefined;
    const category = rawCategory && VALID_CATEGORIES.has(rawCategory) ? rawCategory : undefined;
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || '10', 10), 1), 100);
    const offset = Math.max(parseInt((req.query.offset as string) || '0', 10), 0);

    const articles = await prisma.newsArticle.findMany({
      where: category ? { category } : undefined,
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
    const article = await prisma.newsArticle.findUnique({
      where: { id },
    });

    if (!article) throw new AppError('Article not found', 404);

    res.status(200).json(article);
  } catch (err) {
    next(err);
  }
});

export default router;
