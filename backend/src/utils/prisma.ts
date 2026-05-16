import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? (['query', 'warn', 'error'] as const)
    : (['error'] as const),
});

export default prisma;
