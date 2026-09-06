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

  // Single buffered pass-through with ZERO retries
  try {
    const res = await fetch(target, {
      method: context.request.method,
      headers,
      body: bodyData,
      redirect: 'manual'
    });

    const responseBody = await res.arrayBuffer();
    const responseHeaders = new Headers(res.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    responseHeaders.delete('content-length');
    responseHeaders.delete('content-encoding');

    return new Response(responseBody, {
      status: res.status,
      headers: responseHeaders
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Unable to reach the backend API service. Please verify your connection or try again.'
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        }
      }
    );
  }
}

