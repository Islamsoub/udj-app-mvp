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
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { fonts, spacing, radius, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { login, restoreSession } from '@/services/auth';
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
const WHITE_12 = 'rgba(255,255,255,0.12)';
const WHITE_80 = 'rgba(255,255,255,0.8)';
const WHITE_15 = 'rgba(255,255,255,0.15)';
const WHITE_40 = 'rgba(255,255,255,0.4)';
const WHITE_60 = 'rgba(255,255,255,0.6)';
const WARNING_15 = 'rgba(245,158,11,0.15)';
const WARNING_12 = 'rgba(245,158,11,0.12)';
const DANGER_08 = 'rgba(239,68,68,0.08)';
const EXAM_12 = 'rgba(139,92,246,0.12)';
const SKELETON_BG = 'rgba(217,217,217,0.6)';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [loginState, setLoginState] = useState<LoginState>('default');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [countdown, setCountdown] = useState(5 * 60);
  const [attemptsLeft, setAttemptsLeft] = useState<number | null>(null);
  const [biometricVisible, setBiometricVisible] = useState(false);

  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  // Show the biometric button only when the device supports it AND the user opted in.
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [available, enabled] = await Promise.all([
        isBiometricAvailable(),
        isBiometricEnabled(),
      ]);
      if (mounted) setBiometricVisible(available && enabled);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Locked-out countdown
  useEffect(() => {
    if (loginState !== 'locked-out') {
      setCountdown(5 * 60);
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLoginState('default');
          return 5 * 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
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
            const secsRemaining = Math.max(
              0,
              Math.round((new Date(data.lockedUntil).getTime() - Date.now()) / 1000)
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
      // No valid refresh token / network failure — keep the user on login.
      setLoginState('network-error');
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

  const studentIdInputStyle = isError
    ? { backgroundColor: DANGER_08, borderColor: colors.danger }
    : { backgroundColor: colors.surface, borderColor: colors.jade600 };

  const passwordInputStyle = isError
    ? { backgroundColor: DANGER_08, borderColor: colors.danger }
    : { backgroundColor: colors.jade50, borderColor: '#D9D9D9' };

  const buttonBg = isNetworkError || isLocked ? '#D9D9D9' : colors.jade400;
  const buttonTextGrey = isNetworkError || isLocked;
  const buttonDisabled = isSubmitting || isNetworkError || isLocked;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.jade600} translucent={false} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* ── GREEN TOP BLOCK ── */}
        <View style={styles.greenBlock}>
          <View style={StyleSheet.absoluteFill}>
            <View style={styles.blob1} />
            <View style={styles.blob2} />
            <View style={styles.blob3} />
          </View>

          {isSkeleton ? (
            <Animated.View style={[styles.greenContent, { opacity: pulseAnim }]}>
              <View style={[styles.skeletonBox, { width: 87, height: 81, borderRadius: 14 }]} />
              <View style={[styles.skeletonBox, { width: 158, height: 20, borderRadius: 18, marginTop: 12 }]} />
              <View style={[styles.skeletonBox, { width: 207, height: 20, borderRadius: 18, marginTop: 8 }]} />
            </Animated.View>
          ) : (
            <View style={styles.greenContent}>
              <LogoSVG width={63} height={92} />
              <Text style={styles.greenTitle}>Universite de Djibouti</Text>
              {showSubtitle && (
                <Text style={styles.greenSubtitle}>
                  Connectez-vous à votre espace étudiant
                </Text>
              )}
            </View>
          )}
        </View>

        {/* ── OFFLINE BANNER (network-error only) ── */}
        <OfflineBanner />

        {/* ── WHITE BODY ── */}
        <View style={styles.body}>

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
                  <Ionicons name="warning-outline" size={28} color={colors.warning} />
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
                      <Ionicons name="key-outline" size={24} color={colors.warning} />
                      <View style={styles.sessionTexts}>
                        <Text style={styles.sessionTitle}>Session expirée</Text>
                        <Text style={styles.sessionBody}>
                          Votre session de 30 jours a expiré. Reconnectez-vous pour accéder à vos données.
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.savedRow}>
                    <View style={styles.avatarCircle}>
                      <Text style={styles.avatarText}>AO</Text>
                    </View>
                    <View style={styles.savedInfo}>
                      <Text style={styles.savedName}>Ahmed Omar Said</Text>
                      <Text style={styles.savedId}>UDJ-2024-0432</Text>
                    </View>
                    <Pressable onPress={() => setLoginState('default')} hitSlop={8} style={({ pressed }) => pressed && { backgroundColor: colors.jade400 + '26', borderRadius: 6 }}>
                      <Text style={styles.changerText}>Changer ›</Text>
                    </Pressable>
                  </View>
                </>
              )}

              {/* ── STUDENT ID INPUT (all states except locked-out + session-expired) ── */}
              {!isLocked && !isSessionExpired && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Numéro étudiant</Text>
                  <TextInput
                    style={[styles.textInput, styles.monoInput, studentIdInputStyle]}
                    value={studentId}
                    onChangeText={setStudentId}
                    placeholder="UDJ-2024-0432"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="default"
                    autoCapitalize="characters"
                    editable={inputsEditable}
                  />
                </View>
              )}

              {/* ── LOCKED-OUT: disabled input ── */}
              {isLocked && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mot de passe</Text>
                  <TextInput
                    style={[styles.textInput, styles.monoInput, styles.textInputDisabled]}
                    placeholder="UDJ-2024-0432"
                    placeholderTextColor={colors.textTertiary}
                    editable={false}
                  />
                </View>
              )}

              {/* ── PASSWORD INPUT (default / submitting / network-error / error) ── */}
              {!isLocked && !isSessionExpired && (
                <View style={styles.inputGroup}>
                  <View style={styles.passwordLabelRow}>
                    <Text style={styles.inputLabel}>Mot de passe</Text>
                    {loginState === 'default' && (
                      <Pressable hitSlop={8} style={({ pressed }) => pressed && { backgroundColor: colors.jade400 + '26', borderRadius: 6 }}>
                        <Text style={styles.forgotInline}>Mot de passe oublié ?</Text>
                      </Pressable>
                    )}
                  </View>
                  <TextInput
                    style={[styles.textInput, passwordInputStyle]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor={colors.textTertiary}
                    editable={inputsEditable}
                  />
                </View>
              )}

              {/* ── SESSION-EXPIRED: password input ── */}
              {isSessionExpired && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mot de passe</Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.surface, borderColor: colors.jade600 }]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor={colors.textTertiary}
                    editable
                  />
                </View>
              )}

              {/* ── ERROR CARD ── */}
              {isError && (
                <View style={styles.errorCard}>
                  <View style={styles.cardRow}>
                    <Ionicons name="warning-outline" size={24} color={colors.warning} />
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
                style={({ pressed }) => [styles.loginButton, { backgroundColor: buttonBg }, pressed && !buttonDisabled && { backgroundColor: colors.jade600 }]}
                onPress={loginHandler}
                disabled={buttonDisabled}
                hitSlop={8}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <Text style={[styles.loginButtonText, buttonTextGrey && styles.loginButtonTextGrey]}>
                    {isError ? t('common.retry') : t('auth.login')}
                  </Text>
                )}
              </Pressable>

              {/* ── NETWORK INFO CARD (below button) ── */}
              {isNetworkError && (
                <View style={styles.networkCard}>
                  <View style={styles.cardRow}>
                    <View style={styles.globeCircle}>
                      <Ionicons name="globe-outline" size={18} color={colors.surface} />
                    </View>
                    <Text style={styles.networkCardText}>
                      Une connexion internet est requise pour la première connexion. Activez vos données mobiles ou Wi-Fi.
                    </Text>
                  </View>
                </View>
              )}

              {/* ── ERROR: forgot password link below button ── */}
              {isError && (
                <Pressable hitSlop={8} style={({ pressed }) => [styles.forgotBelow, pressed && { backgroundColor: colors.jade400 + '26', borderRadius: 6 }]}>
                  <Text style={styles.forgotBelowText}>Mot de passe oublié ?</Text>
                </Pressable>
              )}

              {/* ── LOCKED-OUT: help link ── */}
              {isLocked && (
                <Pressable hitSlop={8} style={({ pressed }) => [styles.helpLink, pressed && { backgroundColor: colors.jade400 + '26', borderRadius: 6 }]}>
                  <Text style={styles.helpLinkText}>{t('auth.helpContact')}</Text>
                </Pressable>
              )}

              {/* ── DIVIDER + BIOMETRIC (default, hardware available + opted in) ── */}
              {loginState === 'default' && biometricVisible && (
                <>
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>ou</Text>
                    <View style={styles.dividerLine} />
                  </View>
                  <View style={styles.biometricContainer}>
                    <Pressable
                      style={({ pressed }) => [styles.biometricCircle, pressed && { backgroundColor: colors.warning + '26', borderRadius: 999 }]}
                      onPress={biometricHandler}
                      hitSlop={8}
                    >
                      <Ionicons name="scan-outline" size={24} color={colors.warning} />
                    </Pressable>
                    <Text style={styles.biometricLabel}>Empreinte digitale ou Face ID</Text>
                  </View>
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

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

  // ── Green block ──
  greenBlock: {
    height: 277,
    backgroundColor: colors.jade600,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blob1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: WHITE_12,
    top: -40,
    start: -40,
  },
  blob2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: WHITE_12,
    top: -60,
    end: -50,
  },
  blob3: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: WHITE_12,
    bottom: -40,
    start: 60,
  },
  greenContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.sp24,
  },
  greenTitle: {
    fontFamily: fonts.sans,
    fontSize: 18,
    fontWeight: '700',
    color: colors.surface,
    textAlign: 'center',
    marginTop: 12,
  },
  greenSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: WHITE_80,
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Body ──
  body: {
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp24,
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
    height: 46,
    borderRadius: radius.rLg,
    borderWidth: 1,
    paddingHorizontal: spacing.sp16,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.textPrimary,
  },
  monoInput: {
    fontFamily: fonts.mono,
  },
  textInputDisabled: {
    backgroundColor: '#D9D9D9',
    borderColor: '#D9D9D9',
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sp6,
  },
  forgotInline: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.jade600,
  },

  // ── Login button ──
  loginButton: {
    height: 56,
    borderRadius: radius.rLg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp8,
    minHeight: 44,
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
    borderRadius: radius.rLg,
    backgroundColor: WARNING_12,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.sp16,
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
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
    marginBottom: spacing.sp4,
  },
  errorCardBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.warning,
    lineHeight: 18,
  },

  // ── Forgot password (error state) ──
  forgotBelow: {
    alignItems: 'center',
    marginTop: spacing.sp16,
    minHeight: 44,
    justifyContent: 'center',
  },
  forgotBelowText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.jade600,
  },

  // ── Network card ──
  networkCard: {
    borderRadius: radius.rLg,
    backgroundColor: WARNING_12,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: spacing.sp16,
    marginTop: spacing.sp12,
  },
  globeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  networkCardText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.warning,
    flex: 1,
    lineHeight: 18,
  },

  // ── Lockout card ──
  lockoutCard: {
    borderRadius: radius.rLg,
    backgroundColor: WARNING_15,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: 20,
    marginTop: spacing.sp24,
    marginBottom: spacing.sp24,
    alignItems: 'center',
  },
  lockoutTitle: {
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'center',
    marginTop: spacing.sp8,
  },
  lockoutSubtitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: '#92400E',
    textAlign: 'center',
    marginTop: spacing.sp4,
  },
  lockoutTimer: {
    fontFamily: fonts.mono,
    fontSize: 48,
    fontWeight: '800',
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 56,
    marginTop: spacing.sp8,
  },
  lockoutMinutes: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: '#92400E',
    textAlign: 'center',
  },

  // ── Help link (locked-out) ──
  helpLink: {
    alignItems: 'center',
    marginTop: spacing.sp16,
    minHeight: 44,
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
    borderRadius: radius.rLg,
    backgroundColor: EXAM_12,
    borderWidth: 1,
    borderColor: colors.exam,
    padding: spacing.sp16,
    marginTop: spacing.sp24,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sp12,
  },
  sessionTexts: {
    flex: 1,
  },
  sessionTitle: {
    fontFamily: fonts.sans,
    fontSize: 13,
    fontWeight: '700',
    color: colors.exam,
    marginBottom: spacing.sp4,
  },
  sessionBody: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.exam,
    lineHeight: 18,
  },

  // ── Saved account row ──
  savedRow: {
    height: 67,
    borderRadius: radius.rLg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sp16,
    marginBottom: spacing.sp16,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp12,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 66,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    fontWeight: '700',
    color: colors.surface,
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
    color: colors.textSecondary,
  },

  // ── Divider ──
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sp24,
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
    width: 44,
    height: 44,
    borderRadius: radius.rFull,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.sp6,
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
    height: 46,
    borderRadius: radius.rLg,
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
