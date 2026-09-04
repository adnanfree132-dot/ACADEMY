import 'pg-cloudflare';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

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

export const prisma: PrismaClient =
  process.env.CLOUDFLARE_WORKER === '1'
    ? (new Proxy({} as PrismaClient, {
        get(_target, prop) {
          return (createPrisma() as any)[prop];
        }
      }) as PrismaClient)
    : localPrisma;

export default prisma;
