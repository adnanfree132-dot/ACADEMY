import 'pg-cloudflare';
import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import type { Request, Response, NextFunction } from 'express';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
const prismaAls = new AsyncLocalStorage<PrismaClient>();

interface PrismaInstance {
  client: PrismaClient;
  pool?: Pool;
}

function createPrismaInstance(): PrismaInstance {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (process.env.CLOUDFLARE_WORKER === '1' && url) {
    const pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
      allowExitOnIdle: true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });
    pool.on('error', (err) => {
      console.error('pg pool error', err?.message || err);
    });
    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter, log: ['error', 'warn'] });
    return { client, pool };
  }
  const client = new PrismaClient({ log: ['error', 'warn'] });
  return { client };
}

function createPrisma(): PrismaClient {
  return createPrismaInstance().client;
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
  const { client, pool } = createPrismaInstance();
  const release = () => {
    client.$disconnect().catch(() => {});
    if (pool) {
      pool.end().catch(() => {});
    }
  };
  res.on('finish', release);
  res.on('close', release);
  prismaAls.run(client, () => next());
}

export const prisma: PrismaClient =
  process.env.CLOUDFLARE_WORKER === '1'
    ? (new Proxy({} as PrismaClient, {
        get(_target, prop) {
          const store = prismaAls.getStore() || createPrisma();
          if (prop === '$transaction') {
            return async (arg: unknown, options?: unknown) => {
              if (Array.isArray(arg)) {
                return (store as any).$transaction(arg, options);
              }
              if (typeof arg === 'function') {
                return (arg as (tx: PrismaClient) => Promise<unknown>)(store);
              }
              return (store as any).$transaction(arg, options);
            };
          }
          return (store as any)[prop];
        }
      }) as PrismaClient)
    : localPrisma;

export default prisma;
