import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// SecureStore keys for the user's biometric-login preference.
// Never store passwords here — biometric re-auth relies on the refresh token only.
export const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
export const BIOMETRIC_ASKED_KEY = 'biometric_asked';

/** Device has biometric hardware AND the user has enrolled at least one fingerprint/face. */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const [compatible, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return compatible && enrolled;
  } catch {
    return false;
  }
}

/** The user has explicitly opted in to biometric login on a previous session. */
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)) === 'true';
  } catch {
    return false;
  }
}

/** Whether we've already prompted the user to enable biometric login (Yes or No). */
export async function hasBeenAskedBiometric(): Promise<boolean> {
  try {
    return (
      (await SecureStore.getItemAsync(BIOMETRIC_ASKED_KEY)) === 'true' ||
      (await isBiometricEnabled())
    );
  } catch {
    return false;
  }
}

/** Opt in to biometric login. */
export async function enableBiometric(): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
  await SecureStore.setItemAsync(BIOMETRIC_ASKED_KEY, 'true');
}

/** Record that the user declined biometric login so we never ask again. */
export async function markBiometricAsked(): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRIC_ASKED_KEY, 'true');
}

/** Prompt the OS biometric dialog. Caller must check `.success`. */
export function authenticateBiometric(
  promptMessage: string,
  cancelLabel: string
): Promise<LocalAuthentication.LocalAuthenticationResult> {
  return LocalAuthentication.authenticateAsync({
    promptMessage,
    cancelLabel,
    disableDeviceFallback: false,
  });
}
