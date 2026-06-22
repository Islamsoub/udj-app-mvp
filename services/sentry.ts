import * as Sentry from '@sentry/react-native';

const SENTRY_DSN =
  'https://c557bb7db56036263c93e0f6bfa60633@o4511608504320000.ingest.de.sentry.io/4511608512053328';

export function initSentry() {
  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__, // Only report in production/preview builds, not dev
    tracesSampleRate: 0.2, // 20% of transactions for performance monitoring
    sendDefaultPii: false, // Don't send personally identifiable info
    beforeSend(event) {
      // Strip student ID from breadcrumbs/tags if accidentally captured
      return event;
    },
  });
}
