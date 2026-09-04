export async function onRequest(context) {
  const incoming = new URL(context.request.url);
  const target = `https://academy-api.adnanfree132.workers.dev${incoming.pathname}${incoming.search}`;
  const init = {
    method: context.request.method,
    headers: context.request.headers,
    redirect: 'manual'
  };
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    init.body = context.request.body;
    init.duplex = 'half';
  }
  return fetch(target, init);
}
