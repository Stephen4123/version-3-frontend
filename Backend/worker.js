const ORIGIN = 'https://jeevajyothimedia.com';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request, env, ctx) {
    const backend = env?.BACKEND_URL;
    if (!backend) {
      return new Response(JSON.stringify({ success: false, error: 'BACKEND_URL not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // Proxy only API routes
    if (!path.startsWith('/api/')) {
      return new Response('Not Found', { status: 404 });
    }

    const backendUrl = `${backend}${path}${url.search}`;

    try {
      const headers = new Headers();
      const contentType = request.headers.get('content-type');
      if (contentType) headers.set('content-type', contentType);

      const auth = request.headers.get('authorization');
      if (auth) headers.set('authorization', auth);

      const resp = await fetch(backendUrl, {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer(),
        redirect: 'follow',
      });

      const bodyText = await resp.text();

      const responseHeaders = new Headers();
      responseHeaders.set('content-type', resp.headers.get('content-type') || 'application/json');
      responseHeaders.set('Access-Control-Allow-Origin', ORIGIN);
      responseHeaders.set('Access-Control-Allow-Credentials', 'true');

      // small edge cache for GETs
      if (request.method === 'GET') {
        responseHeaders.set('Cache-Control', 'public, max-age=60');
      } else {
        responseHeaders.set('Cache-Control', 'no-store');
      }

      return new Response(bodyText, { status: resp.status, headers: responseHeaders });
    } catch (e) {
      return new Response(JSON.stringify({ success: false, error: 'API proxy failed' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      });
    }
  },
};

