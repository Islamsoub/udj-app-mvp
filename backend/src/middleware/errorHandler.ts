import { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode: number = err.statusCode ?? 500;
  const timestamp = new Date().toISOString();

  console.error(`[${timestamp}] ERROR ${statusCode}: ${err.message}`);
  if (err.stack) console.error(err.stack);

  if (process.env.NODE_ENV === 'production') {
    res.status(statusCode).json({ error: err.message });
  } else {
    res.status(statusCode).json({ error: err.message, stack: err.stack });
  }
};
