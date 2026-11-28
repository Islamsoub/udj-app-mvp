import { Router, Request, Response, NextFunction } from 'express';
import { cardVerifyLimiter } from '../middleware/rateLimiter';
import { verifyCard } from '../utils/studentCard';

/**
 * POST /verify/card — public, no sign-in. Body: { code } — the scanned link or
 * bare token. Used by the student website's check page and the app's scanner.
 *
 * Public on purpose: a card is shown to people who have no account (a guard, a
 * library desk, an exam room). It reveals only what the physical card shows —
 * name, photo, number, programme — and only for a genuine, unexpired code.
 * Rate-limited per IP so it cannot be used to probe tokens.
 */
const router = Router();

router.post('/card', cardVerifyLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.setHeader('Cache-Control', 'private, no-store');
    const { verdict } = await verifyCard(req.body?.code);
    res.status(200).json(verdict);
  } catch (err) {
    next(err);
  }
});

export default router;
