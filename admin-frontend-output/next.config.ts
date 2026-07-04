import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The portal is a pure API client — no server-side secrets live here.
  // NEXT_PUBLIC_API_URL is read at build time in lib/api.ts.
};

export default nextConfig;
