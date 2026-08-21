import { env } from './utils/env';
import path from 'path';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger } from './middleware/logger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import prisma from './utils/prisma';
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

app.use('/auth', authRouter);
app.use('/student', studentRouter);
app.use('/news', newsRouter);
app.use('/admin', adminRouter);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`[${new Date().toISOString()}] Unipocket API running on port ${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = async () => {
  console.log('[shutdown] Graceful shutdown initiated');
  server.close(async () => {
    await prisma.$disconnect();
    console.log('[shutdown] Database disconnected');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
