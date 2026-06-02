import axios, { isAxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, TIMEOUT } from '@/constants/api';
import { useAuthStore, REFRESH_KEY, StudentProfile } from '@/stores/authStore';
import api from './api';
import { clearAllCache } from './db';

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  student: StudentProfile;
};

export async function login(studentId: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { studentId, password });

  useAuthStore.getState().setTokens(data.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);
  useAuthStore.getState().setStudent(data.student);

  await AsyncStorage.setItem('lastStudentName', `${data.student.firstName} ${data.student.lastName}`);
  await AsyncStorage.setItem('lastStudentId', data.student.studentIdDisplay);

  return data;
}

export async function logout(): Promise<void> {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  if (refreshToken) {
    try {
      // Best-effort server-side revocation; local cleanup happens regardless
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // ignore
    }
  }
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await clearAllCache();
  useAuthStore.getState().logout();
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
    await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);

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
