/**
 * The Express app, without listening. index.ts starts it; tests import it and
 * listen on a random port, so they exercise the real middleware order.
 */
import { env } from './utils/env';
import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger } from './middleware/logger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { noStore } from './middleware/noStore';
import authRouter from './routes/auth';
import studentRouter from './routes/student';
import newsRouter from './routes/news';
import adminRouter from './routes/admin';

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Scoped to styles: the public privacy-policy page uses inline <style>.
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
    },
  },
}));
// `credentials: true` is required so the browser sends the admin refresh-token
// cookie. That combination forbids `origin: '*'`, so the allowlist comes from
// ADMIN_CORS_ORIGIN (required at boot — see utils/env.ts).
app.use(cors({
  origin: env.ADMIN_CORS_ORIGIN,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(logger);
app.use(globalRateLimiter);

// Public static files — no auth required (Play Store privacy policy URL)
// public/ is copied into dist/ during build so the path is self-contained
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Personal data: never cached by the browser or a proxy (middleware/noStore.ts).
app.use(['/auth', '/student', '/news', '/admin'], noStore);

app.use('/auth', authRouter);
app.use('/student', studentRouter);
app.use('/news', newsRouter);
app.use('/admin', adminRouter);

app.use(errorHandler);

export default app;
