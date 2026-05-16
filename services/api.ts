import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, TIMEOUT } from '@/constants/api';
import { useAuthStore, REFRESH_KEY } from '@/stores/authStore';

export type { StudentProfile } from '@/stores/authStore';

// SQLite cache shape — flat representation stored in student_profile table
export interface StudentProfileCache {
  studentId: string;
  name: string;
  programme: string;
  faculty: string;
  year: number;
  photoUrl: string | null;
  cachedAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  student: import('@/stores/authStore').StudentProfile;
}

export interface Schedule {
  id: string;
  studentId: string;
  subjectName: string;
  subjectCode: string;
  lecturerName: string;
  room: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  semester: string;
  isExam: boolean;
  cachedAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectCode: string;
  semester: string;
  ccScore: number | null;
  examScore: number | null;
  finalScore: number | null;
  coefficient: number;
  passed: boolean;
  cachedAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  subjectCode: string;
  sessionsTotal: number;
  sessionsPresent: number;
  threshold: number;
  cachedAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  category: string;
  publishedAt: string;
  bookmarked: boolean;
  read: boolean;
  cachedAt: string;
}

export interface NewsParams {
  page?: number;
  limit?: number;
  category?: string;
}

// Extend config to carry the retry flag without polluting the public type
interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const instance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach access token ────────────────────────────────

instance.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ── Response interceptor: auto-refresh on 401 ───────────────────────────────

// Queues concurrent 401s so only one refresh call is made
let isRefreshing = false;
let failedQueue: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function processQueue(err: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => (err ? reject(err) : resolve(token!)));
  failedQueue = [];
}

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as RetryableConfig;

    // Only handle 401; let everything else propagate
    if (error.response?.status !== 401) return Promise.reject(error);

    // Don't retry if already retried, or if the failing request is itself an auth endpoint
    const url: string = original.url ?? '';
    if (original._retry || url.includes('/auth/login') || url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // Queue concurrent requests while a refresh is already in flight
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return instance(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const storedRefresh = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!storedRefresh) {
        processQueue(error);
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }

      // Call refresh directly via axios (not through this instance) to avoid re-triggering
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken: storedRefresh },
        { timeout: TIMEOUT }
      );

      useAuthStore.getState().setTokens(data.accessToken);
      await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken);

      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return instance(original);
    } catch (refreshErr) {
      processQueue(refreshErr);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      useAuthStore.getState().logout();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

// ── Endpoint helpers ─────────────────────────────────────────────────────────

export const getSchedule = (semesterId?: string) =>
  instance
    .get<{ semesterId: string; entries: object[] }>('/student/schedule', {
      params: semesterId ? { semesterId } : undefined,
    })
    .then((r) => r.data);

export const getGrades = (semesterId?: string) =>
  instance
    .get<object>('/student/grades', {
      params: semesterId ? { semesterId } : undefined,
    })
    .then((r) => r.data);

export const getAttendance = () =>
  instance.get<object>('/student/attendance').then((r) => r.data);

export const getQrToken = () =>
  instance
    .get<{ token: string; expiresAt: string }>('/student/qr-token')
    .then((r) => r.data);

export const getNews = (params?: NewsParams) =>
  instance.get<NewsItem[]>('/news', { params }).then((r) => r.data);

export const registerFcmToken = (token: string) =>
  instance.post('/notifications/register', { token }).then((r) => r.data);

export default instance;
