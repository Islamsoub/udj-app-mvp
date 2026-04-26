import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from '@/stores/authStore';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  studentId: string;
}

export interface StudentProfile {
  studentId: string;
  name: string;
  programme: string;
  faculty: string;
  year: number;
  photoUrl: string | null;
  cachedAt: string;
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

const instance: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().setShowSessionExpired(true);
    }
    return Promise.reject(error);
  }
);

export const login = (studentId: string, password: string) =>
  instance.post<LoginResponse>('/auth/login', { studentId, password }).then((r) => r.data);

export const refreshToken = () =>
  instance.post<{ token: string }>('/auth/refresh').then((r) => r.data);

export const getProfile = () =>
  instance.get<StudentProfile>('/student/profile').then((r) => r.data);

export const getSchedule = () =>
  instance.get<Schedule[]>('/student/schedule').then((r) => r.data);

export const getScheduleToday = () =>
  instance.get<Schedule[]>('/student/schedule/today').then((r) => r.data);

export const getGrades = (semester: string) =>
  instance.get<Grade[]>('/student/grades', { params: { semester } }).then((r) => r.data);

export const getAttendance = () =>
  instance.get<Attendance[]>('/student/attendance').then((r) => r.data);

export const getQrToken = () =>
  instance
    .get<{ token: string; expiresAt: string }>('/student/qr-token')
    .then((r) => r.data);

export const getNews = (params?: NewsParams) =>
  instance.get<NewsItem[]>('/news', { params }).then((r) => r.data);

export const registerFcmToken = (token: string) =>
  instance.post('/notifications/register', { token }).then((r) => r.data);

export default instance;
