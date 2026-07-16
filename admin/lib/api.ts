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
});

// ─── Request: inject bearer token ────────────────────────────────────────────

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response: silent refresh on 401 (single-flight) ─────────────────────────

let refreshPromise: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    return null;
  }
  try {
    // Plain axios (not `api`) so this call skips the interceptors.
    const { data } = await axios.post<RefreshResponse>(
      `${BASE_URL}/admin/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' }, timeout: 15_000 }
    );
    setTokens(data.accessToken, data.refreshToken);
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
    const isAuthCall = original?.url?.includes('/admin/auth/login') || original?.url?.includes('/admin/auth/refresh');

    if (error.response?.status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshPromise = refreshPromise ?? refreshTokens();
      const newToken = await refreshPromise;
      refreshPromise = null;
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
