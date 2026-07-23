'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { post, patch } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { LoginResponse } from '@/lib/types';

interface LoginInput {
  email: string;
  password: string;
  stayConnected: boolean;
}

/**
 * POST /admin/auth/login → stores the access token + admin identity.
 * The refresh token never reaches this code: the backend returns it as an
 * httpOnly cookie the browser stores and replays on its own.
 */
export function useLogin() {
  const login = useAuthStore((s) => s.login);
  return useMutation({
    mutationFn: (input: LoginInput) => post<LoginResponse>('/admin/auth/login', input),
    onSuccess: (data) => {
      login(data.accessToken, data.admin);
    },
  });
}

/** Best-effort POST /admin/auth/logout (revokes + clears the cookie), then clear + redirect. */
export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  return () => {
    // Fire-and-forget; local state clears regardless of the network result.
    post('/admin/auth/logout').catch(() => undefined);
    logout();
    router.replace('/login');
  };
}

/** PATCH /admin/auth/password (change own password). */
export function useChangePassword() {
  return useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      patch<{ id: string; message: string }>('/admin/auth/password', input),
  });
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => s.isAuthenticated);
}
