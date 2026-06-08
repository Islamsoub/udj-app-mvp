/** Minimum attendance rate required (85 %) — absence rate is 1 − this */
export const ATTENDANCE_THRESHOLD = 0.85;

/** Maximum allowed absence rate per subject */
export const MAX_ABSENCE_RATE = 1 - ATTENDANCE_THRESHOLD; // 0.15

/** Remaining absences at or below this count triggers a warning before the limit is hit */
export const WARN_BUFFER = 2;

/** Overall percentage at or above this → "regular" badge */
export const BADGE_REGULAR_PCT = 85;

/** Overall percentage at or above this (but below BADGE_REGULAR_PCT) → "warning" badge */
export const BADGE_WARNING_PCT = 75;
