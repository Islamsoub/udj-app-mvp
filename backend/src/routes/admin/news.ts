import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdminRole } from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import adminAuth from '../../middleware/adminAuth';
import { rbac } from '../../middleware/rbac';
import { audit } from '../../middleware/auditLog';

const router = Router();

const ALL_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.FACULTY_ADMIN,
  AdminRole.REGISTRAR,
  AdminRole.NEWS_EDITOR,
];
const EDIT_ROLES: AdminRole[] = [AdminRole.SUPER_ADMIN, AdminRole.NEWS_EDITOR];

// Rough reading-time estimate (~200 words/min), min 1.
function readTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// ─── GET /admin/news (published + drafts) ────────────────────────────────────
router.get('/', adminAuth, rbac(...ALL_ROLES), async (_req, res, next) => {
  try {
    const articles = await prisma.newsArticle.findMany({ orderBy: { publishedAt: 'desc' } });
    res.status(200).json(articles);
  } catch (err) {
    next(err);
  }
});

// ─── GET /admin/news/:id ─────────────────────────────────────────────────────
router.get('/:id', adminAuth, rbac(...ALL_ROLES), async (req, res, next) => {
  try {
    const article = await prisma.newsArticle.findUnique({ where: { id: String(req.params.id) } });
    if (!article) throw new AppError('Article not found', 404);
    res.status(200).json(article);
  } catch (err) {
    next(err);
  }
});

// ─── POST /admin/news ────────────────────────────────────────────────────────
const createSchema = z.object({
  titleFr: z.string().min(1),
  titleAr: z.string().optional().default(''),
  bodyFr: z.string().min(1),
  bodyAr: z.string().optional().default(''),
  category: z.string().min(1),
  isUrgent: z.boolean().optional().default(false),
  heroImageUrl: z.string().url().nullable().optional(),
  publishedAt: z.string().optional(),
});

router.post(
  '/',
  adminAuth,
  rbac(...EDIT_ROLES),
  audit('news.create', 'NewsArticle'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid article data', 400);
      const d = parsed.data;

      const article = await prisma.newsArticle.create({
        data: {
          titleFr: d.titleFr,
          titleAr: d.titleAr ?? '',
          bodyFr: d.bodyFr,
          bodyAr: d.bodyAr ?? '',
          category: d.category,
          isUrgent: d.isUrgent ?? false,
          heroImageUrl: d.heroImageUrl ?? null,
          readTimeMinutes: readTime(d.bodyFr),
          publishedAt: d.publishedAt ? new Date(d.publishedAt) : new Date(),
        },
      });

      res.status(201).json(article);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /admin/news/:id ───────────────────────────────────────────────────
router.patch(
  '/:id',
  adminAuth,
  rbac(...EDIT_ROLES),
  audit('news.update', 'NewsArticle'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createSchema.partial().safeParse(req.body);
      if (!parsed.success) throw new AppError('Invalid article data', 400);
      const d = parsed.data;

      const existing = await prisma.newsArticle.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Article not found', 404);

      const article = await prisma.newsArticle.update({
        where: { id: existing.id },
        data: {
          ...(d.titleFr !== undefined ? { titleFr: d.titleFr } : {}),
          ...(d.titleAr !== undefined ? { titleAr: d.titleAr } : {}),
          ...(d.bodyFr !== undefined ? { bodyFr: d.bodyFr, readTimeMinutes: readTime(d.bodyFr) } : {}),
          ...(d.bodyAr !== undefined ? { bodyAr: d.bodyAr } : {}),
          ...(d.category !== undefined ? { category: d.category } : {}),
          ...(d.isUrgent !== undefined ? { isUrgent: d.isUrgent } : {}),
          ...(d.heroImageUrl !== undefined ? { heroImageUrl: d.heroImageUrl } : {}),
          ...(d.publishedAt !== undefined ? { publishedAt: new Date(d.publishedAt) } : {}),
        },
      });

      res.status(200).json(article);
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /admin/news/:id (SUPER_ADMIN only) ───────────────────────────────
router.delete(
  '/:id',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN),
  audit('news.delete', 'NewsArticle'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.newsArticle.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Article not found', 404);
      await prisma.newsArticle.delete({ where: { id: existing.id } });
      res.status(200).json({ id: existing.id, deleted: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
