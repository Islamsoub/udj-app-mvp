import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AdminRole } from '@prisma/client';
import prisma from '../../utils/prisma';
import { AppError } from '../../utils/AppError';
import adminAuth from '../../middleware/adminAuth';
import { rbac } from '../../middleware/rbac';
import { audit } from '../../middleware/auditLog';

/**
 * News category CRUD (architecture doc §7.2). Mounted at /admin/news/categories
 * (registered BEFORE the /admin/news router so `/categories` is not swallowed by
 * the news `GET /:id` route). Categories are admin-managed from Settings and
 * replace the previously-hardcoded filter chips in the mobile app.
 */
const router = Router();

const ALL_ROLES: AdminRole[] = [
  AdminRole.SUPER_ADMIN,
  AdminRole.FACULTY_ADMIN,
  AdminRole.REGISTRAR,
  AdminRole.NEWS_EDITOR,
];
const EDIT_ROLES: AdminRole[] = [AdminRole.SUPER_ADMIN, AdminRole.NEWS_EDITOR];

// Combining diacritical marks (U+0300–U+036F). Built via RegExp constructor so
// the source stays ASCII-only.
const DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

// nameFr → url-safe slug (accents stripped). Falls back to "categorie".
function slugify(input: string): string {
  const base = input
    .normalize('NFD')
    .replace(DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'categorie';
}

// Ensures slug uniqueness by appending -2, -3, … on collision.
async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop
  while (await prisma.newsCategory.findUnique({ where: { slug } })) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

// ─── GET /admin/news/categories ──────────────────────────────────────────────
router.get('/', adminAuth, rbac(...ALL_ROLES), async (_req, res, next) => {
  try {
    const categories = await prisma.newsCategory.findMany({
      orderBy: [{ displayOrder: 'asc' }, { nameFr: 'asc' }],
    });
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
});

// ─── POST /admin/news/categories ─────────────────────────────────────────────
const createSchema = z.object({
  nameFr: z.string().trim().min(1),
  displayOrder: z.number().int().optional(),
});

router.post(
  '/',
  adminAuth,
  rbac(...EDIT_ROLES),
  audit('news.category.create', 'NewsCategory'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Nom de catégorie requis', 400);
      const { nameFr, displayOrder } = parsed.data;

      const slug = await uniqueSlug(slugify(nameFr));
      const order = displayOrder ?? (await prisma.newsCategory.count());

      const category = await prisma.newsCategory.create({
        data: { nameFr, slug, displayOrder: order },
      });
      res.status(201).json(category);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /admin/news/categories/reorder ────────────────────────────────────
// Body: [{ id, displayOrder }] (or { items: [...] }) — drag-and-drop reorder.
// Registered before /:id so "reorder" is not treated as an id.
const reorderSchema = z.object({
  items: z
    .array(z.object({ id: z.string().uuid(), displayOrder: z.number().int() }))
    .min(1),
});

router.patch(
  '/reorder',
  adminAuth,
  rbac(...EDIT_ROLES),
  audit('news.category.reorder', 'NewsCategory'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const raw = Array.isArray(req.body) ? { items: req.body } : req.body;
      const parsed = reorderSchema.safeParse(raw);
      if (!parsed.success) throw new AppError('Payload de réordonnancement invalide', 400);

      await prisma.$transaction(
        parsed.data.items.map((i) =>
          prisma.newsCategory.update({
            where: { id: i.id },
            data: { displayOrder: i.displayOrder },
          })
        )
      );

      const categories = await prisma.newsCategory.findMany({
        orderBy: [{ displayOrder: 'asc' }, { nameFr: 'asc' }],
      });
      res.status(200).json(categories);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /admin/news/categories/:id ────────────────────────────────────────
const updateSchema = z
  .object({
    nameFr: z.string().trim().min(1).optional(),
    displayOrder: z.number().int().optional(),
  })
  .refine((d) => d.nameFr !== undefined || d.displayOrder !== undefined, {
    message: 'Aucune modification fournie',
  });

router.patch(
  '/:id',
  adminAuth,
  rbac(...EDIT_ROLES),
  audit('news.category.update', 'NewsCategory'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError('Modification de catégorie invalide', 400);

      const existing = await prisma.newsCategory.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Catégorie introuvable', 404);

      // Slug stays stable on rename — articles reference it by string.
      const category = await prisma.newsCategory.update({
        where: { id: existing.id },
        data: {
          ...(parsed.data.nameFr !== undefined ? { nameFr: parsed.data.nameFr } : {}),
          ...(parsed.data.displayOrder !== undefined ? { displayOrder: parsed.data.displayOrder } : {}),
        },
      });
      res.status(200).json(category);
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /admin/news/categories/:id ───────────────────────────────────────
// Blocked (409) while any article references the category — by the relation
// (categoryId) OR by the legacy `category` slug string.
router.delete(
  '/:id',
  adminAuth,
  rbac(...EDIT_ROLES),
  audit('news.category.delete', 'NewsCategory'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await prisma.newsCategory.findUnique({ where: { id: String(req.params.id) } });
      if (!existing) throw new AppError('Catégorie introuvable', 404);

      const referencing = await prisma.newsArticle.count({
        where: { OR: [{ categoryId: existing.id }, { category: existing.slug }] },
      });
      if (referencing > 0) {
        throw new AppError(
          `Impossible de supprimer : ${referencing} article(s) utilisent cette catégorie`,
          409
        );
      }

      await prisma.newsCategory.delete({ where: { id: existing.id } });
      res.status(200).json({ id: existing.id, deleted: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
