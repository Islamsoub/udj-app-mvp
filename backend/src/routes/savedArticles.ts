import { Router, Request, Response, NextFunction, RequestHandler } from 'express';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { AppError } from '../utils/AppError';

/**
 * /student/saved-articles — the news articles a student saved ("Enregistrer"),
 * kept on the server so the mobile app and the PWA share them.
 *
 * Ids only. Both clients already hold the article data from /news; this list
 * says which of those the student saved, and when.
 *
 * OWNERSHIP. Every query carries `studentId: req.studentId` (the verified id
 * from authMiddleware) in its WHERE or its data, so a student only ever reads
 * or changes their own saves. No route takes a student id from the client.
 *
 * IDEMPOTENT WRITES. PUT and DELETE both answer 204 whatever the row's previous
 * state, so a client can replay them (an offline queue, a retry after a
 * timeout) without first asking what the server holds.
 *
 * The database is injected so the routes can be tested end to end without a
 * live Postgres (tests/saved-articles.test.ts); student.ts passes the real
 * client.
 */

export type SavedArticlesDb = Pick<PrismaClient, 'newsArticle' | 'savedArticle'>;

/**
 * A device clock running a little fast must not make a save made "now"
 * unuploadable, so "the future" starts this far past the server's clock. Same
 * tolerance as course notes.
 */
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The optional body of a PUT. `createdAt` lets the app upload the saves it
 * already holds locally with the date they were made; ISO 8601 with an offset
 * or Z, as the app's `new Date().toISOString()` writes.
 */
const putSchema = z.object({
  createdAt: z.string().datetime({ offset: true }).optional(),
});

function articleIdParam(req: Request): string {
  const id = String(req.params.articleId ?? '');
  if (!UUID_RE.test(id)) throw new AppError('Invalid article ID', 400);
  return id;
}

export function createSavedArticlesRouter(
  db: SavedArticlesDb,
  writeLimiter: RequestHandler
): Router {
  const router = Router();

  // ── GET /student/saved-articles ─────────────────────────────────────────────
  // The student's saves, newest first. The id breaks a tie between two saves
  // made in the same millisecond, so the order never depends on the database.
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = await db.savedArticle.findMany({
        where: { studentId: req.studentId! },
        select: { articleId: true, createdAt: true },
        orderBy: [{ createdAt: 'desc' }, { articleId: 'desc' }],
      });
      res.status(200).json({
        savedArticles: rows.map((r) => ({
          articleId: r.articleId,
          createdAt: r.createdAt.toISOString(),
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  // ── PUT /student/saved-articles/:articleId ──────────────────────────────────
  router.put('/:articleId', writeLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const studentId = req.studentId!;
      const articleId = articleIdParam(req);

      const parsed = putSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        // A fixed sentence: zod's own message can echo the offending value.
        throw new AppError('Invalid createdAt', 400);
      }

      let created: Date | undefined;
      if (parsed.data.createdAt !== undefined) {
        created = new Date(parsed.data.createdAt);
        if (created.getTime() > Date.now() + FUTURE_TOLERANCE_MS) {
          throw new AppError('createdAt cannot be in the future', 400);
        }
      }

      /*
       * Published means `publishedAt` has been reached: an article dated in the
       * future is a scheduled one, not yet out. NewsArticle has no other status.
       * An unknown and an unpublished article answer the same 404, so the API
       * never confirms that a scheduled article exists.
       */
      const article = await db.newsArticle.findFirst({
        where: { id: articleId, publishedAt: { lte: new Date() } },
        select: { id: true },
      });
      if (!article) throw new AppError('Article not found', 404);

      /*
       * INSERT ... ON CONFLICT DO NOTHING. Saving an article already saved
       * keeps the first row and its date, and two concurrent saves cannot both
       * insert or fail on the primary key — there is no read-then-write window.
       */
      await db.savedArticle.createMany({
        data: [{ studentId, articleId, ...(created ? { createdAt: created } : {}) }],
        skipDuplicates: true,
      });

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  // ── DELETE /student/saved-articles/:articleId ───────────────────────────────
  // deleteMany scoped to the student: removes their save if there is one, and
  // is a no-op otherwise — 204 either way. No article lookup: unsaving an
  // article that has since been deleted (or never existed) is still "not saved".
  router.delete('/:articleId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const articleId = articleIdParam(req);
      await db.savedArticle.deleteMany({ where: { studentId: req.studentId!, articleId } });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  });

  return router;
}
