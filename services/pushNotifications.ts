import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1D9E75',
    });
  }

  try {
    await api.post('/student/push-token', { token: tokenData.data });
  } catch {
    // Push token registration failed — non-fatal, retried on next launch
  }

  return tokenData.data;
}

export function setupNotificationListeners(
  onNotificationReceived?: (notification: Notifications.Notification) => void,
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void
): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    onNotificationReceived?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    onNotificationResponse?.(response);
  });

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

export function isQuietHours(start: string | null, end: string | null): boolean {
  if (!start || !end) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  const startMinutes = startH * 60 + (startM ?? 0);
  const endMinutes = endH * 60 + (endM ?? 0);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  }
  // Overnight range (e.g. 22:00 → 07:00)
  return currentMinutes >= startMinutes || currentMinutes < endMinutes;
}
