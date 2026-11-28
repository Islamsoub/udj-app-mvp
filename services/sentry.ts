import * as Sentry from '@sentry/react-native';
import { useAuthStore } from '@/stores/authStore';
import { REDACTED, buildNameMatcher, isGradeKey, redactNames } from '@/utils/piiScrub';

const SENTRY_DSN =
  'https://c557bb7db56036263c93e0f6bfa60633@o4511608504320000.ingest.de.sentry.io/4511608512053328';

// ── PII scrubbing ───────────────────────────────────────────────────────────
// Safety net, not a primary control: the app never calls setUser / setTag /
// setContext / addBreadcrumb, and sendDefaultPii is false. This only catches
// identifiers that reach an event by accident (an error message that embeds a
// matricule, a breadcrumb that carries a token).
//
// Names and grades are not matched by pattern — a bare number is not
// identifying, and guessing at capitalised words would destroy our own stack
// traces. Instead (utils/piiScrub.ts):
//   - the signed-in student's own first and last name are removed exactly,
//     wherever a string is scrubbed below;
//   - any value under a key that only holds marks (cc_score, finalScore, gpa,
//     average…) is replaced whole.

export { REDACTED };

// The signed-in student's name, kept in step with the auth store by
// initSentry(). Null when nobody is signed in.
let nameMatcher: RegExp | null = null;

export function setReportedStudentName(firstName?: string | null, lastName?: string | null): void {
  nameMatcher = buildNameMatcher(firstName, lastName);
}

// Student matricule, e.g. UDJ-2024-0432 (backend/prisma/seed.ts). The backend
// validator (MATRICULE_REGEX in backend/src/utils/adminHelpers.ts) accepts 3–4
// trailing digits, so match that wider shape rather than only the seed's.
const STUDENT_ID_RE = /\bUDJ-\d{4}-\d{3,4}\b/gi;

// "Bearer <token>" as it appears in an Authorization header value.
const BEARER_RE = /\bBearer\s+[A-Za-z0-9\-._~+/]+=*/gi;

// JWT: three base64url segments separated by dots. Every JWT header is a JSON
// object, so its base64url encoding starts with "eyJ" (`{"`). Anchoring on it
// keeps dotted identifiers in stack traces (foo.bar.baz) from matching.
const JWT_RE = /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g;

export function redact(value: string): string {
  return redactNames(
    value
      .replace(BEARER_RE, `Bearer ${REDACTED}`)
      .replace(JWT_RE, REDACTED)
      .replace(STUDENT_ID_RE, REDACTED),
    nameMatcher,
  );
}

// Breadcrumb data, request bodies and frame vars are arbitrary JSON-ish input.
// Bound the walk so a deep object cannot make beforeSend expensive. An object
// nested at or beyond MAX_DEPTH is replaced whole with REDACTED: losing a deep
// subtree from a crash report is the right trade against shipping it unscrubbed.
// A string at that depth is still scrubbed by redact(), not replaced whole.
const MAX_DEPTH = 6;

// `copies` maps each source object to its redacted copy. A repeated reference
// (the same object under two keys) gets the same redacted copy, never the
// original. The copy is registered before its children are walked, so a cycle
// resolves to the in-progress copy instead of recursing.
function redactDeep(
  value: unknown,
  depth = 0,
  copies = new WeakMap<object, unknown>(),
): unknown {
  if (typeof value === 'string') return redact(value);
  if (value === null || typeof value !== 'object') return value;

  const cached = copies.get(value);
  if (cached !== undefined) return cached;
  if (depth >= MAX_DEPTH) return REDACTED;

  if (Array.isArray(value)) {
    const out: unknown[] = [];
    copies.set(value, out);
    for (const item of value) out.push(redactDeep(item, depth + 1, copies));
    return out;
  }
  const out: Record<string, unknown> = {};
  copies.set(value, out);
  for (const [key, item] of Object.entries(value)) {
    out[key] = isGradeKey(key) ? REDACTED : redactDeep(item, depth + 1, copies);
  }
  return out;
}

// Endpoints whose bodies no pattern can scrub, so every body is dropped whole.
// A request keeps only its URL and method; a breadcrumb only its URL, method
// and status code.
//   /student/course-notes — free text a student writes about a class.
//   /student/password     — the current and new passwords going up, a new
//                           refresh token (a bare UUID, which no pattern
//                           here matches) coming back.
const PRIVATE_BODY_RE = /\/student\/(course-notes|password)\b/;
const BREADCRUMB_KEEP = ['url', 'method', 'status_code'];

export function hasPrivateBody(url: unknown): boolean {
  return typeof url === 'string' && PRIVATE_BODY_RE.test(url);
}

type SentryOptions = NonNullable<Parameters<typeof Sentry.init>[0]>;
type BeforeSend = NonNullable<SentryOptions['beforeSend']>;
type BeforeBreadcrumb = NonNullable<SentryOptions['beforeBreadcrumb']>;

export const scrubEvent: BeforeSend = (event) => {
  try {
    if (typeof event.message === 'string') {
      event.message = redact(event.message);
    }

    for (const exception of event.exception?.values ?? []) {
      if (typeof exception.value === 'string') {
        exception.value = redact(exception.value);
      }
      for (const frame of exception.stacktrace?.frames ?? []) {
        if (frame.vars) {
          frame.vars = redactDeep(frame.vars) as typeof frame.vars;
        }
      }
    }

    for (const crumb of event.breadcrumbs ?? []) {
      if (typeof crumb.message === 'string') {
        crumb.message = redact(crumb.message);
      }
      if (crumb.data && hasPrivateBody(crumb.data.url)) {
        crumb.data = Object.fromEntries(
          Object.entries(crumb.data).filter(([k]) => BREADCRUMB_KEEP.includes(k)),
        ) as typeof crumb.data;
      }
      if (crumb.data) {
        crumb.data = redactDeep(crumb.data) as typeof crumb.data;
      }
    }

    const request = event.request;
    if (request) {
      if (typeof request.url === 'string') {
        request.url = redact(request.url);
      }
      if (request.headers) {
        request.headers = redactDeep(request.headers) as typeof request.headers;
      }
      if (request.query_string) {
        request.query_string = redactDeep(request.query_string) as typeof request.query_string;
      }
      if (request.data !== undefined) {
        request.data = hasPrivateBody(request.url) ? REDACTED : redactDeep(request.data);
      }
    }

    return event;
  } catch {
    // A throw here would drop the crash report entirely. Ship it unscrubbed
    // rather than lose it; sendDefaultPii: false still applies.
    return event;
  }
};

export const filterBreadcrumb: BeforeBreadcrumb = (breadcrumb) => {
  // Console breadcrumbs are the most likely carrier of a logged response body
  // and are worth nothing in a production crash report.
  if (breadcrumb.category === 'console') return null;
  // A course-notes or password request is recorded as URL, method and status
  // only (see above).
  if (breadcrumb.data && hasPrivateBody(breadcrumb.data.url)) {
    breadcrumb.data = Object.fromEntries(
      Object.entries(breadcrumb.data).filter(([k]) => BREADCRUMB_KEEP.includes(k)),
    );
  }
  return breadcrumb;
};

export function initSentry() {
  // Follow sign-in, profile load and sign-out: the name to remove is always the
  // current student's, and nobody's once signed out.
  const follow = (student: ReturnType<typeof useAuthStore.getState>['student']) =>
    setReportedStudentName(student?.firstName, student?.lastName);
  follow(useAuthStore.getState().student);
  useAuthStore.subscribe((state, prev) => {
    if (state.student !== prev.student) follow(state.student);
  });

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__, // Only report in production/preview builds, not dev
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    sendDefaultPii: false, // Don't send personally identifiable info
    beforeSend: scrubEvent,
    beforeBreadcrumb: filterBreadcrumb,
  });
}
