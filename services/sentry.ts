import * as Sentry from '@sentry/react-native';

const SENTRY_DSN =
  'https://c557bb7db56036263c93e0f6bfa60633@o4511608504320000.ingest.de.sentry.io/4511608512053328';

// ── PII scrubbing ───────────────────────────────────────────────────────────
// Safety net, not a primary control: the app never calls setUser / setTag /
// setContext / addBreadcrumb, and sendDefaultPii is false. This only catches
// identifiers that reach an event by accident (an error message that embeds a
// matricule, a breadcrumb that carries a token). Names and grades are not
// matched by pattern on purpose — a bare number is not identifying, and the
// false positives would destroy our own stack traces.

export const REDACTED = '[redacted]';

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
  return value
    .replace(BEARER_RE, `Bearer ${REDACTED}`)
    .replace(JWT_RE, REDACTED)
    .replace(STUDENT_ID_RE, REDACTED);
}

// Breadcrumb data, request bodies and frame vars are arbitrary JSON-ish input.
// Bound the walk so a deep object cannot make beforeSend expensive.
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
  if (depth >= MAX_DEPTH) return value;

  if (Array.isArray(value)) {
    const out: unknown[] = [];
    copies.set(value, out);
    for (const item of value) out.push(redactDeep(item, depth + 1, copies));
    return out;
  }
  const out: Record<string, unknown> = {};
  copies.set(value, out);
  for (const [key, item] of Object.entries(value)) {
    out[key] = redactDeep(item, depth + 1, copies);
  }
  return out;
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
        request.data = redactDeep(request.data);
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
  return breadcrumb;
};

export function initSentry() {
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__, // Only report in production/preview builds, not dev
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    sendDefaultPii: false, // Don't send personally identifiable info
    beforeSend: scrubEvent,
    beforeBreadcrumb: filterBreadcrumb,
  });
}
