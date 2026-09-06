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

  let bodyData = null;
  if (context.request.method !== 'GET' && context.request.method !== 'HEAD') {
    bodyData = await context.request.arrayBuffer();
  }

  const doFetch = async () => {
    const init = {
      method: context.request.method,
      headers: headers,
      redirect: 'manual'
    };
    if (bodyData) {
      init.body = bodyData;
    }
    return fetch(target, init);
  };

  try {
    let res = await doFetch();
    // If backend returns 502/503 during cold-start or isolate recycling, perform one fast retry
    if (res.status === 502 || res.status === 503) {
      await new Promise(r => setTimeout(r, 400));
      try {
        const retryRes = await doFetch();
        if (retryRes.ok || retryRes.status < 500) return retryRes;
      } catch {}
    }
    return res;
  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Backend API service is warming up. Please retry in a moment.'
    }), {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
