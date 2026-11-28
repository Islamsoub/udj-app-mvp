import * as SecureStore from 'expo-secure-store';
import { getQrToken } from '@/services/api';
import { liveCode, offlineCode, usableOffline, type CardCode } from '@/utils/cardCode';

// The student card's QR code: the live one from the server when online, the
// stored 24 h offline one when not (utils/cardCode.ts explains both).
//
// The offline code is a credential for a day, so it lives in SecureStore, not
// SQLite or AsyncStorage, and logout deletes it (clearCardCode).

const OFFLINE_CARD_KEY = 'card_offline_code_v1';

/** Live code from the server; the offline one is stored on the way. */
export async function fetchCardCode(): Promise<CardCode> {
  const res = await getQrToken();
  const offline = offlineCode(res);
  if (offline) {
    try {
      await SecureStore.setItemAsync(OFFLINE_CARD_KEY, JSON.stringify(offline));
    } catch {
      // Not fatal: the live code is still shown; offline just has nothing new.
    }
  }
  return liveCode(res);
}

/** The stored offline code if it is still valid, else null. */
export async function loadOfflineCardCode(): Promise<CardCode | null> {
  try {
    return usableOffline(await SecureStore.getItemAsync(OFFLINE_CARD_KEY));
  } catch {
    return null;
  }
}

export async function clearCardCode(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(OFFLINE_CARD_KEY);
  } catch {
    // Logout must not fail on this.
  }
}
