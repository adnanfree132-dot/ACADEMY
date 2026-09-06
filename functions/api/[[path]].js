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

  const isSafeJson = (text) => {
    if (!text || typeof text !== 'string') return false;
    const trimmed = text.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      return false;
    }
  };

  // Perform up to 3 attempts with exponential backoff on cold-start or connection drops
  let lastRes = null;
  let lastText = '';
  let lastContentType = '';

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await doFetch();
      const contentType = res.headers.get('content-type') || '';
      const text = await res.text();

      lastRes = res;
      lastText = text;
      lastContentType = contentType;

      const isJsonHeader = contentType.includes('application/json');
      const isEmpty = !text || !text.trim();

      // If successful 2xx/3xx/4xx and non-empty valid response, accept it immediately
      if (res.status < 500 && !isEmpty) {
        if (!isJsonHeader || isSafeJson(text)) {
          break;
        }
      }

      // If 5xx, or empty body, or invalid JSON when expecting JSON, wait and retry
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    } catch (fetchErr) {
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
  }

  // If all attempts failed or returned a broken/empty/5xx response, return clean JSON fallback
  const isEmpty = !lastText || !lastText.trim();
  const is5xx = !lastRes || lastRes.status >= 500;
  const isInvalidJson = lastContentType.includes('application/json') && !isSafeJson(lastText);

  if (is5xx || isEmpty || isInvalidJson) {
    // If the last response was a 4xx with valid JSON, preserve it
    if (lastRes && lastRes.status >= 400 && lastRes.status < 500 && isSafeJson(lastText)) {
      const respHeaders = new Headers(lastRes.headers);
      respHeaders.set('Access-Control-Allow-Origin', '*');
      respHeaders.set('Content-Type', 'application/json');
      respHeaders.delete('content-length');
      respHeaders.delete('content-encoding');
      return new Response(lastText, {
        status: lastRes.status,
        headers: respHeaders
      });
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'The backend service is temporarily warming up. Please click again in a moment.'
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
        }
      }
    );
  }

  // Construct fresh response with buffered text
  const responseHeaders = new Headers(lastRes.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.delete('content-length');
  responseHeaders.delete('content-encoding');

  if (lastContentType) {
    responseHeaders.set('Content-Type', lastContentType);
  } else {
    responseHeaders.set('Content-Type', 'application/json');
  }

  return new Response(lastText, {
    status: lastRes.status,
    headers: responseHeaders
  });
}
