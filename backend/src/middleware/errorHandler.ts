import { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';

/**
 * Errors whose MESSAGE can quote what the client sent, which this handler must
 * therefore never write to the log. Student-authored text (course notes,
 * justification reasons) reaches the server in request bodies, and Render keeps
 * whatever is printed here.
 *
 *   - express.json() parse failures (type 'entity.parse.failed'). Node's
 *     JSON.parse message quotes the start of the input — a body of
 *     `"my note` fails with `Unexpected token '"', ""my note"... is not valid
 *     JSON` — and body-parser also attaches the raw body as `err.body`.
 *   - Prisma validation errors. Their message prints the whole query call,
 *     arguments included, so a bad create would log the row it was given.
 *
 * For these the log gets a fixed label and the stack frames without the
 * message line. The response is unchanged: the client sees its own input.
 */
function loggableMessage(err: any): string | null {
  if (err?.type === 'entity.parse.failed') return 'Malformed JSON body (content withheld)';
  if (err instanceof Prisma.PrismaClientValidationError) {
    return 'Prisma validation error (query arguments withheld)';
  }
  return null;
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode: number = err.statusCode ?? 500;
  const timestamp = new Date().toISOString();

  const withheld = loggableMessage(err);
  if (withheld) {
    console.error(`[${timestamp}] ERROR ${statusCode}: ${withheld}`);
    // A V8 stack is "Name: message" — which can run over many lines, Prisma's
    // does — followed by "    at ..." frames. Only the frames are kept; they
    // name code, never input.
    if (err.stack) {
      const frames = String(err.stack)
        .split('\n')
        .filter((line) => /^\s+at /.test(line));
      if (frames.length > 0) console.error(frames.join('\n'));
    }
  } else {
    console.error(`[${timestamp}] ERROR ${statusCode}: ${err.message}`);
    if (err.stack) console.error(err.stack);
  }

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
