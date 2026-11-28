import { NextResponse, type NextRequest } from 'next/server';

// Content-Security-Policy for the student website, built per request with a
// fresh nonce — the same scheme as admin/proxy.ts.
//
// Until now the site sent no CSP and no frame protection at all: any page could
// load app.unipocket.io in a frame (clickjacking on the login form), and an
// injected script would have run with the student's session.
//
// Next.js hydrates with inline <script> tags. It reads the nonce from this
// request's Content-Security-Policy header while rendering and stamps it on its
// own scripts; app/layout.tsx reads x-nonce for the two bootstrap scripts it
// writes itself. Every page is rendered per request already (the root layout
// reads cookies()), so there is always a request to carry a nonce.
//
// Next 16 calls the middleware file convention `proxy`; this file is it.

// Cloudflare Web Analytics is switched on for this zone and injects its beacon
// into every page. It carries no nonce, so it is allowed by host here; that is
// also why script-src has no 'strict-dynamic' (which ignores host entries).
// Whether to keep the analytics is a separate decision — if it is turned off in
// Cloudflare, delete these two hosts.
const CF_BEACON_SCRIPT = 'https://static.cloudflareinsights.com';
const CF_BEACON_REPORT = 'https://cloudflareinsights.com';

export function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    // 'unsafe-eval' only for the dev overlay / fast refresh.
    `script-src 'self' 'nonce-${nonce}' ${CF_BEACON_SCRIPT}${isDev ? " 'unsafe-eval'" : ''}`,
    // React style props and Next's injected style tags.
    "style-src 'self' 'unsafe-inline'",
    // Profile photos and news images come from storage hosts (https); data: and
    // blob: for local previews.
    "img-src 'self' data: blob: https:",
    // The browser only ever talks to this origin (/api/backend, /api/auth).
    `connect-src 'self' ${CF_BEACON_REPORT}`,
    "font-src 'self'",
    "worker-src 'self'",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce, process.env.NODE_ENV === 'development');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    // Pages only. /api answers JSON, static files need no policy, and router
    // prefetches are not documents. sw.js and manifest.json are static files.
    {
      source: '/((?!api|_next/static|_next/image|icons|fonts|sw.js|manifest.json|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
