import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  I18nManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore } from '@/stores/settingsStore';
import i18n from '@/i18n';
import { colors, spacing, radius } from '@/constants/theme';

const ONBOARDED_KEY = 'udj_onboarded';

const WIDGETS = ['agenda', 'stats', 'news'] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { language, setLanguage, notificationsEnabled, setNotificationsEnabled, widgetOrder, setWidgetOrder } =
    useSettingsStore();

  const [step, setStep] = useState(0);
  const [notifCourses, setNotifCourses] = useState(true);
  const [notifGrades, setNotifGrades] = useState(true);
  const [notifNews, setNotifNews] = useState(true);

  const handleLanguageSelect = (lang: 'fr' | 'ar') => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    if (lang === 'ar' && !I18nManager.isRTL) {
      Alert.alert(t('onboarding.rtlRestart'), '', [
        {
          text: t('onboarding.restart'),
          onPress: () => {
            I18nManager.forceRTL(true);
          },
        },
        { text: t('common.retry'), style: 'cancel' },
      ]);
    }
  };

  const moveWidget = (index: number, direction: -1 | 1) => {
    const next = [...widgetOrder];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setWidgetOrder(next);
  };

  const handleFinish = async () => {
    setNotificationsEnabled(notifCourses || notifGrades || notifNews);
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Progress dots */}
      <View style={styles.progressRow}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.content}>
        {/* Step 1 — Language */}
        {step === 0 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t('onboarding.step1Title')}</Text>
            <View style={styles.langRow}>
              <TouchableOpacity
                style={[styles.langBtn, language === 'fr' && styles.langBtnActive]}
                onPress={() => handleLanguageSelect('fr')}
              >
                <Text style={[styles.langBtnText, language === 'fr' && styles.langBtnTextActive]}>
                  Français
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langBtn, language === 'ar' && styles.langBtnActive]}
                onPress={() => handleLanguageSelect('ar')}
              >
                <Text style={[styles.langBtnText, language === 'ar' && styles.langBtnTextActive]}>
                  العربية
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2 — Notifications */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t('onboarding.step2Title')}</Text>
            {[
              { label: t('onboarding.notifCourses'), value: notifCourses, set: setNotifCourses },
              { label: t('onboarding.notifGrades'), value: notifGrades, set: setNotifGrades },
              { label: t('onboarding.notifNews'), value: notifNews, set: setNotifNews },
            ].map(({ label, value, set }) => (
              <View key={label} style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{label}</Text>
                <Switch
                  value={value}
                  onValueChange={set}
                  trackColor={{ false: colors.border, true: colors.jade300 }}
                  thumbColor={value ? colors.jade400 : colors.textTertiary}
                />
              </View>
            ))}
          </View>
        )}

        {/* Step 3 — Widget order */}
        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{t('onboarding.step3Title')}</Text>
            {widgetOrder.map((widget, index) => {
              const labels: Record<string, string> = {
                agenda: t('onboarding.widgetAgenda'),
                stats: t('onboarding.widgetStats'),
                news: t('onboarding.widgetNews'),
              };
              return (
                <View key={widget} style={styles.widgetRow}>
                  <Text style={styles.widgetLabel}>{labels[widget] ?? widget}</Text>
                  <View style={styles.widgetArrows}>
                    <TouchableOpacity
                      style={styles.arrowBtn}
                      onPress={() => moveWidget(index, -1)}
                      disabled={index === 0}
                    >
                      <Text style={[styles.arrowText, index === 0 && styles.arrowDisabled]}>
                        ↑
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.arrowBtn}
                      onPress={() => moveWidget(index, 1)}
                      disabled={index === widgetOrder.length - 1}
                    >
                      <Text
                        style={[
                          styles.arrowText,
                          index === widgetOrder.length - 1 && styles.arrowDisabled,
                        ]}
                      >
                        ↓
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Navigation buttons */}
      <View style={styles.navRow}>
        {step > 0 ? (
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setStep((s) => s - 1)}
          >
            <Text style={styles.secondaryBtnText}>{t('onboarding.back')}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={step < 2 ? () => setStep((s) => s + 1) : handleFinish}
        >
          <Text style={styles.primaryBtnText}>
            {step < 2 ? t('onboarding.next') : t('onboarding.start')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sp8,
    paddingTop: spacing.sp24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.jade400,
    width: 24,
    borderRadius: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.sp24,
    paddingTop: spacing.sp32,
  },
  stepContainer: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sp32,
  },
  langRow: {
    gap: spacing.sp16,
  },
  langBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.rLg,
    paddingVertical: spacing.sp16,
    alignItems: 'center',
    marginBottom: spacing.sp8,
    minHeight: 56,
    justifyContent: 'center',
  },
  langBtnActive: {
    borderColor: colors.jade400,
    backgroundColor: colors.jade50,
  },
  langBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  langBtnTextActive: {
    color: colors.jade400,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sp16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 56,
  },
  toggleLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  widgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sp12,
    backgroundColor: colors.surface,
    borderRadius: radius.rMd,
    paddingHorizontal: spacing.sp16,
    marginBottom: spacing.sp8,
    minHeight: 56,
    borderWidth: 1,
    borderColor: colors.border,
  },
  widgetLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  widgetArrows: {
    flexDirection: 'row',
    gap: spacing.sp8,
  },
  arrowBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    fontSize: 20,
    color: colors.jade400,
  },
  arrowDisabled: {
    color: colors.textTertiary,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sp24,
    paddingBottom: spacing.sp32,
    paddingTop: spacing.sp16,
  },
  secondaryBtn: {
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp20,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: colors.jade400,
    borderRadius: radius.rLg,
    paddingVertical: spacing.sp16,
    paddingHorizontal: spacing.sp32,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
