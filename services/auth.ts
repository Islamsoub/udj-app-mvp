import axios, { isAxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, TIMEOUT } from '@/constants/api';
import { useAuthStore, REFRESH_KEY, StudentProfile } from '@/stores/authStore';
import api, { SECURE_OPTS } from './api';
import { clearAllCache } from './db';
import { BIOMETRIC_ENABLED_KEY, BIOMETRIC_ASKED_KEY } from '@/services/biometric';

// Identity shown on the login screen ("Bon retour, Ahmed") before re-auth.
const LAST_STUDENT_NAME_KEY = 'lastStudentName';
const LAST_STUDENT_ID_KEY = 'lastStudentId';

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  student: StudentProfile;
};

export async function login(studentId: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { studentId, password });

  useAuthStore.getState().setTokens(data.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken, SECURE_OPTS);
  useAuthStore.getState().setStudent(data.student);

  await SecureStore.setItemAsync(
    LAST_STUDENT_NAME_KEY,
    `${data.student.firstName} ${data.student.lastName}`,
  );
  await SecureStore.setItemAsync(LAST_STUDENT_ID_KEY, data.student.studentIdDisplay);

  return data;
}

export async function logout(): Promise<void> {
  // Revocation runs unconditionally. It used to sit behind `if (!bioEnabled)`,
  // which made logout a client-only gesture for biometric users: the refresh
  // token stayed valid server-side for its full 30-day TTL.
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  if (refreshToken) {
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch (err) {
      // If the access token had expired, the 401 interceptor refreshed it —
      // revoking this refresh token and storing a new one — then replayed the
      // request with the now-dead token in the body, which 404s. Re-read and
      // retry with whatever is actually current.
      const current = await SecureStore.getItemAsync(REFRESH_KEY);
      if (current && current !== refreshToken) {
        try {
          await api.post('/auth/logout', { refreshToken: current });
        } catch (retryErr) {
          warnRevokeFailed(retryErr);
        }
      } else {
        warnRevokeFailed(err);
      }
    }
  }

  await SecureStore.deleteItemAsync(REFRESH_KEY);
  // Clear the biometric opt-in too — otherwise the login screen offers
  // fingerprint sign-in for an account that has been logged out.
  await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
  await SecureStore.deleteItemAsync(BIOMETRIC_ASKED_KEY);

  await clearAllCache();

  // Drop the remembered identity so the next login screen is anonymous.
  await SecureStore.deleteItemAsync(LAST_STUDENT_NAME_KEY);
  await SecureStore.deleteItemAsync(LAST_STUDENT_ID_KEY);

  useAuthStore.getState().logout();
}

// Logs the failure without the axios error object, whose `config.data` carries
// the refresh token — that must never reach a log sink (CLAUDE.md: no PII/secrets
// in logs).
function warnRevokeFailed(err: unknown): void {
  const status = isAxiosError(err) ? err.response?.status : undefined;
  console.warn(`[auth] logout revoke failed${status ? ` (${status})` : ''}`);
}

export async function restoreSession(): Promise<boolean> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  if (!refreshToken) return false;

  try {
    // Use axios directly so this call bypasses the instance interceptor
    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: TIMEOUT }
    );

    useAuthStore.getState().setTokens(data.accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken, SECURE_OPTS);

    const { data: student } = await api.get<StudentProfile>('/student/me');
    useAuthStore.getState().setStudent(student);

    return true;
  } catch (err) {
    if (isAxiosError(err) && err.response?.status === 401) {
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      useAuthStore.getState().logout();
    }
    return false;
  }
}
