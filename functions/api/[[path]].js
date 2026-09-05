export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
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

  const incoming = new URL(context.request.url);
  const target = `https://academy-api.adnanfree132.workers.dev${incoming.pathname}${incoming.search}`;

  const headers = new Headers(context.request.headers);
  headers.set('Host', 'academy-api.adnanfree132.workers.dev');

  const init = {
    method: context.request.method,
    headers: headers,
    redirect: 'manual'
  };
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = context.request.body;
    init.duplex = 'half';
  }
  return fetch(target, init);
}
