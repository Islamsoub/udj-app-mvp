// For local dev with emulator: use 'http://10.0.2.2:3000'
// For real device testing and production: use Render URL
// TODO: Use EAS environment variables for proper env switching
export const API_BASE_URL = 'https://udj-api.onrender.com';

// 30s — Render free-tier cold starts can be slow
export const TIMEOUT = 30000;
