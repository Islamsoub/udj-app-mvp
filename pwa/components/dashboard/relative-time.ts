import { calendarDaysBetween } from '@/lib/teaching-week';

/**
 * How a notification's time is written (dashboard.html:111-113): the time today,
 * "Hier" yesterday, the weekday within the week, a date before that.
 *
 * CALENDAR days, from lib/teaching-week like the countdown pill: 23:50 last
 * night is "Hier" at 00:10, not "00:10 hours ago". The stored instant is UTC;
 * it is read here in the device's local time, per the project's time rule.
 *
 * A time in the future (a skewed device clock) is treated as today rather than
 * as "in 2 days", which no notification can be.
 */
export type NotificationWhen =
  | { kind: 'time'; hours: string; minutes: string }
  | { kind: 'yesterday' }
  | { kind: 'weekday'; date: Date }
  | { kind: 'date'; date: Date };

export function notificationWhen(iso: string, now: number): NotificationWhen {
  const date = new Date(iso);
  const days = Math.max(0, calendarDaysBetween(date, new Date(now)));

  if (days === 0) {
    return {
      kind: 'time',
      hours: String(date.getHours()).padStart(2, '0'),
      minutes: String(date.getMinutes()).padStart(2, '0'),
    };
  }
  if (days === 1) return { kind: 'yesterday' };
  // 2-6 days ago: a weekday name is unambiguous. At 7 the same name would mean
  // today's weekday a week ago, so from there it is a date.
  if (days < 7) return { kind: 'weekday', date };
  return { kind: 'date', date };
}
