// For local dev with emulator: use 'http://10.0.2.2:3000'
// For real device testing and production: use Render URL
// Set EXPO_PUBLIC_API_URL in .env to switch between dev/staging/prod.
// EXPO_PUBLIC_ prefix is required for Expo to expose the var to the client.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://udj-api.onrender.com';

// 30s — Render free-tier cold starts can be slow
export const TIMEOUT = 30000;
