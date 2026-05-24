import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, TIMEOUT } from '@/constants/api';
import { useAuthStore, REFRESH_KEY } from '@/stores/authStore';
import type { StudentProfile } from '@/stores/authStore';

export type { StudentProfile } from '@/stores/authStore';

// SQLite cache shape — flat representation stored in student_profile table
export interface StudentProfileCache {
  studentId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  programme: string;
  programmeName: string;
  faculty: string;
  facultyName: string;
  facultyCode: string;
  facultyEmail: string;
  facultyPhone: string;
  facultyAddress: string;
  facultyHours: string;
  programmeLevel: string;
  programmeDurationSemesters: number;
  programmeTotalCredits: number;
  currentSemester: number;
  level: string;
  year: number;
  semester: number;
  status: string;
  photoUrl: string | null;
  gpa: number | null;
  mention: string | null;
  attendancePercentage: number | null;
  creditsEarned: number;
  creditsTotal: number;
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
  coefficient: number;
  cachedAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectCode: string;
  subjectName: string;
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
  subjectName: string;
  sessionsTotal: number;
  sessionsPresent: number;
  sessionsRemaining: number;
  percentage: number;
  threshold: number;
  cachedAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  body: string;
  category: string;
  publishedAt: string;
  readTimeMinutes: number;
  isUrgent: boolean;
  imageUrl: string | null;
  bookmarked: boolean;
  read: boolean;
  cachedAt: string;
}

export interface CachedNotification {
  id: string;
  type: string;
  titleFr: string;
  bodyFr: string;
  isRead: boolean;
  createdAt: string;
  cachedAt: string;
}

export interface ScheduleEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  professorName: string;
  type: string;
  subject: {
    id: string;
    nameFr: string;
    nameAr: string;
    code: string;
    coefficient: number;
  };
}

export interface ScheduleResponse {
  semesterId: string;
  entries: ScheduleEntry[];
}

export interface NewsArticleSummary {
  id: string;
  titleFr: string;
  titleAr: string;
  category: string;
  heroImageUrl: string | null;
  readTimeMinutes: number;
  isUrgent: boolean;
  publishedAt: string;
}

export interface NewsListResponse {
  articles: NewsArticleSummary[];
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

export const getStudentMe = () =>
  instance.get<StudentProfile>('/student/me').then((r) => r.data);

export const getSchedule = (semesterId?: string) =>
  instance
    .get<ScheduleResponse>('/student/schedule', {
      params: semesterId ? { semesterId } : undefined,
    })
    .then((r) => r.data);

export interface GradeItem {
  id: string;
  noteCc: number | null;
  noteCf: number | null;
  noteFinale: number | null;
  isValidated: boolean;
  subject: {
    id: string;
    nameFr: string;
    nameAr: string;
    code: string;
    coefficient: number;
    credits: number;
  };
}

export interface GradesResponse {
  semester: { id: string; label: string; academicYear: string };
  gpa: number | null;
  mention: string | null;
  credits: { earned: number; total: number };
  grades: GradeItem[];
}

export interface SemesterSummary {
  id: string;
  label: string;
  academicYear: string;
  gpa: number | null;
  mention: string | null;
  credits: { earned: number; total: number };
}

export interface AllSemestersResponse {
  semesters: SemesterSummary[];
}

export const getGrades = (semesterId?: string) =>
  instance
    .get<GradesResponse>('/student/grades', {
      params: semesterId ? { semesterId } : undefined,
    })
    .then((r) => r.data);

export const getGradesAllSemesters = () =>
  instance
    .get<AllSemestersResponse>('/student/grades', {
      params: { allSemesters: 'true' },
    })
    .then((r) => r.data);

// ── Attendance ───────────────────────────────────────────────────────────────

export interface AbsenceRecord {
  id: string;
  date: string;
  status: 'ABSENT' | 'JUSTIFIED';
  justificationUrl: string | null;
  justificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

export interface AttendanceSubject {
  subject: {
    id: string;
    nameFr: string;
    nameAr: string;
    code: string;
  };
  total: number;
  present: number;
  absent: number;
  justified: number;
  percentage: number;
  absences: AbsenceRecord[];
}

export interface AttendanceApiResponse {
  overall: {
    percentage: number;
    absent: number;
    total: number;
  };
  subjects: AttendanceSubject[];
}

export const getAttendance = () =>
  instance.get<AttendanceApiResponse>('/student/attendance').then((r) => r.data);

export async function uploadJustification(
  recordId: string,
  fileUri: string,
  mimeType: string,
): Promise<{ justificationUrl: string; justificationStatus: string }> {
  const ext = mimeType.includes('pdf') ? 'pdf' : mimeType.includes('png') ? 'png' : 'jpg';
  const formData = new FormData();
  formData.append('justification', {
    uri: fileUri,
    type: mimeType,
    name: `justification_${recordId}.${ext}`,
  } as any);

  const res = await instance.post(
    `/student/attendance/${recordId}/justification`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return res.data;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export interface ApiNotification {
  id: string;
  type: string;
  titleFr: string;
  bodyFr: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsApiResponse {
  notifications: ApiNotification[];
}

export const getNotifications = () =>
  instance
    .get<NotificationsApiResponse>('/student/notifications')
    .then((r) => r.data);

export const markAllNotificationsRead = () =>
  instance.patch('/student/notifications/read-all').then((r) => r.data);

// ── Preferences ───────────────────────────────────────────────────────────────

export interface PreferencesPayload {
  notifGrades?: boolean;
  notifCourses?: boolean;
  notifAttendance?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
}

export const patchPreferences = (payload: PreferencesPayload) =>
  instance.patch('/student/preferences', payload).then((r) => r.data);

export const getQrToken = () =>
  instance
    .get<{ token: string; expiresAt: string }>('/student/qr-token')
    .then((r) => r.data);

export const getNews = (params?: NewsParams) =>
  instance.get<NewsListResponse>('/news', { params }).then((r) => r.data);

export const registerFcmToken = (token: string) =>
  instance.post('/notifications/register', { token }).then((r) => r.data);

export interface NewsArticleDetail {
  id: string;
  titleFr: string;
  titleAr: string;
  bodyFr: string;
  bodyAr: string;
  category: string;
  heroImageUrl: string | null;
  readTimeMinutes: number;
  isUrgent: boolean;
  publishedAt: string;
  author?: string;
}

export const getNewsArticle = (id: string) =>
  instance.get<NewsArticleDetail>(`/news/${id}`).then((r) => r.data);

export default instance;
