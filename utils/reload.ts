import { Platform } from 'react-native';

export async function reloadApp(): Promise<void> {
  if (__DEV__) {
    const { DevSettings } = require('react-native');
    DevSettings.reload();
  } else {
    const Updates = require('expo-updates');
    await Updates.reloadAsync();
  }
}
