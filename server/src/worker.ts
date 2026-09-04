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

export default {
  async fetch(request: Request, env: unknown, ctx: unknown): Promise<Response> {
    forceCloudflarePg();
    if (!handler) {
      const { app } = await import('./app');
      app.listen(5000);
      handler = httpServerHandler({ port: 5000 });
    }
    return handler.fetch(request, env, ctx);
  }
};
