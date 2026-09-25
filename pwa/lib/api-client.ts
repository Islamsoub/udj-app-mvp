import {
  getAccessToken,
  notifySessionExpired,
  setAccessToken,
} from '@/lib/auth-token';
import type {
  AllSemestersResponse,
  AttendanceResponse,
  GradesResponse,
  MarkAllReadResponse,
  MeResponse,
  NewsArticleDetail,
  NewsListResponse,
  NewsQuery,
  NotificationsResponse,
  PreferencesPayload,
  ScheduleResponse,
  StudentPreferences,
  UploadJustificationResponse,
} from '@/lib/api-types';

/**
 * Same-origin paths only. The browser never learns the backend's address: the
 * catch-all at /api/backend and the three /api/auth routes are this app's own
 * server, which holds the base URL, the proxy secret and the refresh cookie.
 * Nothing here may import lib/api-config or read NEXT_PUBLIC_API_URL.
 */
const BACKEND_PREFIX = '/api/backend';
const REFRESH_PATH = '/api/auth/refresh';

/**
 * A non-2xx response. Carries the status and the parsed body so callers can tell
 * 404 (no such article) from 429 (rate limited) from 502/504 (backend down or
 * cold-starting) and react differently to each.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown) {
    super(`Request failed with status ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

// ── Single-flight refresh ─────────────────────────────────────────────────────

/**
 * The backend rotates the refresh token on every use and revokes the previous
 * one. A dashboard that loads schedule, grades and attendance together will get
 * three simultaneous 401s on an expired access token; if all three called
 * refresh, the second and third would arrive holding a token the first had
 * already revoked and the student would be logged out for no reason.
 *
 * So the first 401 refreshes and the rest wait on its result.
 */
let isRefreshing = false;
let waiters: { resolve: (token: string) => void; reject: (err: unknown) => void }[] = [];

function flushWaiters(err: unknown, token: string | null): void {
  const pending = waiters;
  waiters = [];
  for (const w of pending) {
    if (err !== null || token === null) w.reject(err);
    else w.resolve(token);
  }
}

/**
 * Exchanges the httpOnly refresh cookie for a new access token.
 *
 * Bare `fetch`, never `apiFetch` — routing it through the wrapper would let its
 * own 401 re-enter the refresh logic and recurse. Sends no body: the cookie is
 * the credential, and the client cannot read it to send it explicitly.
 */
export async function refreshAccessToken(): Promise<string> {
  const res = await fetch(REFRESH_PATH, {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
  });

  const body = await parseBody(res);
  if (!res.ok) throw new ApiError(res.status, body);

  const { accessToken } = (body ?? {}) as { accessToken?: unknown };
  if (typeof accessToken !== 'string') {
    throw new ApiError(502, { error: 'Malformed refresh response' });
  }

  return accessToken;
}

/**
 * Whether a refresh failure means the session is over.
 *
 * Only a 401 does: app/api/auth/refresh answers 401 when there is no cookie or
 * the backend rejected the token, and deletes the cookie in that branch alone.
 * Everything else says nothing about the session — a thrown TypeError is a
 * request that never arrived, 502/504 is a backend that is down or cold-starting,
 * 429 is a wait. Reading those as expiry would clear a valid session and send the
 * student to log in again because of a network blip.
 */
function isSessionDead(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

/**
 * Resolves with a fresh access token, starting a refresh only if one is not
 * already in flight. On failure every waiter is rejected with the same error.
 * If the session is dead the token is cleared and the session-expired handler
 * fires exactly once for the whole batch; any other failure leaves the session
 * as it was and reaches the caller as an ordinary error, which its screen shows
 * as an error — or as offline, if the browser reports no connection.
 */
function refreshOnce(): Promise<string> {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      waiters.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  return refreshAccessToken()
    .then((token) => {
      setAccessToken(token);
      flushWaiters(null, token);
      return token;
    })
    .catch((err: unknown) => {
      flushWaiters(err, null);
      if (isSessionDead(err)) {
        setAccessToken(null);
        notifySessionExpired();
      }
      throw err;
    })
    .finally(() => {
      isRefreshing = false;
    });
}

// ── Core wrapper ──────────────────────────────────────────────────────────────

/** Parsed JSON, or null for an empty or non-JSON body (204, an HTML error page). */
async function parseBody(res: Response): Promise<unknown> {
  return res.json().catch(() => null);
}

function buildHeaders(init: RequestInit): Headers {
  const headers = new Headers(init.headers);

  const token = getAccessToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  /*
   * Only for requests that actually carry one — a GET with a Content-Type is
   * noise, and the proxy would forward it unchanged.
   *
   * FormData IS EXCLUDED, and this is load-bearing rather than tidiness. A
   * multipart body is delimited by a boundary string that only the browser
   * knows; it sets `multipart/form-data; boundary=...` itself when it sees a
   * FormData body and no explicit header. Setting `application/json` here would
   * win, the boundary would never be sent, and multer would parse the upload as
   * JSON and report a missing file — with no error anywhere that points at this
   * line. The upload helper below therefore passes FormData and no header at
   * all, and depends on this branch leaving it alone.
   */
  if (
    init.body !== undefined &&
    init.body !== null &&
    !(init.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }

  return headers;
}

/**
 * `retried` guards against an endless 401 loop: one refresh-and-retry per call,
 * and a second 401 is taken at face value.
 */
async function request<T>(path: string, init: RequestInit, retried: boolean): Promise<T> {
  const res = await fetch(`${BACKEND_PREFIX}${path}`, {
    ...init,
    headers: buildHeaders(init),
    credentials: 'same-origin',
    cache: 'no-store',
  });

  if (res.status !== 401) {
    const body = await parseBody(res);
    if (!res.ok) throw new ApiError(res.status, body);
    return body as T;
  }

  if (retried) {
    throw new ApiError(401, await parseBody(res));
  }

  // Drain the body before reissuing so the connection is not left half-read.
  await parseBody(res);

  // Throws if the refresh failed, and the caller sees the refresh error. A 401
  // there has already fired onSessionExpired; any other failure has not, and
  // the next request will try the refresh again.
  await refreshOnce();

  return request<T>(path, init, true);
}

/**
 * Calls an endpoint behind /api/backend with the held access token, refreshing
 * and retrying once if it has expired.
 *
 * `path` is relative to the backend root — `/student/me`, not `/api/backend/...`
 * and never an absolute URL.
 */
export function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  return request<T>(path, init, false);
}

// ── Query helpers ─────────────────────────────────────────────────────────────

/** Serialises defined params only, so an omitted argument leaves the backend on
 *  its own default rather than sending `undefined` as a literal. */
function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

function patchJson<T>(path: string, payload?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

export const getMe = () => apiFetch<MeResponse>('/student/me');

export const getSchedule = (semesterId?: string) =>
  apiFetch<ScheduleResponse>(withQuery('/student/schedule', { semesterId }));

export const getGrades = (semesterId?: string) =>
  apiFetch<GradesResponse>(withQuery('/student/grades', { semesterId }));

/** Same endpoint as getGrades, different response shape — see AllSemestersResponse. */
export const getGradesAllSemesters = () =>
  apiFetch<AllSemestersResponse>(withQuery('/student/grades', { allSemesters: 'true' }));

export const getAttendance = () => apiFetch<AttendanceResponse>('/student/attendance');

export const getNotifications = (limit?: number, offset?: number) =>
  apiFetch<NotificationsResponse>(withQuery('/student/notifications', { limit, offset }));

export const markAllNotificationsRead = () =>
  patchJson<MarkAllReadResponse>('/student/notifications/read-all');

export const updatePreferences = (payload: PreferencesPayload) =>
  patchJson<StudentPreferences>('/student/preferences', payload);

export const getNews = (params: NewsQuery = {}) =>
  apiFetch<NewsListResponse>(
    withQuery('/news', {
      category: params.category,
      limit: params.limit,
      offset: params.offset,
    })
  );

export const getNewsArticle = (id: string) =>
  apiFetch<NewsArticleDetail>(`/news/${encodeURIComponent(id)}`);

/**
 * Uploads one justification document for an absence.
 *
 * NO Content-Type IS SET HERE, deliberately. `fetch` sets
 * `multipart/form-data; boundary=...` from the FormData itself, and the boundary
 * it generates is the only thing that tells the backend's multer where the parts
 * begin. `buildHeaders` above has a matching exclusion; between them, nothing in
 * this file ever names a Content-Type for this call.
 *
 * The field name is `justification` because that is what
 * `upload.single('justification')` expects in backend/src/routes/student.ts —
 * any other name and the handler answers 400 "Missing file field".
 *
 * `note` is optional free text, capped at 80 characters server-side. It is
 * appended only when non-empty: multer's text fields arrive as '' rather than
 * undefined, and an empty string would be stored as a note the student never
 * wrote.
 *
 * Goes through `apiFetch`, so an expired access token is refreshed and the call
 * retried exactly once, like every other endpoint. That is also why this does
 * not use XMLHttpRequest despite XHR being the only way to get real upload
 * progress events — see the progress note in JustificationForm.
 */
export function uploadJustification(
  recordId: string,
  file: File,
  note?: string
): Promise<UploadJustificationResponse> {
  const form = new FormData();
  form.append('justification', file);

  const trimmed = note?.trim();
  if (trimmed) form.append('note', trimmed);

  return apiFetch<UploadJustificationResponse>(
    `/student/attendance/${encodeURIComponent(recordId)}/justification`,
    { method: 'POST', body: form }
  );
}
