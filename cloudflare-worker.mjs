const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co http://localhost:* https://localhost:* http://127.0.0.1:* https://127.0.0.1:* ws://localhost:* ws://127.0.0.1:* https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/acompanhar\/([^/]+)(\/.*)?$/);

    if (match) {
      const segment = match[1];
      const rest = match[2] || "";
      if (segment !== "placeholder" && !segment.includes(".")) {
        const rewrittenUrl = new URL(`/acompanhar/placeholder${rest}${url.search}`, request.url);
        const res = await env.ASSETS.fetch(new Request(rewrittenUrl, request));
        return withSecurityHeaders(res);
      }
      if (segment.endsWith(".txt") && segment !== "placeholder.txt") {
        const rewrittenUrl = new URL(`/acompanhar/placeholder.txt${url.search}`, request.url);
        const res = await env.ASSETS.fetch(new Request(rewrittenUrl, request));
        return withSecurityHeaders(res);
      }
    }

    const res = await env.ASSETS.fetch(request);
    return withSecurityHeaders(res);
  },
};
