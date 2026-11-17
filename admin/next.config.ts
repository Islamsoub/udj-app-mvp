import type { NextConfig } from 'next';

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
          // Content-Security-Policy is not here: it carries a per-request
          // nonce, so it is set in proxy.ts.
        ],
      },
    ];
  },
};

export default nextConfig;
