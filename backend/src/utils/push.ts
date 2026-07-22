import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import prisma from './prisma';

const expo = new Expo();

export async function sendPushNotifications(
  studentIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
  if (studentIds.length === 0) return { sent: 0, failed: 0 };

  // Get all push tokens for these students
  const tokens = await prisma.pushToken.findMany({
    where: { studentId: { in: studentIds } },
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
