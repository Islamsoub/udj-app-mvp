import type { RequestHandler } from 'express';

/**
 * Every API answer is about one signed-in person: their grades, attendance,
 * notifications, tokens. None of it may be kept by the browser's HTTP cache
 * (readable by the next person on a shared or lab computer, and by the Back
 * button after sign-out) or by any proxy in between.
 *
 * Express sends no Cache-Control on JSON by default, which leaves the decision
 * to heuristics. `private, no-store` takes it away. Mounted on the API routers
 * only — /health and the /public static files are not personal.
 */
export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'private, no-store');
  next();
};
