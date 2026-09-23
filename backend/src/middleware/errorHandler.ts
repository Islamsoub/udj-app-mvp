import { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode: number = err.statusCode ?? 500;
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] ERROR ${statusCode}: ${err.message}`);
  if (err.stack) console.error(err.stack);

  /*
   * The machine-readable code, when the thrower supplied one.
   *
   * GUARDED ON `instanceof AppError`, NOT ON `err.code` BEING TRUTHY, and the
   * distinction is a security one rather than a stylistic one. Plenty of errors
   * that reach here already carry a `code` that is nobody's business outside the
   * server: Node system errors ('ENOENT', 'ECONNREFUSED'), Prisma's known-request
   * codes ('P2002'), multer's ('LIMIT_FILE_SIZE'). A bare `err.code ?? ...`
   * would start leaking all of them into client responses the day this shipped.
   *
   * Only codes this codebase declares deliberately, on an AppError, are
   * published. Every other error keeps the body it has always had.
   */
  const code = err instanceof AppError && err.code ? { code: err.code } : {};

  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({ error: err.message, ...code });
  } else {
    res.status(statusCode).json({ error: err.message, ...code, stack: err.stack });
  }
};
