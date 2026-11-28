import { NextResponse, type NextRequest } from 'next/server';

// Content-Security-Policy, built per request with a fresh nonce.
//
// Next.js bootstraps hydration with inline <script> tags. A static CSP with a
// bare `script-src 'self'` blocks them, the page renders but never hydrates,
// and every form falls back to a native submit. 'unsafe-inline' would fix that
// by giving up script protection entirely, so instead each response carries a
// nonce: Next reads it from the request's Content-Security-Policy header during
// rendering and stamps it on its own scripts. An injected script cannot know it.
//
// This only works for pages rendered per request — see `await connection()` in
// app/layout.tsx. A prerendered page has no request, so no nonce.
//
// Next 16 renamed the `middleware` file convention to `proxy`; this file is it.

// The portal talks to exactly one API host. connect-src must name it explicitly
// or every XHR is blocked, so it is derived from the same env var lib/api.ts
// uses rather than hardcoded — otherwise a local build pointing at a local API
// would be blocked by a production-only allow-list.
const apiOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return '';
  try {
    return new URL(raw).origin;
  } catch {
    return '';
  }
})();

function buildCsp(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets the nonced Next bootstrap load its own chunks;
    // hosts and 'self' are ignored by browsers that support it, so only
    // nonced scripts and what they load can run.
    // 'unsafe-eval' is required by the Next.js dev overlay / fast refresh only.
    // Production ships without it, so an injected string can never reach eval().
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    // Tailwind and the component library inject style tags at runtime.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    // Justification documents are signed links to Supabase Storage; a PDF one
    // is shown in an <iframe> in the document viewer. Without frame-src the
    // iframe falls back to default-src 'self' and the browser blocks it.
    "frame-src https://*.supabase.co",
    `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''}`,
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce, process.env.NODE_ENV === 'development');

  // On the request, so Next can extract the nonce while rendering; x-nonce for
  // any server component that needs to pass it to a <Script>.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  // On the response, so the browser enforces it.
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

export const config = {
  matcher: [
    // Pages only: static chunks, image optimisation and the favicon need no CSP,
    // and router prefetches are not documents.
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
