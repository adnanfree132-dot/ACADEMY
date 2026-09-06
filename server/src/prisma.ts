import 'pg-cloudflare';
import { AsyncLocalStorage } from 'node:async_hooks';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, PoolConfig } from 'pg';
import type { Request, Response, NextFunction } from 'express';

export class DatabaseConnectionError extends Error {
  status: number;
  constructor(message = 'The database connection is temporarily unavailable or busy. Please retry in a few moments.') {
    super(message);
    this.name = 'DatabaseConnectionError';
    this.status = 503;
  }
}

export interface PrismaInstance {
  client: PrismaClient;
  pool?: Pool;
}

export const prismaAls = new AsyncLocalStorage<PrismaClient>();

let cachedInstance: PrismaInstance | null = null;

export function withTimeout<T>(promise: Promise<T>, ms = 6000, opName = 'Database query'): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => {
      const err: any = new Error(`${opName} timed out after ${ms}ms`);
      err.name = 'DatabaseTimeoutError';
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export function isWasmTrapOrSocketDrop(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err);
  const name = String(err.name || '');
  return (
    name === 'RuntimeError' ||
    name === 'DatabaseConnectionError' ||
    name === 'DatabaseTimeoutError' ||
    msg.includes('timed out') ||
    msg.includes('unreachable') ||
    msg.includes('Query engine') ||
    msg.includes('Connection terminated') ||
    msg.includes('connection closed') ||
    msg.includes('socket hang up') ||
    msg.includes('ECONNRESET') ||
    msg.includes('EPIPE') ||
    msg.includes('pool timeout') ||
    msg.includes("Can't reach database") ||
    msg.includes('connection limit exceeded') ||
    msg.includes('terminating connection') ||
    msg.includes('Cannot use a pool')
  );
}

export function resetPrismaInstance(): void {
  if (cachedInstance) {
    console.warn('🔄 [Prisma Wasm Boundary] Resetting poisoned or closed Prisma instance...');
    const oldPool = cachedInstance.pool;
    const oldClient = cachedInstance.client;
    cachedInstance = null;
    try {
      oldClient.$disconnect().catch(() => {});
      if (oldPool) {
        oldPool.end().catch(() => {});
      }
    } catch {}
  }
}

export function resolveDatabaseConfig(): { connectionString: string; maxConnections: number; isPgBouncer: boolean } {
  // Use DATABASE_URL (transaction mode pooler on port 6543) with DIRECT_URL as fallback
  let url = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
  if (!url) {
    throw new DatabaseConnectionError('Database configuration missing. DATABASE_URL is not set.');
  }

  const isPgBouncer = url.includes(':6543') || process.env.USE_PGBOUNCER === 'true';
  if (isPgBouncer && !url.includes('pgbouncer=true')) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}pgbouncer=true`;
  }

  let parsedLimit = 4;
  try {
    const urlObj = new URL(url);
    const limitParam = urlObj.searchParams.get('connection_limit');
    if (limitParam) {
      const parsed = parseInt(limitParam, 10);
      if (!isNaN(parsed) && parsed > 0) {
        parsedLimit = Math.min(parsed, 10);
      }
    }
  } catch {}

  const envMax = process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : undefined;
  const maxConnections =
    envMax && !isNaN(envMax)
      ? envMax
      : process.env.CLOUDFLARE_WORKER === '1'
        ? Math.min(parsedLimit, 4)
        : 10;

  return { connectionString: url, maxConnections, isPgBouncer };
}

export function drainIdleClients(pool: Pool): void {
  try {
    const p = pool as any;
    if (Array.isArray(p._idle)) {
      while (p._idle.length > 0) {
        const item = p._idle.pop();
        if (item && item.client) {
          try {
            clearTimeout(item.timeoutId);
          } catch {}
          p._remove(item.client);
          try {
            item.client.end();
          } catch {}
        }
      }
    }
  } catch {}
}

export function createPrismaInstance(): PrismaInstance {
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (url) {
    const { connectionString, maxConnections } = resolveDatabaseConfig();
    const useSsl = process.env.DB_SSL === 'true';

    const poolConfig: PoolConfig = {
      connectionString,
      max: Math.min(maxConnections, 2),
      idleTimeoutMillis: 1000,
      connectionTimeoutMillis: 6000,
      allowExitOnIdle: true,
      ssl: useSsl ? { rejectUnauthorized: false } : false
    };

    const pool = new Pool(poolConfig);
    pool.on('error', (err) => {
      console.warn('⚠️ [pg pool error]:', err?.message || err);
    });

    const adapter = new PrismaPg(pool);
    const client = new PrismaClient({ adapter, log: ['error', 'warn'] });
    return { client, pool };
  }

  const client = new PrismaClient({ log: ['error', 'warn'] });
  return { client };
}

export function getPrismaInstance(): PrismaInstance {
  if (!cachedInstance) {
    cachedInstance = createPrismaInstance();
  }
  return cachedInstance;
}

export function getActiveClient(): PrismaClient {
  return prismaAls.getStore() || getPrismaInstance().client;
}

export async function executeWithResilience<T>(fn: (client: PrismaClient) => Promise<T>): Promise<T> {
  const client = getActiveClient();
  try {
    return await fn(client);
  } catch (err: any) {
    if (isWasmTrapOrSocketDrop(err)) {
      console.warn('⚠️ [Prisma Wasm Boundary] Caught trap / socket reset:', err?.message || err);
      throw new DatabaseConnectionError(
        'The database connection is temporarily unavailable or busy. Please retry in a few moments.'
      );
    }
    throw err;
  }
}

// Request-scoped Prisma instance with guaranteed isolate cleanup on response completion
export function attachRequestPrisma(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'OPTIONS' || req.path === '/health' || req.path === '/api/v1/health') {
    next();
    return;
  }

  const instance = createPrismaInstance();
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    try {
      instance.client.$disconnect().catch(() => {});
      if (instance.pool) {
        instance.pool.end().catch(() => {});
      }
    } catch {}
  };

  res.once('finish', release);
  res.once('close', release);

  prismaAls.run(instance.client, () => next());
}

// Resilient Request-Aware Prisma Client Proxy
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getActiveClient();
    if (typeof prop === 'symbol') {
      return (client as any)[prop];
    }

    if (prop === '$transaction') {
      return async (arg: unknown, options?: unknown) => {
        const c = getActiveClient();
        if (typeof arg === 'function') {
          return (c as any).$transaction(async (tx: PrismaClient) => {
            return (arg as (tx: PrismaClient) => Promise<unknown>)(tx);
          }, options);
        }
        return (c as any).$transaction(arg, options);
      };
    }

    if (typeof prop === 'string' && prop.startsWith('$')) {
      const method = (client as any)[prop];
      if (typeof method === 'function') {
        return (...args: any[]) => {
          const c = getActiveClient();
          return (c as any)[prop](...args);
        };
      }
      return method;
    }

    const delegate = (client as any)[prop];
    if (typeof delegate === 'object' && delegate !== null) {
      return new Proxy(delegate, {
        get(modelTarget, modelProp: string | symbol) {
          const originalMethod = modelTarget[modelProp];
          if (typeof originalMethod === 'function') {
            return (...args: any[]) => {
              const c = getActiveClient();
              const activeDelegate = (c as any)[prop];
              return activeDelegate[modelProp](...args);
            };
          }
          return originalMethod;
        }
      });
    }

    if (typeof delegate === 'function') {
      return (...args: any[]) => {
        const c = getActiveClient();
        return (c as any)[prop](...args);
      };
    }

    return delegate;
  }
}) as PrismaClient;

const globalForPrisma = global as unknown as { prisma?: PrismaClient };
export const localPrisma: PrismaClient = globalForPrisma.prisma ?? prisma;
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = localPrisma;
}

export default prisma;

