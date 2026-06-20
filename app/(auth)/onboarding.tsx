import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import { PressBox } from '@/components/PressBox';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { reloadApp } from '@/utils/reload';
import { useSettingsStore } from '@/stores/settingsStore';
import i18n from '@/i18n';
import { lightColors, spacing, sizing, radius, fz, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

// Onboarding CTAs sit on a jade-tinted brand background — button label is always
// rendered in the light-palette surface tone regardless of active theme.
const BRAND_FG = lightColors.surface;

type Lang = 'fr' | 'ar';

const TITLE_KEYS = [
  'onboarding.step1Title',
  'onboarding.step2Title',
  'onboarding.step3Title',
  'onboarding.step4Title',
];

const BODY_KEYS = [
  'onboarding.step1Body',
  'onboarding.step2Body',
  'onboarding.step3Body',
  'onboarding.step4Body',
];

const ILLUSTRATIONS = [
  require('../../assets/icons/onboarding_schedule.png'),
  require('../../assets/icons/onboarding_grades.png'),
  require('../../assets/icons/onboarding_qr.png'),
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { language, setLanguage } = useSettingsStore();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLang, setSelectedLang] = useState<Lang>(language);

  const isLanguageStep = currentStep === 3;

  const handleLangSelect = async (lang: Lang) => {
    setSelectedLang(lang);
    setLanguage(lang);
    i18n.changeLanguage(lang);
    try {
      await reloadApp();
    } catch {
      Alert.alert(
        t('settings.restart_title'),
        t('settings.restart_message'),
        [{ text: t('common.ok') }],
      );
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      void AsyncStorage.setItem('hasOnboarded', 'true');
      router.replace('/(auth)/login');
    }
  };

  const handleSkip = () => {
    void AsyncStorage.setItem('hasOnboarded', 'true');
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button — hidden (opacity 0, non-interactive) on language step */}
      <View
        pointerEvents={isLanguageStep ? 'none' : 'auto'}
        style={isLanguageStep ? styles.skipHidden : undefined}
      >
        <PressBox tier="tint" style={styles.skipButton} onPress={handleSkip} accessibilityRole="button">
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.jade600} style={styles.skipIcon} />
        </PressBox>
      </View>

      {/* Content area: illustration/lang cards + title + body as one centered block */}
      <View style={styles.contentArea}>
        {!isLanguageStep ? (
          <Image
            source={ILLUSTRATIONS[currentStep]}
            style={styles.illustration}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.langCards}>
            <PressBox
              tier="tint"
              style={[styles.langCard, selectedLang === 'fr' && styles.langCardSelected]}
              onPress={() => handleLangSelect('fr')}
            >
              {/* Language names are not translated — they must be readable in their own script */}
              <Text style={[styles.langCardText, selectedLang === 'fr' && styles.langCardSelectedText]}>Français</Text>
              {selectedLang === 'fr' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.jade600} />
              )}
            </PressBox>

            <PressBox
              tier="tint"
              style={[styles.langCard, selectedLang === 'ar' && styles.langCardSelected]}
              onPress={() => handleLangSelect('ar')}
            >
              {/* Language names are not translated — they must be readable in their own script */}
              <Text style={[styles.langCardText, selectedLang === 'ar' && styles.langCardSelectedText]}>العربية</Text>
              {selectedLang === 'ar' && (
                <Ionicons name="checkmark-circle" size={24} color={colors.jade600} />
              )}
            </PressBox>
          </View>
        )}

        <Text style={styles.title}>{t(TITLE_KEYS[currentStep])}</Text>
        <Text style={styles.body}>{t(BODY_KEYS[currentStep])}</Text>
      </View>

      {/* 4-dot step indicators */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i === currentStep && styles.dotActive]} />
        ))}
      </View>

      {/* Primary action button */}
      <PressBox tier="button" style={styles.primaryButton} onPress={handleNext}>
        <Text style={styles.primaryButtonText}>
          {isLanguageStep ? t('onboarding.start') : t('onboarding.next')}
        </Text>
      </PressBox>
    </SafeAreaView>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipHidden: {
    opacity: 0,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp8,
    minHeight: sizing.touchTarget,
    justifyContent: 'center',
  },
  skipText: {
    fontSize: fz(14),
    fontWeight: '600',
    color: colors.jade600,
  },
  skipIcon: {
    marginStart: 2, // sub-pixel chevron nudge — intentional, not on the 8px grid
  },
  contentArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp32,
  },
  illustration: {
    width: 200,
    height: 200,
  },
  langCards: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sp16,
    paddingHorizontal: spacing.sp32,
  },
  langCard: {
    width: '100%',
    maxWidth: 280,
    height: 72,
    borderRadius: radius.rXl,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sp12,
  },
  langCardSelected: {
    borderColor: colors.jade400,
    backgroundColor: colors.jade50,
  },
  langCardText: {
    fontSize: fz(18),
    fontWeight: '600',
    color: colors.textPrimary,
  },
  langCardSelectedText: {
    color: colors.jade900,
    fontWeight: '700',
  },
  title: {
    fontSize: fz(22),
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp24,
  },
  body: {
    fontSize: fz(14),
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: fz(24),
    marginTop: spacing.sp8,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sp8,
    marginBottom: spacing.sp24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.jade400,
  },
  primaryButton: {
    marginHorizontal: spacing.sp16,
    marginBottom: spacing.sp32,
    height: 56,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: fz(16),
    fontWeight: '700',
    color: BRAND_FG,
  },
});
