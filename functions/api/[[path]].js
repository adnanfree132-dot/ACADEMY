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
    let contentType = res.headers.get('content-type') || '';

    // If backend returns ANY 5xx status (500, 502, 503, 504) or non-JSON during cold-start, auto-retry once
    if (res.status >= 500 || (res.status >= 400 && !contentType.includes('application/json'))) {
      await new Promise(r => setTimeout(r, 450));
      try {
        const retryRes = await doFetch();
        const retryType = retryRes.headers.get('content-type') || '';
        if (retryRes.ok || retryType.includes('application/json')) {
          res = retryRes;
          contentType = retryType;
        }
      } catch {}
    }

    // If the response is still non-JSON or a 5xx error, sanitize it to valid JSON so the UI never receives HTML
    if (!contentType.includes('application/json') && res.status >= 400) {
      return new Response(JSON.stringify({
        success: false,
        error: 'The backend service is temporarily reconnecting. Please click again.'
      }), {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
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
