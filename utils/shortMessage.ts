import { Alert, Platform, ToastAndroid } from 'react-native';

/**
 * A short, transient message ("L'article n'a pas pu être enregistré.").
 * Android, the primary platform, has a native toast that disappears on its own
 * and does not block the screen. iOS has none, so it falls back to a plain
 * alert with one OK button.
 */
export function showShortMessage(message: string): void {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  Alert.alert(message);
}
