import 'pg-cloudflare';
import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import type { Request, Response, NextFunction } from 'express';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prismaAls = new AsyncLocalStorage<PrismaClient>();

function createPrisma(): PrismaClient {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (process.env.CLOUDFLARE_WORKER === '1' && url) {
    const pool = new Pool({
      connectionString: url,
      max: 1,
      idleTimeoutMillis: 1,
      connectionTimeoutMillis: 15000,
      allowExitOnIdle: true,
      ssl: false
    });
    pool.on('error', (err) => {
      console.error('pg pool error', err?.message || err);
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter, log: ['error', 'warn'] });
  }
  return new PrismaClient({ log: ['error', 'warn'] });
}

const localPrisma = globalForPrisma.prisma ?? createPrisma();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = localPrisma;
}

export function attachRequestPrisma(req: Request, res: Response, next: NextFunction) {
  if (process.env.CLOUDFLARE_WORKER !== '1') {
    next();
    return;
  }
  const client = createPrisma();
  const release = () => {
    client.$disconnect().catch(() => {});
  };
  res.on('finish', release);
  res.on('close', release);
  prismaAls.run(client, () => next());
}

export const prisma: PrismaClient =
  process.env.CLOUDFLARE_WORKER === '1'
    ? (new Proxy({} as PrismaClient, {
        get(_target, prop) {
          const store = prismaAls.getStore();
          return ((store || createPrisma()) as any)[prop];
        }
      }) as PrismaClient)
    : localPrisma;

export default prisma;
