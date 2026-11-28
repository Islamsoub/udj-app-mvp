import { env } from './utils/env';
import prisma from './utils/prisma';
import app from './app';

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
