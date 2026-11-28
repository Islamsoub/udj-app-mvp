import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, TIMEOUT } from '@/constants/api';
import { useAuthStore, REFRESH_KEY } from '@/stores/authStore';
import type { StudentProfile } from '@/stores/authStore';
import type { QrTokenResponse } from '@/utils/cardCode';

export type { StudentProfile } from '@/stores/authStore';

// Same protection class as the SQLCipher key (services/db.ts): survives reboot
// so background sync works, never leaves this device, never restored to another.
// Every REFRESH_KEY write must pass these — an unqualified setItemAsync falls
// back to the platform default, which is restorable to a new device.
export const SECURE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

// SQLite cache shape — flat representation stored in student_profile table
export interface StudentProfileCache {
  studentId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  programme: string;
  programmeName: string;
  programmeNameAr?: string;
  faculty: string;
  facultyName: string;
  facultyNameAr?: string;
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
  subjectNameAr?: string;
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
  subjectNameAr?: string;
  semester: string;
  ccScore: number | null;
  examScore: number | null;
  finalScore: number | null;
  coefficient: number;
  passed: boolean;
  // Dual-publish phase (Pass C). CF/NF scores stay null until nfPublished.
  ccPublished?: boolean;
  nfPublished?: boolean;
  cachedAt: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  subjectCode: string;
  subjectName: string;
  subjectNameAr?: string;
  sessionsTotal: number;
  sessionsPresent: number;
  sessionsRemaining: number;
  /** Null: no countable hours ("no figure"), never shown as 0%. */
  percentage: number | null;
  /** Legacy column: the server's threshold as a fraction (75 → 0.75). Not read for any verdict. */
  threshold: number;
  /** The server's verdict. Null only for a row cached before band existed. */
  band: AttendanceBand | null;
  /** Server value; null once the semester has ended (or before band existed). */
  absencesLeft: number | null;
  cachedAt: string;
}

export interface NewsItem {
  id: string;
  title: string;
  titleAr?: string;
  body: string;
  // Arabic body + author, populated only when an article's full detail has been
  // fetched (news list summaries carry neither). Empty until then.
  bodyAr?: string;
  author?: string;
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
  titleAr?: string;
  bodyFr: string;
  bodyAr?: string;
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

export interface NewsCategory {
  id: string;
  nameFr: string;
  nameAr: string;
  slug: string;
  displayOrder: number;
}

export interface NewsCategoriesResponse {
  categories: NewsCategory[];
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
        // logout() resets showSessionExpired to false, so raise the flag after
        // it to surface the app-wide SessionExpired modal.
        useAuthStore.getState().logout();
        useAuthStore.getState().setShowSessionExpired(true);
        return Promise.reject(error);
      }

      // Call refresh directly via axios (not through this instance) to avoid re-triggering
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${API_BASE_URL}/auth/refresh`,
        { refreshToken: storedRefresh },
        { timeout: TIMEOUT }
      );

      useAuthStore.getState().setTokens(data.accessToken);
      await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken, SECURE_OPTS);

      processQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return instance(original);
    } catch (refreshErr) {
      processQueue(refreshErr);
      await SecureStore.deleteItemAsync(REFRESH_KEY);
      // Terminal 401: the refresh failed. logout() clears the flag, so set it
      // afterwards to trigger the app-wide SessionExpired modal.
      useAuthStore.getState().logout();
      useAuthStore.getState().setShowSessionExpired(true);
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
  // Publication phase for this semester. CF/NF are masked null until nfPublished.
  ccPublished?: boolean;
  nfPublished?: boolean;
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

// SQLite cache shape for the semester-level GPA/mention/credits, so the grades
// hero card renders identically online and offline (the raw GradesResponse is
// null on a cold offline launch).
export interface GradesSummary {
  semesterId: string;
  gpa: number | null;
  mention: string | null;
  creditsEarned: number;
  creditsTotal: number;
  cachedAt: string;
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
  // Pass C added PARTIAL (attended part of a session, hours-based).
  status: 'ABSENT' | 'JUSTIFIED' | 'PARTIAL';
  // Present when the record is grouped/cached under its subject.
  subjectCode?: string;
  subjectName: string;
  subjectNameAr: string;
  justificationUrl: string | null;
  justificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  justificationNote: string | null;
  // Hours attended for a PARTIAL session; null/absent otherwise.
  hoursAttended?: number | null;
  /**
   * The server's verdict: an upload would be accepted now (status ABSENT, no
   * accepted proof, inside the deadline). Null for a record cached before the
   * app stored it — the sheet then lets the server decide on submit.
   */
  canSubmitJustification?: boolean | null;
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
  partial: number;
  /** Truncated whole percent; null when no hours could be counted ("no figure"). */
  percentage: number | null;
  absences: AbsenceRecord[];
  band: AttendanceBand;
  /** Null once the semester has ended: nothing left to spend. Never show it as 0. */
  absencesLeft: number | null;
}

// Overall attendance figures. `percentage` is hours-based (Pass C §4.3). The
// backend sends `overall: null` when there is no current semester.
export interface AttendanceOverall {
  /** Null when no hours could be counted ("no figure"); never shown as 0%. */
  percentage: number | null;
  total: number;
  present: number;
  absent: number;
  justified: number;
  partial: number;
  band: AttendanceBand;
  /** Null once the semester has ended: nothing left to spend. Never show it as 0. */
  absencesLeft: number | null;
}

export interface AttendanceApiResponse {
  overall: AttendanceOverall | null;
  subjects: AttendanceSubject[];
  /** Whole percent (e.g. 75), admin-configurable on the server. */
  attendanceThreshold: number;
}

/**
 * The server's attendance verdict (backend 7c929ec). The app only maps it to a
 * colour and a sentence; it never computes one. See services/attendanceContract.ts.
 */
export type AttendanceBand = 'ok' | 'near' | 'below';

// SQLite cache shape for the overall summary (kept out of the per-subject rows
// so the hours-based overall percentage survives a cold offline launch).
// band / absencesLeft / threshold are null for a summary cached before they
// existed — rendered neutral, never filled in locally.
export interface AttendanceSummary extends Omit<AttendanceOverall, 'band'> {
  studentId: string;
  band: AttendanceBand | null;
  threshold: number | null;
  cachedAt: string;
}

export const getAttendance = () =>
  instance.get<AttendanceApiResponse>('/student/attendance').then((r) => r.data);

export async function uploadJustification(
  recordId: string,
  fileUri: string,
  mimeType: string,
  note?: string,
): Promise<{ justificationUrl: string; justificationStatus: string }> {
  const ext = mimeType.includes('pdf') ? 'pdf' : mimeType.includes('png') ? 'png' : 'jpg';
  const formData = new FormData();
  formData.append('justification', {
    uri: fileUri,
    type: mimeType,
    name: `justification_${recordId}.${ext}`,
  } as any);

  const trimmedNote = note?.trim();
  if (trimmedNote) {
    formData.append('note', trimmedNote);
  }

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
  titleAr?: string;
  bodyFr: string;
  bodyAr?: string;
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

export const markNotificationRead = (id: string) =>
  instance.patch(`/student/notifications/${id}/read`).then((r) => r.data);

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
  instance.get<QrTokenResponse>('/student/qr-token').then((r) => r.data);

/**
 * POST /verify/card — the public student-card check (no sign-in needed; the
 * bearer token the instance adds is ignored). Used by the app's scanner.
 */
export const verifyCardCode = (code: string) =>
  instance.post<CardVerdict>('/verify/card', { code }).then((r) => r.data);

export interface CardVerdict {
  valid: boolean;
  reason?: 'expired' | 'invalid' | 'inactive';
  kind?: 'live' | 'offline';
  issuedAt?: string;
  expiresAt?: string;
  checkedAt: string;
  student?: {
    firstName: string;
    lastName: string;
    studentIdDisplay: string;
    photoUrl: string | null;
    status: string;
    currentSemester: number;
    programme: { nameFr: string; nameAr: string; level: string };
    faculty: { nameFr: string; nameAr: string };
  };
}

export const getNews = (params?: NewsParams) =>
  instance.get<NewsListResponse>('/news', { params }).then((r) => r.data);

export const getNewsCategories = () =>
  instance.get<NewsCategoriesResponse>('/news/categories').then((r) => r.data);

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

// ── Course notes (backend/src/routes/courseNotes.ts) ──────────────────────────
// A note belongs to a class: a subject code + a weekday (0 = Sunday … 6). The
// body is the most personal thing the app sends: never log these requests,
// their bodies or their error objects (an axios error's config.data IS the body).

export interface CourseNoteDto {
  id: string;
  subjectCode: string;
  dayOfWeek: number;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CourseNoteCreate {
  subjectCode: string;
  dayOfWeek: number;
  /** 1–2000 characters (code points) after trimming. */
  body: string;
  /** ISO 8601; only for notes written on the phone before they were stored on the server. */
  createdAt?: string;
}

/** 400 both filters not given together · 404 subject not in the current timetable. Newest first. */
export const fetchCourseNotes = (filter?: { subjectCode: string; dayOfWeek: number }) =>
  instance
    .get<{ notes: CourseNoteDto[] }>('/student/course-notes', {
      params: filter ? { subjectCode: filter.subjectCode, dayOfWeek: filter.dayOfWeek } : undefined,
    })
    .then((r) => r.data.notes);

/** 201 the note · 400 invalid · 404 subject not in the current timetable · 429 over 60 a minute. */
export const createCourseNote = (payload: CourseNoteCreate) =>
  instance.post<CourseNoteDto>('/student/course-notes', payload).then((r) => r.data);

/** 204 · 400 not a note id · 404 not found (or not yours). */
export const deleteCourseNoteOnServer = (id: string) =>
  instance.delete(`/student/course-notes/${encodeURIComponent(id)}`).then(() => undefined);

// ─── Saved news articles (/student/saved-articles) ───────────────────────────

/** One saved article: its id (the article data comes from /news) and when it was saved. */
export interface SavedArticleDto {
  articleId: string;
  createdAt: string;
}

export interface SavedArticlesResponse {
  savedArticles: SavedArticleDto[];
}

/** The student's saved articles, newest save first. */
export const getSavedArticlesFromServer = () =>
  instance.get<SavedArticlesResponse>('/student/saved-articles').then((r) => r.data.savedArticles);

/**
 * 204, idempotent (saving twice is fine) · 400 not an article id / bad createdAt
 * · 404 unknown or unpublished article · 429 over 60 a minute. `createdAt`
 * (ISO) is optional; the app sends none — the phone never stored a save date.
 */
export const saveArticleOnServer = (articleId: string, createdAt?: string) =>
  instance
    .put(
      `/student/saved-articles/${encodeURIComponent(articleId)}`,
      createdAt ? { createdAt } : undefined,
    )
    .then(() => undefined);

/** 204, idempotent (even if it was not saved) · 400 not an article id. */
export const unsaveArticleOnServer = (articleId: string) =>
  instance.delete(`/student/saved-articles/${encodeURIComponent(articleId)}`).then(() => undefined);

/** HTTP status of a failed call; undefined when no response came back (offline, timeout). */
export const httpStatusOf = (err: unknown): number | undefined =>
  axios.isAxiosError(err) ? err.response?.status : undefined;
