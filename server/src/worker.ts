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

async function getHandler() {
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
  return handler;
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    forceCloudflarePg();
    try {
      const h = await getHandler();
      return await h.fetch(request, env, ctx);
    } catch (err: any) {
      console.error('⚠️ Worker unhandled fetch error:', err?.message || err);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'The backend service encountered a temporary connection issue. Please retry.'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      );
    }
  }
};
