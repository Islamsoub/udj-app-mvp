import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  I18nManager,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { login as loginApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import i18n from '@/i18n';
import { colors, spacing, radius } from '@/constants/theme';

const BIOMETRIC_KEY = 'udj_biometric_enabled';
const MAX_ATTEMPTS = 3;
const LOCKOUT_SECONDS = 300;

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const { language, setLanguage } = useSettingsStore();

  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [networkError, setNetworkError] = useState(false);

  const lockoutEndRef = useRef<number>(0);

  // Lockout countdown
  useEffect(() => {
    if (!isLockedOut) return;
    lockoutEndRef.current = Date.now() + LOCKOUT_SECONDS * 1000;

    const interval = setInterval(() => {
      const remaining = Math.max(0, lockoutEndRef.current - Date.now());
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setCountdown(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      if (remaining <= 0) {
        clearInterval(interval);
        setIsLockedOut(false);
        setFailedAttempts(0);
        setError(null);
        setCountdown('');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLockedOut]);

  // Biometric prompt on mount if previously enabled
  useEffect(() => {
    async function tryBiometric() {
      try {
        const enabled = await SecureStore.getItemAsync(BIOMETRIC_KEY);
        if (!enabled) return;
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) return;

        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: t('auth.biometricPrompt'),
          cancelLabel: t('common.retry'),
        });
        if (result.success) {
          // Biometric passed — credentials already in SecureStore from authStore; re-hydrate
          router.replace('/(tabs)/home');
        }
      } catch {
        // Biometric not available — silent fail
      }
    }
    tryBiometric();
  }, [router, t]);

  const handleLogin = useCallback(async () => {
    if (!studentId.trim() || !password || isLoading || isLockedOut) return;
    setIsLoading(true);
    setError(null);
    setNetworkError(false);

    try {
      const response = await loginApi(studentId.trim(), password);
      await setAuth(response.token, response.refreshToken, response.studentId);
      await SecureStore.setItemAsync(BIOMETRIC_KEY, 'true');
      router.replace('/(tabs)/home');
    } catch (err) {
      const next = failedAttempts + 1;
      setFailedAttempts(next);

      if (next >= MAX_ATTEMPTS) {
        setIsLockedOut(true);
      } else if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError(
          t('auth.attemptsLeft', { count: MAX_ATTEMPTS - next }) +
            ' — ' +
            t('auth.wrongCredentials')
        );
      } else {
        setNetworkError(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [studentId, password, isLoading, isLockedOut, failedAttempts, setAuth, router, t]);

  const toggleLanguage = useCallback(() => {
    const next = language === 'fr' ? 'ar' : 'fr';
    setLanguage(next);
    i18n.changeLanguage(next);
    if (next === 'ar' && !I18nManager.isRTL) {
      Alert.alert(t('onboarding.rtlRestart'), '', [
        {
          text: t('onboarding.restart'),
          onPress: () => I18nManager.forceRTL(true),
        },
        { text: t('common.retry'), style: 'cancel' },
      ]);
    } else if (next === 'fr' && I18nManager.isRTL) {
      I18nManager.forceRTL(false);
    }
  }, [language, setLanguage, t]);

  const hasError = !!error || networkError;
  const canSubmit = studentId.trim().length > 0 && password.length > 0 && !isLockedOut;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Language toggle */}
        <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage} hitSlop={8}>
          <Text style={styles.langText}>{language === 'fr' ? 'AR' : 'FR'}</Text>
        </TouchableOpacity>

        {/* Header */}
        <Text style={styles.title}>{t('auth.welcome')}</Text>

        {/* Lockout banner */}
        {isLockedOut && (
          <View style={styles.lockoutBanner}>
            <Text style={styles.lockoutText}>
              {t('auth.lockedOut', { time: countdown })}
            </Text>
          </View>
        )}

        {/* Network error */}
        {networkError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{t('auth.networkError')}</Text>
          </View>
        )}

        {/* Student ID field */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>{t('auth.studentId')}</Text>
          <View style={[styles.inputRow, hasError && styles.inputRowError]}>
            <View style={styles.inputIcon}>
              <Text style={styles.inputIconText}>👤</Text>
            </View>
            <TextInput
              style={styles.input}
              value={studentId}
              onChangeText={setStudentId}
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLockedOut && !isLoading}
              placeholder={t('auth.studentId')}
              placeholderTextColor={colors.textTertiary}
            />
            {studentId.length > 0 && (
              <TouchableOpacity
                onPress={() => setStudentId('')}
                hitSlop={8}
                style={styles.clearBtn}
              >
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Password field */}
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>{t('auth.password')}</Text>
          <View style={[styles.inputRow, hasError && styles.inputRowError]}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLockedOut && !isLoading}
              placeholder={t('auth.password')}
              placeholderTextColor={colors.textTertiary}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
              style={styles.clearBtn}
            >
              <Text style={styles.clearBtnText}>{showPassword ? '🙈' : '👁'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline error message */}
        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Forgot password */}
        <TouchableOpacity hitSlop={8}>
          <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
        </TouchableOpacity>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.cta, (!canSubmit || isLoading) && styles.ctaDisabled]}
          onPress={handleLogin}
          disabled={!canSubmit || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.ctaText}>{t('auth.login')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.sp24,
    paddingTop: spacing.sp32,
    paddingBottom: spacing.sp32,
  },
  langToggle: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sp8,
    paddingHorizontal: spacing.sp12,
    borderRadius: radius.rMd,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: spacing.sp32,
    marginBottom: spacing.sp32,
  },
  lockoutBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.rMd,
    padding: spacing.sp12,
    marginBottom: spacing.sp16,
  },
  lockoutText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.rMd,
    padding: spacing.sp12,
    marginBottom: spacing.sp16,
  },
  errorBannerText: {
    color: colors.danger,
    fontSize: 13,
  },
  fieldWrapper: {
    marginBottom: spacing.sp16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sp6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.rMd,
    minHeight: 48,
    paddingHorizontal: spacing.sp12,
  },
  inputRowError: {
    borderColor: colors.danger,
  },
  inputIcon: {
    marginEnd: spacing.sp8,
  },
  inputIconText: {
    fontSize: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: spacing.sp12,
  },
  clearBtn: {
    paddingStart: spacing.sp8,
    minWidth: 32,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: spacing.sp12,
  },
  forgotText: {
    color: colors.jade400,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: spacing.sp32,
    alignSelf: 'flex-end',
  },
  cta: {
    backgroundColor: colors.jade400,
    borderRadius: radius.rLg,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  ctaDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
