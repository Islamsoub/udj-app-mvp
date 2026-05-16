import { env } from './utils/env';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { logger } from './middleware/logger';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import prisma from './utils/prisma';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? ['https://your-app-domain.com']
    : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use(express.json());
app.use(logger);
app.use(globalRateLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
