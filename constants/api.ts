export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3000'
  : 'https://udj-api.onrender.com';

// 30s — Render free-tier cold starts can be slow
export const TIMEOUT = 30000;
