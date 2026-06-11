import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StatusBar,
  Animated,
  ActivityIndicator,
  Linking,
  Alert,
  Keyboard,
  AppState,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts, spacing, radius, sizing, withAlpha, colors, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { login, restoreSession } from '@/services/auth';
import { REFRESH_KEY } from '@/stores/authStore';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  hasBeenAskedBiometric,
  enableBiometric,
  markBiometricAsked,
  authenticateBiometric,
} from '@/services/biometric';

const LogoSVG = (
  require('@/assets/icons/Logo.svg') as { default: React.FC<{ width: number; height: number }> }
).default;

type LoginState =
  | 'default'
  | 'submitting'
  | 'network-error'
  | 'error'
  | 'locked-out'
  | 'session-expired'
  | 'skeleton';

const ALL_STATES: LoginState[] = [
  'default',
  'submitting',
  'network-error',
  'error',
  'locked-out',
  'session-expired',
  'skeleton',
];
const STATE_LABELS: Record<LoginState, string> = {
  'default':         'default',
  'submitting':      'submitting',
  'network-error':   'network-error',
  'error':           'error',
  'locked-out':      'locked-out',
  'session-expired': 'session-expired',
  'skeleton':        'skeleton',
};

// One-off RGBA values not expressible as opaque hex tokens in theme.ts
// On-gradient: white blobs layered over jade hero gradient (#FFFFFF literal)
const BLOB_1 = withAlpha('#FFFFFF', 0.07);
const BLOB_2 = withAlpha('#FFFFFF', 0.06);
const BLOB_3 = withAlpha('#FFFFFF', 0.05);
const WHITE_78 = withAlpha('#FFFFFF', 0.78); // tagline on jade hero
const WHITE_15 = withAlpha(colors.white, 0.15);
const WHITE_40 = withAlpha(colors.white, 0.4);
const WHITE_60 = withAlpha(colors.white, 0.6);
const SKELETON_BG = withAlpha(colors.skeletonBox, 0.6);

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [loginState, setLoginState] = useState<LoginState>('default');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(5 * 60);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [biometricVisible, setBiometricVisible] = useState(false);
  const [lastStudentName, setLastStudentName] = useState<string | null>(null);
  const [lastStudentId, setLastStudentId] = useState<string | null>(null);
  const [studentIdFocused, setStudentIdFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const savedInitials = useMemo(() => {
    if (!lastStudentName) return '?';
    const parts = lastStudentName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return (parts[0]?.[0] ?? '?').toUpperCase();
  }, [lastStudentName]);

  const lockedUntilRef = useRef<number>(0);
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const passwordRef = useRef<TextInput>(null);

  // Show the biometric button only when the device supports it, the user opted in,
  // AND a refresh token exists to restore the session against.
  // After logout the preference flag survives but the token is deleted — without this
  // third check the button would appear but always fail (restoreSession returns false
  // immediately with no token).
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [available, enabled, token] = await Promise.all([
        isBiometricAvailable(),
        isBiometricEnabled(),
        SecureStore.getItemAsync(REFRESH_KEY),
      ]);
      if (mounted) setBiometricVisible(available && enabled && token !== null);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load the last logged-in student's identity for session-expired display.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [name, id] = await Promise.all([
        AsyncStorage.getItem('lastStudentName'),
        AsyncStorage.getItem('lastStudentId'),
      ]);
      if (mounted) {
        setLastStudentName(name);
        setLastStudentId(id);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Locked-out countdown — ticks recalculate from the absolute deadline so
  // skipped wall-clock time (screen off, app backgrounded) is accounted for.
  useEffect(() => {
    if (loginState !== 'locked-out') {
      setCountdown(5 * 60);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((lockedUntilRef.current - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        setLoginState('default');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [loginState]);

  // Recalculate the countdown immediately when the app returns to the foreground
  // so a paused screen doesn't show stale time.
  useEffect(() => {
    if (loginState !== 'locked-out') return;
    const sub = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState !== 'active') return;
      const remaining = Math.max(0, Math.round((lockedUntilRef.current - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining === 0) setLoginState('default');
    });
    return () => sub.remove();
  }, [loginState]);

  // Skeleton pulse animation
  useEffect(() => {
    if (loginState !== 'skeleton') {
      pulseAnim.setValue(0.4);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [loginState, pulseAnim]);

  const formatCountdown = (secs: number): string => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // After a successful password login, offer to enable biometric login — once.
  const maybePromptBiometricSetup = async (): Promise<void> => {
    const available = await isBiometricAvailable();
    if (!available) return;
    if (await hasBeenAskedBiometric()) return;

    await new Promise<void>((resolve) => {
      Alert.alert(
        t('auth.biometricSetupTitle'),
        t('auth.biometricSetupMessage'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
            onPress: () => {
              void markBiometricAsked().finally(resolve);
            },
          },
          {
            text: t('auth.biometricEnable'),
            onPress: () => {
              void enableBiometric().finally(resolve);
            },
          },
        ],
        { cancelable: false }
      );
    });
  };

  const loginHandler = async (): Promise<void> => {
    Keyboard.dismiss();
    setLoginState('submitting');
    try {
      await login(studentId.trim(), password);
      await maybePromptBiometricSetup();
      router.replace('/(tabs)/home');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data as { attemptsLeft?: number; lockedUntil?: string } | undefined;
        if (status === 401) {
          setAttemptsLeft(data?.attemptsLeft ?? null);
          setLoginState('error');
        } else if (status === 423) {
          if (data?.lockedUntil) {
            lockedUntilRef.current = new Date(data.lockedUntil).getTime();
            const secsRemaining = Math.max(
              0,
              Math.round((lockedUntilRef.current - Date.now()) / 1000)
            );
            setCountdown(secsRemaining);
          }
          setLoginState('locked-out');
        } else {
          setLoginState('network-error');
        }
      } else {
        setLoginState('network-error');
      }
    }
  };

  const biometricHandler = async (): Promise<void> => {
    Keyboard.dismiss();
    // Guard against a device that lost biometric capability since opt-in.
    const available = await isBiometricAvailable();
    if (!available) {
      setBiometricVisible(false);
      Alert.alert(t('auth.biometricSetupTitle'), t('auth.biometricNotAvailable'));
      return;
    }

    const result = await authenticateBiometric(
      t('auth.biometricConfirm'),
      t('common.cancel')
    );

    if (!result.success) {
      // Silent on user/system cancellation; alert only on a genuine failure.
      if (
        result.error &&
        result.error !== 'user_cancel' &&
        result.error !== 'system_cancel' &&
        result.error !== 'app_cancel'
      ) {
        Alert.alert(t('auth.biometricSetupTitle'), t('auth.biometricFailed'));
      }
      return;
    }

    // Identity confirmed — restore the session from the stored refresh token.
    setLoginState('submitting');
    const restored = await restoreSession();
    if (restored) {
      router.replace('/(tabs)/home');
    } else {
      // If the refresh token still exists, restoreSession failed due to a network error.
      // If it's gone, the server rejected it (401) and deleted it — the session truly expired.
      const tokenStillExists = await SecureStore.getItemAsync(REFRESH_KEY);
      if (tokenStillExists !== null) {
        setLoginState('network-error');
      } else {
        setLoginState('session-expired');
      }
    }
  };

  const isSkeleton = loginState === 'skeleton';
  const isLocked = loginState === 'locked-out';
  const isSubmitting = loginState === 'submitting';
  const isError = loginState === 'error';
  const isNetworkError = loginState === 'network-error';
  const isSessionExpired = loginState === 'session-expired';

  const showSubtitle = loginState === 'default';
  const inputsEditable = !isSubmitting && !isLocked && !isNetworkError;

  const idleInputStyle = { backgroundColor: colors.surface, borderColor: colors.hair };
  const focusedInputStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.jade400,
    shadowColor: colors.jade400,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 4,
    shadowOpacity: 0.15,
    elevation: 2,
  };
  const errorInputStyle = { backgroundColor: colors.dangerBg, borderColor: colors.danger };
  const disabledInputStyle = { backgroundColor: colors.sunken, borderColor: colors.hair };

  const getInputStyle = (isFocused: boolean, editable = inputsEditable) => {
    if (isError) return errorInputStyle;
    if (!editable) return disabledInputStyle;
    if (isFocused) return focusedInputStyle;
    return idleInputStyle;
  };

  const studentIdInputStyle = getInputStyle(studentIdFocused);
  const passwordInputStyle = getInputStyle(passwordFocused);

  const buttonDisabled = isSubmitting || isLocked;
  const buttonBg = isLocked ? colors.sunken : colors.jade400;
  const showButtonShadow = !buttonDisabled;
  const buttonTextGrey = isLocked;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.jade400} translucent={false} />

      <KeyboardAwareScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(spacing.sp64, insets.bottom + spacing.sp16) }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO GRADIENT — #1D9E75 → #0B5544 at ~155° ── */}
        <LinearGradient
          colors={['#1D9E75', '#0B5544']}
          start={{ x: 0.71, y: 0.05 }}
          end={{ x: 0.29, y: 0.95 }}
          style={styles.greenBlock}
        >
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.blob1} />
            <View style={styles.blob2} />
            <View style={styles.blob3} />
          </View>

          {isSkeleton ? (
            <Animated.View style={[styles.greenContent, { opacity: pulseAnim, paddingTop: insets.top + 26, paddingBottom: 56 }]}>
              <View style={[styles.skeletonBox, { width: 87, height: 81, borderRadius: 14 }]} />
              <View style={[styles.skeletonBox, { width: 158, height: 20, borderRadius: 18, marginTop: 12 }]} />
              <View style={[styles.skeletonBox, { width: 207, height: 20, borderRadius: 18, marginTop: 8 }]} />
            </Animated.View>
          ) : (
            <View style={[styles.greenContent, { paddingTop: insets.top + 26, paddingBottom: 56 }]}>
              <LogoSVG width={63} height={92} />
              <Text style={styles.greenTitle} numberOfLines={1}>{t('auth.universityName')}</Text>
              {showSubtitle && (
                <Text style={styles.greenSubtitle}>{t('auth.subtitle')}</Text>
              )}
            </View>
          )}
        </LinearGradient>

        {/* ── OFFLINE BANNER (network-error only) ── */}
        <OfflineBanner />

        {/* ── FORM SHEET ── */}
        <View style={[styles.body, { paddingBottom: Math.max(96, insets.bottom + 48) }]}>

          {/* ── SKELETON BODY ── */}
          {isSkeleton && (
            <Animated.View style={{ opacity: pulseAnim }}>
              <View style={[styles.skeletonBox, styles.skeletonLabel]} />
              <View style={[styles.skeletonBox, styles.skeletonInput]} />
              <View style={[styles.skeletonBox, styles.skeletonLabel, { marginTop: spacing.sp16 }]} />
              <View style={[styles.skeletonBox, styles.skeletonInput]} />
              <View style={[styles.skeletonBox, styles.skeletonButton, { marginTop: spacing.sp20 }]} />
              <View style={styles.skeletonDivRow}>
                <View style={[styles.skeletonBox, { width: 26, height: 10, borderRadius: 18 }]} />
              </View>
              <View style={styles.skeletonCircleRow}>
                <View style={[styles.skeletonBox, { width: 44, height: 44, borderRadius: radius.rFull }]} />
              </View>
              <View style={styles.skeletonHelpRow}>
                <View style={[styles.skeletonBox, { width: 183, height: 15, borderRadius: 18 }]} />
              </View>
            </Animated.View>
          )}

          {!isSkeleton && (
            <>
              {/* ── LOCKOUT CARD ── */}
              {isLocked && (
                <View style={styles.lockoutCard}>
                  <Ionicons name="alert-circle" size={34} color={colors.warning} />
                  <Text style={styles.lockoutTitle}>{t('auth.lockedTitle')}</Text>
                  <Text style={styles.lockoutSubtitle}>{t('auth.lockedSubtitle')}</Text>
                  <Text style={styles.lockoutTimer}>{formatCountdown(countdown)}</Text>
                  <Text style={styles.lockoutMinutes}>{t('auth.lockedMinutesLeft')}</Text>
                </View>
              )}

              {/* ── SESSION-EXPIRED CARD + SAVED ACCOUNT ── */}
              {isSessionExpired && (
                <>
                  <View style={styles.sessionCard}>
                    <View style={styles.sessionRow}>
                      <View style={styles.keyChip}>
                        <Ionicons name="key-outline" size={22} color={colors.jadeText} />
                      </View>
                      <View style={styles.sessionTexts}>
                        <Text style={styles.sessionTitle}>{t('common.session.title')}</Text>
                        <Text style={styles.sessionBody}>{t('auth.session_body')}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.savedRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>{savedInitials}</Text>
                    </View>
                    <View style={styles.savedInfo}>
                      <Text style={styles.savedName}>{lastStudentName ?? t('auth.yourAccount')}</Text>
                      <Text style={styles.savedId}>{lastStudentId ?? ''}</Text>
                    </View>
                    <Pressable onPress={() => setLoginState('default')} hitSlop={8} style={({ pressed }) => pressed && { backgroundColor: withAlpha(colors.jade400, 0.15), borderRadius: 6 }}>
                      <Text style={styles.changerText}>{t('auth.change_account')}</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* ── STUDENT ID INPUT (all states except locked-out + session-expired) ── */}
              {!isLocked && !isSessionExpired && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('auth.studentId')}</Text>
                  <TextInput
                    style={[styles.textInput, styles.monoInput, studentIdInputStyle]}
                    value={studentId}
                    onChangeText={setStudentId}
                    placeholder="UDJ-2024-0432"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="default"
                    autoCapitalize="characters"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    onFocus={() => setStudentIdFocused(true)}
                    onBlur={() => setStudentIdFocused(false)}
                    editable={inputsEditable}
                  />
                </View>
              )}

              {/* ── LOCKED-OUT: disabled input ── */}
              {isLocked && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('auth.password')}</Text>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput, styles.textInputDisabled]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textTertiary}
                    editable={false}
                  />
                </View>
              )}

              {/* ── PASSWORD INPUT (default / submitting / network-error / error) ── */}
              {!isLocked && !isSessionExpired && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('auth.password')}</Text>
                  <TextInput
                    ref={passwordRef}
                    style={[styles.textInput, styles.passwordInput, passwordInputStyle]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="go"
                    onSubmitEditing={loginHandler}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    editable={inputsEditable}
                  />
                </View>
              )}

              {/* ── SESSION-EXPIRED: password input ── */}
              {isSessionExpired && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{t('auth.password')}</Text>
                  <TextInput
                    ref={passwordRef}
                    style={[styles.textInput, styles.passwordInput, getInputStyle(passwordFocused, true)]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor={colors.textTertiary}
                    returnKeyType="go"
                    onSubmitEditing={loginHandler}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    editable
                  />
                </View>
              )}

              {/* ── ERROR CARD ── */}
              {isError && (
                <View style={styles.errorCard}>
                  <View style={styles.cardRow}>
                    <Ionicons name="alert-circle-outline" size={22} color={colors.warning} />
                    <View style={styles.cardTexts}>
                      <Text style={styles.errorCardTitle}>{t('auth.wrongCredentials')}</Text>
                      {attemptsLeft !== null && (
                        <Text style={styles.errorCardBody}>
                          {t('auth.attemptsLeft', { count: attemptsLeft })}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* ── PRIMARY BUTTON ── */}
              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  { backgroundColor: buttonBg },
                  showButtonShadow && styles.loginButtonShadow,
                  pressed && !buttonDisabled && { backgroundColor: colors.jade600 },
                ]}
                onPress={isNetworkError ? () => setLoginState('default') : loginHandler}
                disabled={buttonDisabled}
                hitSlop={8}
              >
                {isSubmitting ? (
                  <ActivityIndicator size={22} color={colors.surface} />
                ) : (
                  <Text style={[styles.loginButtonText, buttonTextGrey && styles.loginButtonTextGrey]}>
                    {isError || isNetworkError ? t('common.retry') : t('auth.login')}
                  </Text>
                )}
              </Pressable>

              {/* ── NETWORK INFO CARD (below button) ── */}
              {isNetworkError && (
                <View style={styles.networkCard}>
                  <View style={styles.cardRow}>
                    <Ionicons name="globe-outline" size={22} color={colors.slate} />
                    <Text style={styles.networkCardText}>{t('auth.network_required')}</Text>
                  </View>
                </View>
              )}

              {/* ── LOCKED-OUT: help link ── */}
              {isLocked && (
                <Pressable
                  hitSlop={8}
                  style={({ pressed }) => [styles.helpLink, pressed && { backgroundColor: withAlpha(colors.jade400, 0.15), borderRadius: 6 }]}
                  onPress={() => void Linking.openURL('mailto:support@univ-djibouti.dj?subject=Compte%20verrouill%C3%A9')}
                >
                  <Text style={styles.helpLinkText}>{t('auth.helpContact')}</Text>
                </Pressable>
              )}

              {/* ── DIVIDER + BIOMETRIC (default, hardware available + opted in) ── */}
              {(loginState === 'default' || loginState === 'session-expired') && biometricVisible && (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>{t('auth.or')}</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <View style={styles.biometricContainer}>
                    <Pressable
                      style={({ pressed }) => [styles.biometricCircle, pressed && { backgroundColor: withAlpha(colors.jade400, 0.15), borderRadius: 999 }]}
                      onPress={biometricHandler}
                      hitSlop={8}
                    >
                      <Ionicons name="finger-print" size={26} color={colors.jadeText} />
                    </Pressable>
                    <Text style={styles.biometricLabel}>{t('auth.biometric_label')}</Text>
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </KeyboardAwareScrollView>

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={loginState}
        onChange={setLoginState}
      />
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.sp64,
  },

  // ── Hero gradient block ──
  greenBlock: {
    overflow: 'hidden',
    alignItems: 'center',
  },
  blob1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: BLOB_1,
    top: -40,
    start: -40,
  },
  blob2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: BLOB_2,
    top: -60,
    end: -50,
  },
  blob3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: BLOB_3,
    bottom: -40,
    start: 60,
  },
  greenContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.sp24,
  },
  greenTitle: {
    fontFamily: fonts.sans,
    fontSize: 21,
    fontWeight: '800',
    color: '#FFFFFF', // on-gradient literal
    letterSpacing: -0.4,
    textAlign: 'center',
    marginTop: 18,
  },
  greenSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: WHITE_78,
    textAlign: 'center',
    marginTop: spacing.sp6,
  },

  // ── Form sheet ──
  body: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30, // design constant: login sheet radius
    borderTopRightRadius: 30, // design constant: login sheet radius
    marginTop: -28,
    // upward lift shadow
    shadowColor: '#101614',
    shadowOffset: { width: 0, height: -10 },
    shadowRadius: 30,
    shadowOpacity: 0.07,
    elevation: 8,
    paddingHorizontal: 22,
    paddingTop: 28,
    flex: 1,
    minHeight: 400,
  },

  // ── Inputs ──
  inputGroup: {
    marginBottom: spacing.sp16,
  },
  inputLabel: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sp6,
  },
  textInput: {
    height: 54, // design constant: input height
    borderRadius: radius.rBtn, // 14
    borderWidth: 1.5,
    paddingHorizontal: spacing.sp16,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.textPrimary,
  },
  monoInput: {
    fontFamily: fonts.mono,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  passwordInput: {
    fontSize: 15.5,
    letterSpacing: 3,
  },
  textInputDisabled: {
    backgroundColor: colors.sunken,
    borderColor: colors.hair,
    color: colors.textTertiary,
  },
  // ── Login button ──
  loginButton: {
    height: 56,
    borderRadius: 16, // login CTA radius
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp8,
  },
  loginButtonShadow: {
    // jade glow — login CTA only
    shadowColor: '#0F6E56',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    shadowOpacity: 0.28,
    elevation: 6,
  },
  loginButtonText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
  },
  loginButtonTextGrey: {
    color: colors.textSecondary,
  },

  // ── Error card ──
  errorCard: {
    borderRadius: radius.rBtn,
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.warning,
    paddingVertical: spacing.sp14,
    paddingHorizontal: spacing.sp16,
    marginBottom: spacing.sp16,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sp12,
  },
  cardTexts: {
    flex: 1,
  },
  errorCardTitle: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: spacing.sp4,
  },
  errorCardBody: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // ── Network card ──
  networkCard: {
    borderRadius: radius.rBtn,
    backgroundColor: colors.slateBg,
    borderWidth: 1,
    borderColor: colors.slate,
    paddingVertical: spacing.sp14,
    paddingHorizontal: spacing.sp16,
    marginTop: spacing.sp12,
  },
  networkCardText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },

  // ── Lockout card ──
  lockoutCard: {
    borderRadius: radius.rTile,
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.sp20,
    marginTop: spacing.sp24,
    marginBottom: spacing.sp24,
    alignItems: 'center',
  },
  lockoutTitle: {
    fontFamily: fonts.sans,
    fontSize: 17,
    fontWeight: '700',
    color: colors.warningDeep,
    textAlign: 'center',
    marginTop: spacing.sp8,
  },
  lockoutSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.warningDeep,
    textAlign: 'center',
    marginTop: spacing.sp4,
  },
  lockoutTimer: {
    fontFamily: fonts.mono,
    fontSize: 46,
    fontWeight: '500',
    color: colors.warningDeep,
    textAlign: 'center',
    lineHeight: 54,
    marginTop: spacing.sp8,
  },
  lockoutMinutes: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.warningDeep,
    textAlign: 'center',
  },

  // ── Help link (locked-out) ──
  helpLink: {
    alignItems: 'center',
    marginTop: spacing.sp16,
    minHeight: sizing.touchTarget,
    justifyContent: 'center',
  },
  helpLinkText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // ── Session-expired card ──
  sessionCard: {
    borderRadius: radius.rBtn,
    backgroundColor: colors.jadeFaint,
    borderWidth: 1,
    borderColor: withAlpha(colors.jade400, 0.20),
    paddingVertical: spacing.sp14,
    paddingHorizontal: spacing.sp16,
    marginTop: spacing.sp24,
  },
  keyChip: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp12,
  },
  sessionTexts: {
    flex: 1,
  },
  sessionTitle: {
    fontFamily: fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.jadeText,
    marginBottom: spacing.sp4,
  },
  sessionBody: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // ── Saved account row ──
  savedRow: {
    borderRadius: radius.rXl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hair,
    marginTop: spacing.sp14,
    marginBottom: spacing.sp16,
    paddingVertical: spacing.sp14,
    paddingHorizontal: spacing.sp16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.rFull,
    backgroundColor: colors.jadeFaint,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: colors.jadeText,
  },
  savedInfo: {
    flex: 1,
  },
  savedName: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  savedId: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.textSecondary,
  },
  changerText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    color: colors.jadeText,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sp20,
    gap: spacing.sp8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textTertiary,
  },

  // ── Biometric ──
  biometricContainer: {
    alignItems: 'center',
    marginTop: spacing.sp16,
  },
  biometricCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.rFull,
    backgroundColor: colors.jadeFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricLabel: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    fontWeight: '500',
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sp8,
  },

  // ── Skeleton ──
  skeletonBox: {
    backgroundColor: SKELETON_BG,
  },
  skeletonLabel: {
    width: 138,
    height: 15,
    borderRadius: 18,
    marginBottom: spacing.sp6,
  },
  skeletonInput: {
    height: 54,
    borderRadius: radius.rBtn,
    marginBottom: spacing.sp4,
  },
  skeletonButton: {
    height: 56,
    borderRadius: radius.rLg,
  },
  skeletonDivRow: {
    alignItems: 'center',
    marginTop: spacing.sp24,
  },
  skeletonCircleRow: {
    alignItems: 'center',
    marginTop: spacing.sp16,
  },
  skeletonHelpRow: {
    alignItems: 'center',
    marginTop: spacing.sp8,
  },

});
