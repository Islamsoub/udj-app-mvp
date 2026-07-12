import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdminRole, NotificationType, StudentStatus } from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import adminAuth from '../../middleware/adminAuth';
import { rbac } from '../../middleware/rbac';
import { audit } from '../../middleware/auditLog';
import { createNotification } from '../../utils/notify';

const router = Router();

const ALL_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.FACULTY_ADMIN,
  AdminRole.REGISTRAR,
  AdminRole.NEWS_EDITOR,
];
const EDIT_ROLES: AdminRole[] = [AdminRole.SUPER_ADMIN, AdminRole.NEWS_EDITOR];

// Max number of simultaneously-urgent articles (architecture doc §7.3).
const MAX_URGENT = 3;

// Rough reading-time estimate (~200 words/min), min 1.
function readTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

// Short push-notification body derived from the article body.
function notifBody(body: string): string {
  const trimmed = body.trim();
  return trimmed.length > 160 ? `${trimmed.slice(0, 157)}…` : trimmed;
}

// Ids of all currently-active students (urgent / opt-in notification recipients).
async function activeStudentIds(): Promise<string[]> {
  const students = await prisma.student.findMany({
    where: { status: StudentStatus.ACTIVE },
    select: { id: true },
  });
  return students.map((s) => s.id);
}

/**
 * Enforces the max-3-urgent rule. Call ONLY when an article is about to be
 * urgent. If the limit would be exceeded, unpins the oldest OTHER urgent
 * article (by publishedAt, then createdAt) and returns it so the caller can
 * surface the "n'est plus en urgence" toast.
 */
async function enforceUrgentLimit(
  excludeId?: string
): Promise<{ id: string; titleFr: string } | null> {
  const others = await prisma.newsArticle.findMany({
    where: { isUrgent: true, ...(excludeId ? { id: { not: excludeId } } : {}) },
    orderBy: [{ publishedAt: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, titleFr: true },
  });
  if (others.length < MAX_URGENT) return null;

  const oldest = others[0];
  await prisma.newsArticle.update({ where: { id: oldest.id }, data: { isUrgent: false } });
  return oldest;
}

// ─── GET /admin/news (published + drafts) ────────────────────────────────────
router.get('/', adminAuth, rbac(...ALL_ROLES), async (_req, res, next) => {
  try {
    const articles = await prisma.newsArticle.findMany({
      orderBy: { publishedAt: 'desc' },
      include: { categoryRel: true }, // reads prefer the relation (architecture §7.2)
    });
    res.status(200).json(articles);
  } catch (err) {
    next(err);
  }
});

// ─── GET /admin/news/:id ─────────────────────────────────────────────────────
router.get('/:id', adminAuth, rbac(...ALL_ROLES), async (req, res, next) => {
  try {
    const article = await prisma.newsArticle.findUnique({
      where: { id: String(req.params.id) },
      include: { categoryRel: true },
    });
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
  categoryId: z.string().uuid().nullable().optional(),
  isUrgent: z.boolean().optional().default(false),
  sendNotification: z.boolean().optional().default(false),
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

      // Enforce the urgent limit before creating (may unpin the oldest urgent).
      const unpinned = d.isUrgent ? await enforceUrgentLimit() : null;

      const article = await prisma.newsArticle.create({
        data: {
          titleFr: d.titleFr,
          titleAr: d.titleAr ?? '',
          bodyFr: d.bodyFr,
          bodyAr: d.bodyAr ?? '',
          category: d.category, // KEPT — dual-write with the relation below
          ...(d.categoryId !== undefined ? { categoryId: d.categoryId } : {}),
          isUrgent: d.isUrgent ?? false,
          heroImageUrl: d.heroImageUrl ?? null,
          readTimeMinutes: readTime(d.bodyFr),
          publishedAt: d.publishedAt ? new Date(d.publishedAt) : new Date(),
        },
      });

      // Urgent → always notify; non-urgent → notify only if opted in.
      let notified = 0;
      if (article.isUrgent || d.sendNotification) {
        notified = await createNotification(
          await activeStudentIds(),
          NotificationType.NEWS,
          article.titleFr,
          notifBody(article.bodyFr)
        );
      }

      res.status(201).json({ ...article, unpinned, notified });
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

      // Enforce the urgent limit only when this edit sets the article urgent.
      const unpinned = d.isUrgent === true ? await enforceUrgentLimit(existing.id) : null;

      const article = await prisma.newsArticle.update({
        where: { id: existing.id },
        data: {
          ...(d.titleFr !== undefined ? { titleFr: d.titleFr } : {}),
          ...(d.titleAr !== undefined ? { titleAr: d.titleAr } : {}),
          ...(d.bodyFr !== undefined ? { bodyFr: d.bodyFr, readTimeMinutes: readTime(d.bodyFr) } : {}),
          ...(d.bodyAr !== undefined ? { bodyAr: d.bodyAr } : {}),
          ...(d.category !== undefined ? { category: d.category } : {}),
          ...(d.categoryId !== undefined ? { categoryId: d.categoryId } : {}),
          ...(d.isUrgent !== undefined ? { isUrgent: d.isUrgent } : {}),
          ...(d.heroImageUrl !== undefined ? { heroImageUrl: d.heroImageUrl } : {}),
          ...(d.publishedAt !== undefined ? { publishedAt: new Date(d.publishedAt) } : {}),
        },
      });

      // Notify when the article just became urgent, or the editor opted in.
      const becameUrgent = d.isUrgent === true && !existing.isUrgent;
      let notified = 0;
      if (becameUrgent || d.sendNotification === true) {
        notified = await createNotification(
          await activeStudentIds(),
          NotificationType.NEWS,
          article.titleFr,
          notifBody(article.bodyFr)
        );
      }

      res.status(200).json({ ...article, unpinned, notified });
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
