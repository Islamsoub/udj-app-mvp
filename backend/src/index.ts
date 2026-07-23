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
  contentSecurityPolicy: false, // allow inline styles on public HTML pages
}));
// `credentials: true` is required so the browser sends the admin refresh-token
// cookie. That combination forbids `origin: '*'`, so dev lists explicit origins.
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? [env.ADMIN_CORS_ORIGIN].filter(Boolean)
    : ['http://localhost:3001', 'http://localhost:3000'],
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
