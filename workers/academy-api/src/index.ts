export interface Env {
  API_ORIGIN: string;
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const origin = (env.API_ORIGIN || '').replace(/\/$/, '');
    if (!origin) {
      return Response.json(
        { success: false, error: 'API origin is not configured' },
        { status: 503, headers: corsHeaders() }
      );
    }

    const incoming = new URL(request.url);
    const target = new URL(incoming.pathname + incoming.search, origin);
    const headers = new Headers(request.headers);
    headers.set('Host', new URL(origin).host);
    headers.delete('cf-connecting-ip');
    headers.delete('cf-ray');
    headers.delete('cf-visitor');
    headers.delete('cf-ew-via');
    headers.delete('x-forwarded-proto');

    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: 'manual'
    };
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body;
      (init as { duplex?: string }).duplex = 'half';
    }

    try {
      const upstream = await fetch(target.toString(), init);
      const outHeaders = new Headers(upstream.headers);
      outHeaders.set('Access-Control-Allow-Origin', '*');
      outHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      outHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: outHeaders
      });
    } catch (err) {
      return Response.json(
        { success: false, error: 'Save server is offline' },
        { status: 502, headers: corsHeaders() }
      );
    }
  }
};
