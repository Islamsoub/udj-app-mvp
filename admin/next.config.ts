import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

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

const csp = [
  "default-src 'self'",
  // 'unsafe-eval' is required by the Next.js dev overlay / fast refresh only.
  // Production ships without it, so an injected string can never reach eval().
  isDev ? "script-src 'self' 'unsafe-eval'" : "script-src 'self'",
  // Tailwind and the component library inject style tags at runtime.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  `connect-src 'self'${apiOrigin ? ` ${apiOrigin}` : ''}`,
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // The portal is a pure API client — no server-side secrets live here.
  // NEXT_PUBLIC_API_URL is read at build time in lib/api.ts.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Content-Security-Policy', value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
