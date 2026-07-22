import { NotificationType, Prisma } from '@prisma/client';
import prisma from './prisma';
import { sendPushNotifications } from './push';

/**
 * Creates one in-app Notification row per recipient student.
 *
 * Reused by every admin route that fires an automated notification (grade
 * publication, schedule change, justification approve/reject, urgent / opt-in
 * news) so the recipient shape and the NotificationType mapping stay identical
 * everywhere (architecture doc §6.1).
 *
 * Callers pass both the French and Arabic copy; the mobile notification screen
 * renders whichever matches the user's active language. Push notifications carry
 * no language switching, so they use the French strings only.
 *
 * Pass a transaction client as the last argument to enrol these writes in an
 * outer `$transaction` (e.g. grade publication, where the publish + notify must
 * commit atomically). Defaults to the shared prisma client.
 *
 * @returns the number of notifications created.
 */
export async function createNotification(
  studentIds: string[],
  type: NotificationType,
  titleFr: string,
  bodyFr: string,
  titleAr: string,
  bodyAr: string,
  client: Prisma.TransactionClient = prisma
): Promise<number> {
  const uniqueIds = Array.from(new Set(studentIds));
  if (uniqueIds.length === 0) return 0;

  const result = await client.notification.createMany({
    data: uniqueIds.map((studentId) => ({
      studentId,
      type,
      titleFr,
      titleAr,
      bodyFr,
      bodyAr,
    })),
  });

  // After the DB write, send push notifications
  // (fire-and-forget — don't block the response on push delivery).
  // Push has no language switching, so it uses the French copy.
  sendPushNotifications(uniqueIds, titleFr, bodyFr, { type })
    .then((pushResult) => {
      console.info(`Push sent: ${pushResult.sent} delivered, ${pushResult.failed} failed`);
    })
    .catch((err) => {
      console.error('Push notification dispatch failed:', err);
    });

  return result.count;
}
