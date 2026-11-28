import { Router, Request, Response, NextFunction } from 'express';
import { AdminRole } from '@prisma/client';
import adminAuth from '../../middleware/adminAuth';
import { rbac } from '../../middleware/rbac';
import { verifyCard } from '../../utils/studentCard';

/**
 * POST /admin/card/verify — the admin portal's scanner. Same check as the
 * public /verify/card, plus the student's id so the portal can link to the
 * record. A faculty admin gets the link only for students of their faculty;
 * the card's validity itself is not a secret and is shown to every role.
 */
const router = Router();

router.post(
  '/verify',
  adminAuth,
  rbac(AdminRole.SUPER_ADMIN, AdminRole.FACULTY_ADMIN, AdminRole.REGISTRAR, AdminRole.NEWS_EDITOR),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.setHeader('Cache-Control', 'private, no-store');
      const { verdict, holder } = await verifyCard(req.body?.code);
      const scope = req.adminScope?.facultyId ?? null;
      const inScope = !!holder && (scope === null || holder.faculty.id === scope);
      res.status(200).json({ ...verdict, studentId: holder && inScope ? holder.id : null });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
