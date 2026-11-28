import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth-store';
import type { RefreshResponse } from './types';

/**
 * API client — axios wrapper with:
 *  - Authorization: Bearer <accessToken> injection from the auth store
 *  - single-flight silent refresh on 401, then retry of the original request
 *  - hard logout + redirect to /login when the refresh itself fails
 *
 * Base URL comes from NEXT_PUBLIC_API_URL (e.g. https://udj-api.onrender.com).
 * All admin endpoints live under /admin on the backend.
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_API_URL is required — set it in .env.local or your deployment environment'
  );
}

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
  // Send the httpOnly refresh-token cookie. It is scoped to /admin/auth
  // server-side, so it rides along only on the auth calls that need it.
  withCredentials: true,
});

const isAuthUrl = (url: string | undefined) =>
  !!url && (url.includes('/admin/auth/login') || url.includes('/admin/auth/refresh'));

// ─── Request: inject bearer token ────────────────────────────────────────────
//
// The access token lives in memory only (stores/auth-store.ts), so after a
// reload the portal is signed in but holds no token. Sending the page's first
// requests bare meant each came back 401 — five to seven red errors on every
// load, and on a cold server each one waited the full wake-up before the
// refresh could even start. Instead, a request that finds no token while the
// admin is signed in waits for the one shared refresh, then goes out with it.

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const { accessToken, isAuthenticated } = useAuthStore.getState();
  let token = accessToken;
  if (!token && isAuthenticated && !isAuthUrl(config.url)) {
    token = await sharedRefresh();
    // The refresh failed and has already signed the admin out; don't let the
    // 401 that follows start a second one.
    if (!token) (config as InternalAxiosRequestConfig & { _retried?: boolean })._retried = true;
  }
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response: silent refresh on 401 (single-flight) ─────────────────────────

let refreshPromise: Promise<string | null> | null = null;

/** One refresh at a time: every caller that needs a token waits for the same one. */
function sharedRefresh(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = refreshTokens().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function refreshTokens(): Promise<string | null> {
  const { setAccessToken, logout } = useAuthStore.getState();
  try {
    // Plain axios (not `api`) so this call skips the interceptors. No body —
    // the browser attaches the httpOnly refresh cookie, and the rotated token
    // comes back as a Set-Cookie we never read.
    const { data } = await axios.post<RefreshResponse>(
      `${BASE_URL}/admin/auth/refresh`,
      {},
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15_000,
        withCredentials: true,
      }
    );
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch {
    logout();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    // An access token can still expire mid-session (15 min): refresh and retry once.
    if (error.response?.status === 401 && original && !original._retried && !isAuthUrl(original.url)) {
      original._retried = true;
      const newToken = await sharedRefresh();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api.request(original);
      }
    }
    return Promise.reject(error);
  }
);

// ─── Typed convenience helpers ───────────────────────────────────────────────

export async function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<T>(url, { params });
  return data;
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.post<T>(url, body);
  return data;
}

export async function patch<T>(url: string, body?: unknown): Promise<T> {
  const { data } = await api.patch<T>(url, body);
  return data;
}

export async function del<T>(url: string): Promise<T> {
  const { data } = await api.delete<T>(url);
  return data;
}
