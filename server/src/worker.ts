import { httpServerHandler } from 'cloudflare:node';

function forceCloudflarePg(): void {
  try {
    Object.defineProperty(globalThis.navigator, 'userAgent', {
      get: () => 'Cloudflare-Workers',
      configurable: true
    });
  } catch {
    Object.defineProperty(globalThis, 'navigator', {
      value: { userAgent: 'Cloudflare-Workers' },
      configurable: true
    });
  }
}

let handler: { fetch: (request: Request, env?: unknown, ctx?: unknown) => Promise<Response> } | null = null;
let isListening = false;

async function getHandler(): Promise<{ fetch: (request: Request, env?: unknown, ctx?: unknown) => Promise<Response> }> {
  if (!handler) {
    const { app } = await import('./app');
    if (!isListening) {
      try {
        app.listen(5000);
        isListening = true;
      } catch {
        isListening = true;
      }
    }
    handler = httpServerHandler({ port: 5000 });
  }
  return handler!;
}

export default {
  // Cron keepalive: runs every 4 minutes to prevent cold starts.
  // Fires a lightweight DB ping so the Worker isolate stays warm and
  // subsequent user requests avoid the 12-25s TCP+TLS handshake.
  async scheduled(_event: unknown, env: unknown, _ctx: unknown): Promise<void> {
    try {
      if (env && typeof env === 'object') {
        Object.assign(process.env, env);
      }
      forceCloudflarePg();
      // Import prisma lazily and run a trivial query to warm the connection pool
      const { getPrismaInstance, ensureCleanPoolState } = await import('./prisma');
      ensureCleanPoolState();
      const instance = getPrismaInstance();
      await instance.client.$queryRawUnsafe('SELECT 1');
      console.log('✅ [Cron Keepalive] Pool warmed successfully');
    } catch (err: any) {
      console.warn('⚠️ [Cron Keepalive] Warmup query failed:', err?.message || err);
    }
  },

  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    if (env && typeof env === 'object') {
      Object.assign(process.env, env);
    }
    forceCloudflarePg();

    // Fast-path OPTIONS preflight response (<15ms)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    try {
      const h = await getHandler();
      let timer: any;
      const timeoutPromise = new Promise<Response>((_, reject) => {
        timer = setTimeout(() => {
          const timeoutErr: any = new Error('The request timed out after 45s waiting for the backend service.');
          timeoutErr.name = 'TimeoutError';
          timeoutErr.status = 504;
          reject(timeoutErr);
        }, 45000);
      });

      return await Promise.race([h.fetch(request, env, ctx), timeoutPromise]).finally(() => clearTimeout(timer));
    } catch (err: any) {
      console.error('⚠️ Worker unhandled fetch error:', err?.message || err);
      const isTimeout = err?.name === 'TimeoutError' || err?.status === 504 || String(err?.message || '').includes('timed out');
      const isDbConn =
        String(err?.name || '') === 'DatabaseConnectionError' ||
        String(err?.message || '').includes('database') ||
        String(err?.message || '').includes('unreachable') ||
        String(err?.message || '').includes('Connection terminated') ||
        String(err?.message || '').includes('socket hang up') ||
        String(err?.message || '').includes('ECONNRESET');
      const status = isTimeout ? 504 : isDbConn ? 503 : 500;
      const errorMsg = isTimeout
        ? 'The request took too long to complete. Please retry in a few moments.'
        : isDbConn
          ? 'The database connection is temporarily unavailable or busy. Please retry in a few moments.'
          : 'The backend service encountered a temporary connection issue. Please retry.';
      return new Response(
        JSON.stringify({
          success: false,
          error: errorMsg
        }),
        {
          status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
          }
        }
      );
    }
  }
};
