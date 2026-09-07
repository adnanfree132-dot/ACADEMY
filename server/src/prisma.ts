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

export function withTimeout<T>(promise: Promise<T>, ms = 20000, opName = 'Database query'): Promise<T> {
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
  // IMPORTANT: Timeouts are transient queuing delays and must NEVER destroy the shared pool.
  // Only actual socket closures, network resets, or Wasm traps should recycle the pool.
  return (
    name === 'RuntimeError' ||
    msg.includes('unreachable') ||
    msg.includes('Query engine') ||
    msg.includes('Connection terminated') ||
    msg.includes('connection closed') ||
    msg.includes('socket hang up') ||
    msg.includes('ECONNRESET') ||
    msg.includes('EPIPE') ||
    msg.includes("Can't reach database") ||
    msg.includes('terminating connection') ||
    msg.includes('Cannot use a pool') ||
    msg.includes('Connection closed unexpectedly') ||
    msg.includes('timeout exceeded when trying to connect')
  );
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

let lastActiveTimestamp = Date.now();

export function ensureCleanPoolState(): void {
  const now = Date.now();
  // If more than 30s elapsed since the last query/request, the Cloudflare Worker isolate was likely frozen.
  // Any idle sockets created before the freeze are dead on the wire and must be discarded.
  if (now - lastActiveTimestamp > 30000 && cachedInstance?.pool) {
    drainIdleClients(cachedInstance.pool);
  }
  lastActiveTimestamp = now;
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

  // Mandatory for Supabase serverless/edge: port 6543 is transaction mode with PgBouncer.
  // Port 5432 is session mode which exhausts connections and causes 15s-25s connection queue hangs.
  if (url.includes('pooler.supabase.com:5432')) {
    url = url.replace('pooler.supabase.com:5432', 'pooler.supabase.com:6543');
  }

  const isPgBouncer = url.includes(':6543') || url.includes('pgbouncer=true') || process.env.USE_PGBOUNCER === 'true';
  if (isPgBouncer && !url.includes('pgbouncer=true')) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}pgbouncer=true`;
  }

  try {
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.delete('connection_limit');
    parsedUrl.searchParams.delete('pool_timeout');
    url = parsedUrl.toString();
  } catch {}

  const isCloudflare = process.env.CLOUDFLARE_WORKER === '1';
  const envMax = process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : undefined;
  const maxConnections = envMax && !isNaN(envMax) ? envMax : isCloudflare ? 4 : 10;

  return { connectionString: url, maxConnections, isPgBouncer };
}

export function createPrismaInstance(): PrismaInstance {
  const url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (url) {
    const { connectionString, maxConnections } = resolveDatabaseConfig();
    const useSsl = process.env.DB_SSL === 'true';

    const poolConfig: PoolConfig = {
      connectionString,
      max: maxConnections,
      idleTimeoutMillis: 20000, // Keep connection alive for 20s so subsequent queries reuse warm socket
      connectionTimeoutMillis: 6000,
      allowExitOnIdle: true,
      ssl: useSsl ? { rejectUnauthorized: false } : false
    };

    const pool = new Pool(poolConfig);
    pool.on('error', (err) => {
      console.warn('⚠️ [pg pool background error]:', err?.message || err);
      // Stale or closed socket purged by pg-pool; do NOT reset cachedInstance as it disrupts other active requests
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
  ensureCleanPoolState();
  return prismaAls.getStore() || getPrismaInstance().client;
}

export async function executeWithResilience<T>(fn: (client: PrismaClient) => Promise<T>): Promise<T> {
  let client = getActiveClient();
  try {
    return await withTimeout(fn(client), 14000);
  } catch (err: any) {
    if (isWasmTrapOrSocketDrop(err)) {
      console.warn('⚠️ [Prisma Wasm Boundary] Caught socket drop or trap, draining idle connections and retrying...', err?.message || err);
      if (cachedInstance?.pool) {
        drainIdleClients(cachedInstance.pool);
      }
      client = getActiveClient();
      try {
        return await withTimeout(fn(client), 14000, 'Database retry query');
      } catch (retryErr: any) {
        console.error('❌ [Prisma Wasm Boundary] Second attempt failed:', retryErr?.message || retryErr);
        if (String(retryErr?.name || '') === 'RuntimeError' || String(retryErr?.message || '').includes('unreachable')) {
          resetPrismaInstance();
        }
        throw new DatabaseConnectionError(
          'The database connection is temporarily unavailable or busy. Please retry in a few moments.'
        );
      }
    }
    if (err?.name === 'DatabaseTimeoutError' || String(err?.message || '').includes('timed out')) {
      throw new DatabaseConnectionError(
        'The database connection is temporarily busy. Please retry in a few moments.'
      );
    }
    throw err;
  }
}

// Request-scoped pool health validation: ensures no stale isolate-freeze sockets are reused
export function attachRequestPrisma(_req: Request, res: Response, next: NextFunction) {
  if (cachedInstance?.pool) {
    drainIdleClients(cachedInstance.pool);
  }
  res.on('finish', () => {
    if (cachedInstance?.pool) {
      drainIdleClients(cachedInstance.pool);
    }
  });
  next();
}

// Resilient Request-Aware Prisma Client Proxy with transparent retry on all operations
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getActiveClient();
    if (typeof prop === 'symbol') {
      return (client as any)[prop];
    }

    if (prop === '$transaction') {
      return async (arg: unknown, options?: unknown) => {
        return executeWithResilience(async (c) => {
          if (typeof arg === 'function') {
            return (c as any).$transaction(async (tx: PrismaClient) => {
              return (arg as (tx: PrismaClient) => Promise<unknown>)(tx);
            }, options);
          }
          return (c as any).$transaction(arg, options);
        });
      };
    }

    if (typeof prop === 'string' && prop.startsWith('$')) {
      const method = (client as any)[prop];
      if (typeof method === 'function') {
        return (...args: any[]) => {
          return executeWithResilience((c) => (c as any)[prop](...args));
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
              return executeWithResilience((c) => {
                const activeDelegate = (c as any)[prop];
                return activeDelegate[modelProp](...args);
              });
            };
          }
          return originalMethod;
        }
      });
    }

    if (typeof delegate === 'function') {
      return (...args: any[]) => {
        return executeWithResilience((c) => (c as any)[prop](...args));
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

