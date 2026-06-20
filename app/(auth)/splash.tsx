import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Animated,
  Linking,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PressBox } from '@/components/PressBox';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { fonts, lightColors, radius, spacing, withAlpha, colors, fz, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';
import { restoreSession } from '@/services/auth';
import api from '@/services/api';

// Splash is a branded jade-green screen — text/iconography always renders in
// light-palette tones regardless of active theme.
const BRAND_FG = lightColors.surface;
import type { ComponentProps } from 'react';
import { DevSwitcher } from '@/components/ui/DevSwitcher';

// SVG transformer handles the module — typed explicitly to avoid `any` exposure
const LogoSVG = (
  require('@/assets/icons/Logo.svg') as { default: React.FC<{ width: number; height: number }> }
).default;

// RGBA variants not expressible as opaque hex tokens in theme.ts
const WHITE_08 = withAlpha(colors.white, 0.08);
const WHITE_15 = withAlpha(colors.white, 0.15);
const WHITE_40 = withAlpha(colors.white, 0.4);
const WHITE_60 = withAlpha(colors.white, 0.6);
const WHITE_70 = withAlpha(colors.white, 0.7);
const WHITE_80 = withAlpha(colors.white, 0.8);
const DANGER_20 = withAlpha(colors.danger, 0.2);
const JADE400_20 = withAlpha(colors.jade400, 0.2);
const JADE400_40 = withAlpha(colors.jade400, 0.4);

type SplashState = 'loading' | 'no-connection' | 'maintenance' | 'first-install' | 'force-update';
type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const FEATURES: Array<{ icon: IoniconsName; label: string }> = [
  { icon: 'calendar-outline', label: 'Emploi du temps en temps réel' },
  { icon: 'bar-chart-outline', label: 'Notes et résultats instantanés' },
  { icon: 'card-outline', label: 'Carte étudiante digitale QR' },
];

const ALL_STATES: SplashState[] = [
  'loading',
  'no-connection',
  'maintenance',
  'first-install',
  'force-update',
];
const STATE_LABELS: Record<SplashState, string> = {
  'loading':       'loading',
  'no-connection': 'no-connection',
  'maintenance':   'maintenance',
  'first-install': 'first-install',
  'force-update':  'force-update',
};

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useColors();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [splashState, setSplashState] = useState<SplashState>('loading');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fire-and-forget — wake Render from cold sleep before the user reaches login
    api.get('/health', { timeout: 5000 }).catch(() => {});

    Animated.sequence([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(async () => {
      try {
        const resumed = await restoreSession();
        if (resumed) {
          router.replace('/(tabs)/home');
          return;
        }
        const onboarded = await AsyncStorage.getItem('hasOnboarded');
        router.replace(onboarded ? '/(auth)/login' : '/(auth)/onboarding');
      } catch {
        router.replace('/(auth)/login');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [fadeAnim, router]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Logo — absolute. Loading: Y=305. All other states: Y=161. */}
      <Animated.View
        style={[
          styles.logoAbsolute,
          {
            opacity: fadeAnim,
            top: splashState === 'loading' ? 305 : 161,
          },
        ]}
      >
        <Animated.View style={{ opacity: logoOpacity }}>
          <LogoSVG width={99} height={169} />
        </Animated.View>
        <Animated.View style={{ opacity: textOpacity }}>
          <Text style={styles.logoText}>Unipocket</Text>
        </Animated.View>
      </Animated.View>

      {/* ── State: no-connection ── */}
      {splashState === 'no-connection' && (
        <View style={styles.stateContent}>
          <View style={styles.iconCircleDark}>
            <Ionicons name="cloud-offline-outline" size={32} color={BRAND_FG} />
          </View>
          <Text style={styles.stateBoldText}>{t('splash.no_connection')}</Text>
          <Text style={styles.stateBodyText}>
            {'Vérifiez votre connexion Wi-Fi\nou données mobiles pour continuer.'}
          </Text>
          <PressBox
            tier="button"
            style={styles.primaryButton}
            onPress={() => setSplashState('loading')}
            hitSlop={8}
          >
            <Text style={styles.primaryButtonText}>{t('splash.retry')}</Text>
          </PressBox>
        </View>
      )}

      {/* ── State: maintenance ── */}
      {splashState === 'maintenance' && (
        <View style={styles.stateContent}>
          <View style={styles.iconCircleDanger}>
            <Ionicons name="construct-outline" size={32} color={colors.danger} />
          </View>
          <Text style={styles.stateBoldText}>{t('splash.maintenance')}</Text>
          <Text style={styles.stateBodyText}>
            {"L'application sera disponible\ndans quelques minutes. Merci de votre patience."}
          </Text>
          <PressBox tier="button" style={styles.outlineButton} hitSlop={8}>
            <Text style={styles.outlineButtonText}>{t('splash.retry_later')}</Text>
          </PressBox>
        </View>
      )}

      {/* ── State: first-install ── */}
      {splashState === 'first-install' && (
        <View style={styles.stateContent}>
          <Text style={styles.welcomeHeading}>{t('splash.welcome')}</Text>
          <Text style={styles.welcomeSubtitle}>
            {"Votre application étudiante\nofficielle de l'Université de Djibouti"}
          </Text>
          <View style={styles.featureCard}>
            {FEATURES.map(({ icon, label }) => (
              <View key={icon} style={styles.featureRow}>
                <Ionicons name={icon} size={32} color={colors.jade400} />
                <Text style={styles.featureText}>{label}</Text>
              </View>
            ))}
          </View>
          <PressBox
            tier="button"
            style={[styles.primaryButton, styles.firstInstallButton]}
            onPress={() => router.replace('/(auth)/onboarding')}
            hitSlop={8}
          >
            <Text style={styles.primaryButtonText}>{t('splash.start')}</Text>
          </PressBox>
          <Text style={styles.firstInstallCaption}>{t('splash.first_install')}</Text>
        </View>
      )}

      {/* ── State: force-update ── */}
      {splashState === 'force-update' && (
        <View style={styles.stateContent}>
          <Text style={styles.stateBoldText}>{t('splash.update_required')}</Text>
          <Text style={styles.stateBodyText}>
            {"Une nouvelle version de l'app est disponible.\nMettez à jour pour continuer\nà accéder à vos données."}
          </Text>
          <View style={styles.versionRow}>
            <View style={styles.versionBoxCurrent}>
              <Text style={styles.versionBoxLabel}>{t('splash.current_version')}</Text>
              <Text style={styles.versionBoxNumber}>1.0.0</Text>
            </View>
            <Text style={styles.versionArrow}>→</Text>
            <View style={styles.versionBoxNew}>
              <Text style={styles.versionBoxLabel}>{t('splash.new_version')}</Text>
              <Text style={styles.versionBoxNumber}>1.1.0</Text>
            </View>
          </View>
          <PressBox
            tier="button"
            style={[styles.primaryButton, styles.updateButton]}
            onPress={() => { void Linking.openURL('https://play.google.com/store'); }}
            hitSlop={8}
          >
            <Text style={styles.primaryButtonText}>{t('splash.update')}</Text>
          </PressBox>
        </View>
      )}

      {/* ── State: loading — static pill + label ── */}
      {splashState === 'loading' && (
        <>
          <View style={styles.pillTrack}>
            <Animated.View
              style={{
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 37] }),
                height: 3,
                borderRadius: 12,
                backgroundColor: colors.skeletonBox,
              }}
            />
          </View>
          <Text style={styles.loadingText}>{t('splash.loading')}</Text>
        </>
      )}

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={splashState}
        onChange={setSplashState}
      />

      {/* Version badge — always visible, bottom-right */}
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.jade900,
    alignItems: 'center',
  },
  // Logo is absolutely positioned; top varies by state
  logoAbsolute: {
    position: 'absolute',
    start: 0,
    end: 0,
    alignSelf: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: fonts.sans,
    fontSize: fz(16),
    fontWeight: '600',
    color: BRAND_FG,
    marginTop: -18,
    textAlign: 'center',
  },
  stateContent: {
    position: 'absolute',
    top: 355,
    alignItems: 'center',
    paddingHorizontal: spacing.sp24,
    width: '100%',
  },
  stateBoldText: {
    color: BRAND_FG,
    fontFamily: fonts.sans,
    fontSize: fz(18),
    fontWeight: '700',
    marginTop: spacing.sp20,
    textAlign: 'center',
  },
  stateBodyText: {
    color: WHITE_70,
    fontFamily: fonts.sans,
    fontSize: fz(14),
    lineHeight: fz(22),
    textAlign: 'center',
    marginTop: spacing.sp8,
  },
  // Icon circles
  iconCircleDark: {
    width: 64,
    height: 64,
    borderRadius: radius.rFull,
    backgroundColor: colors.jade600,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 33,
  },
  iconCircleDanger: {
    width: 64,
    height: 64,
    borderRadius: radius.rFull,
    backgroundColor: DANGER_20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 33,
  },
  // Primary filled button
  primaryButton: {
    backgroundColor: colors.jade400,
    height: 52,
    width: '80%',
    maxWidth: 320,
    borderRadius: radius.rLg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp32,
  },
  primaryButtonText: {
    color: BRAND_FG,
    fontFamily: fonts.sans,
    fontSize: fz(16),
    fontWeight: '700',
  },
  // Outline button (maintenance)
  outlineButton: {
    height: 52,
    width: '80%',
    maxWidth: 320,
    borderRadius: radius.rLg,
    borderWidth: 1.5,
    borderColor: BRAND_FG,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp32,
  },
  outlineButtonText: {
    color: BRAND_FG,
    fontFamily: fonts.sans,
    fontSize: fz(16),
    fontWeight: '700',
  },
  // First install
  welcomeHeading: {
    color: BRAND_FG,
    fontFamily: fonts.sans,
    fontSize: fz(26),
    fontWeight: '800',
    marginTop: spacing.sp32,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: WHITE_80,
    fontFamily: fonts.sans,
    fontSize: fz(15),
    lineHeight: fz(22),
    textAlign: 'center',
    marginTop: spacing.sp8,
  },
  featureCard: {
    backgroundColor: WHITE_08,
    borderRadius: radius.rXl,
    padding: spacing.sp20,
    marginTop: spacing.sp24,
    width: '85%',
    gap: spacing.sp16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp12,
  },
  featureText: {
    color: BRAND_FG,
    fontFamily: fonts.sans,
    fontSize: fz(14),
    fontWeight: '500',
    flex: 1,
  },
  firstInstallButton: {
    marginTop: spacing.sp24,
  },
  firstInstallCaption: {
    color: WHITE_40,
    fontFamily: fonts.sans,
    fontSize: fz(11),
    marginTop: spacing.sp8,
    textAlign: 'center',
  },
  // Force update version boxes
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp12,
    marginTop: spacing.sp24,
  },
  versionBoxCurrent: {
    backgroundColor: WHITE_08,
    borderRadius: 10,
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp20,
    alignItems: 'center',
  },
  versionBoxNew: {
    backgroundColor: JADE400_20,
    borderWidth: 1,
    borderColor: JADE400_40,
    borderRadius: 10,
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp20,
    alignItems: 'center',
  },
  versionBoxLabel: {
    color: WHITE_60,
    fontFamily: fonts.mono,
    fontSize: fz(9),
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  versionBoxNumber: {
    color: BRAND_FG,
    fontFamily: fonts.mono,
    fontSize: fz(18),
    fontWeight: '700',
    marginTop: spacing.sp4,
  },
  versionArrow: {
    color: BRAND_FG,
    fontSize: fz(20),
  },
  updateButton: {
    marginTop: spacing.sp24,
  },
  // Loading state: static pill indicator
  pillTrack: {
    position: 'absolute',
    top: 691,
    alignSelf: 'center',
    width: 37,
    height: 3,
    borderRadius: 12,
    backgroundColor: colors.textSecondary,
  },
  pillFill: {
    width: 24,
    height: 3,
    borderRadius: 12,
    backgroundColor: colors.skeletonBox,
  },
  loadingText: {
    position: 'absolute',
    top: 705,
    alignSelf: 'center',
    fontFamily: fonts.sans,
    fontSize: fz(12),
    fontWeight: '600',
    color: WHITE_60,
  },
  // Version badge
  version: {
    position: 'absolute',
    bottom: spacing.sp16,
    end: spacing.sp16,
    color: WHITE_60,
    fontFamily: fonts.mono,
    fontSize: fz(10),
  },
});
