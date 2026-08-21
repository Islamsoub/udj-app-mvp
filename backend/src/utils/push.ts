import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { NotificationType, Prisma } from '@prisma/client';
import prisma from './prisma';

const expo = new Expo();

/**
 * Maps a notification category to the Student column that opts out of it.
 *
 * The three toggles in Settings were written to the Student row and then never
 * read by any send path — a student who turned off grade alerts kept receiving
 * them. NEWS and GENERAL have no toggle in the UI and are always delivered.
 */
const PREFERENCE_COLUMN: Partial<Record<NotificationType, keyof Prisma.StudentWhereInput>> = {
  [NotificationType.GRADES]: 'notifGrades',
  [NotificationType.SCHEDULE]: 'notifCourses',
  [NotificationType.ATTENDANCE]: 'notifAttendance',
};

export async function sendPushNotifications(
  studentIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
  if (studentIds.length === 0) return { sent: 0, failed: 0 };

  // Drop recipients who opted out of this category before looking up tokens.
  const type = data?.type as NotificationType | undefined;
  const preferenceColumn = type ? PREFERENCE_COLUMN[type] : undefined;

  let recipientIds = studentIds;
  if (preferenceColumn) {
    const optedIn = await prisma.student.findMany({
      where: { id: { in: studentIds }, [preferenceColumn]: true },
      select: { id: true },
    });
    recipientIds = optedIn.map((s) => s.id);
    if (recipientIds.length === 0) return { sent: 0, failed: 0 };
  }

  // Get all push tokens for the remaining students
  const tokens = await prisma.pushToken.findMany({
    where: { studentId: { in: recipientIds } },
    select: { token: true, studentId: true },
  });

  if (tokens.length === 0) return { sent: 0, failed: 0 };

  // Build messages (only valid Expo push tokens)
  const messages: ExpoPushMessage[] = [];
  for (const { token } of tokens) {
    if (!Expo.isExpoPushToken(token)) continue;
    messages.push({
      to: token,
      sound: 'default',
      title,
      body,
      data: data ?? {},
    });
  }

  if (messages.length === 0) return { sent: 0, failed: 0 };

  // Send in chunks (Expo recommends max 100 per request)
  const chunks = expo.chunkPushNotifications(messages);
  let sent = 0;
  let failed = 0;

  for (const chunk of chunks) {
    try {
      const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);
      for (const ticket of tickets) {
        if (ticket.status === 'ok') sent++;
        else failed++;
      }
    } catch (err) {
      console.error('Push notification chunk failed:', err);
      failed += chunk.length;
    }
  }

  // Clean up invalid tokens
  // (In a production system you'd check receipts after ~15min,
  //  but for v1 this is sufficient)

  return { sent, failed };
}
