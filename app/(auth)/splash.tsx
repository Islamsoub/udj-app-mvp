import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import type { ComponentProps } from 'react';

// SVG transformer handles the module — typed explicitly to avoid `any` exposure
const LogoSVG = (
  require('@/assets/Logo.svg') as { default: React.FC<{ width: number; height: number }> }
).default;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const JWT_KEY = 'udj_jwt';

// RGBA variants not expressible as opaque hex tokens in theme.ts
const WHITE_08 = 'rgba(255,255,255,0.08)';
const WHITE_15 = 'rgba(255,255,255,0.15)';
const WHITE_40 = 'rgba(255,255,255,0.4)';
const WHITE_60 = 'rgba(255,255,255,0.6)';
const WHITE_70 = 'rgba(255,255,255,0.7)';
const WHITE_80 = 'rgba(255,255,255,0.8)';
const DANGER_20 = 'rgba(239,68,68,0.2)';
const JADE400_20 = 'rgba(29,158,117,0.2)';
const JADE400_40 = 'rgba(29,158,117,0.4)';

type SplashState = 'loading' | 'no-connection' | 'maintenance' | 'first-install' | 'force-update';
type IoniconsName = ComponentProps<typeof Ionicons>['name'];

const FEATURES: Array<{ icon: IoniconsName; label: string }> = [
  { icon: 'calendar-outline', label: 'Emploi du temps en temps réel' },
  { icon: 'bar-chart-outline', label: 'Notes et résultats instantanés' },
  { icon: 'card-outline', label: 'Carte étudiante digitale QR' },
];

const DEV_STATES: SplashState[] = [
  'loading',
  'no-connection',
  'maintenance',
  'first-install',
  'force-update',
];

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    const encodedPayload = parts[1];
    if (!encodedPayload) return false;
    const payload = JSON.parse(atob(encodedPayload)) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function SplashScreen() {
  const router = useRouter();
  const [currentState, setCurrentState] = useState<SplashState>('loading');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    // const timer = setTimeout(async () => {
    //   try {
    //     const token = await SecureStore.getItemAsync(JWT_KEY);
    //     if (token !== null && isTokenValid(token)) {
    //       router.replace('/(tabs)/home');
    //     } else {
    //       router.replace('/(auth)/login');
    //     }
    //   } catch {
    //     router.replace('/(auth)/login');
    //   }
    // }, 1500);

    // return () => clearTimeout(timer);
  }, [fadeAnim, progressAnim, router]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH],
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Logo + app name — fades in on mount, visible in all states */}
      <Animated.View style={[styles.logoSection, { opacity: fadeAnim }]}>
        <LogoSVG width={120} height={120} />
        <Text style={styles.appName}>Unipocket</Text>
      </Animated.View>

      {/* ── State: no-connection ── */}
      {currentState === 'no-connection' && (
        <View style={styles.stateContent}>
          <View style={styles.iconCircleDark}>
            <Ionicons name="cloud-offline-outline" size={32} color={colors.surface} />
          </View>
          <Text style={styles.stateBoldText}>Pas de connexion</Text>
          <Text style={styles.stateBodyText}>
            {'Vérifiez votre connexion Wi-Fi\nou données mobiles pour continuer.'}
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => setCurrentState('loading')}
            hitSlop={8}
          >
            <Text style={styles.primaryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {/* ── State: maintenance ── */}
      {currentState === 'maintenance' && (
        <View style={styles.stateContent}>
          <View style={styles.iconCircleDanger}>
            <Ionicons name="construct-outline" size={32} color={colors.danger} />
          </View>
          <Text style={styles.stateBoldText}>Maintenance en cours</Text>
          <Text style={styles.stateBodyText}>
            {"L'application sera disponible\ndans quelques minutes. Merci de votre patience."}
          </Text>
          <Pressable style={styles.outlineButton} hitSlop={8}>
            <Text style={styles.outlineButtonText}>Réessayer plus tard</Text>
          </Pressable>
        </View>
      )}

      {/* ── State: first-install ── */}
      {currentState === 'first-install' && (
        <View style={styles.stateContent}>
          <Text style={styles.welcomeHeading}>Bienvenue !</Text>
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
          <Pressable
            style={[styles.primaryButton, styles.firstInstallButton]}
            onPress={() => router.replace('/(auth)/onboarding')}
            hitSlop={8}
          >
            <Text style={styles.primaryButtonText}>{'Commencer →'}</Text>
          </Pressable>
          <Text style={styles.firstInstallCaption}>Première installation</Text>
        </View>
      )}

      {/* ── State: force-update ── */}
      {currentState === 'force-update' && (
        <View style={styles.stateContent}>
          <Text style={styles.stateBoldText}>Mise à jour requise</Text>
          <Text style={styles.stateBodyText}>
            {"Une nouvelle version de l'app est disponible.\nMettez à jour pour continuer\nà accéder à vos données."}
          </Text>
          <View style={styles.versionRow}>
            <View style={styles.versionBoxCurrent}>
              <Text style={styles.versionBoxLabel}>VERSION ACTUELLE</Text>
              <Text style={styles.versionBoxNumber}>1.0.0</Text>
            </View>
            <Text style={styles.versionArrow}>→</Text>
            <View style={styles.versionBoxNew}>
              <Text style={styles.versionBoxLabel}>NOUVELLE VERSION</Text>
              <Text style={styles.versionBoxNumber}>1.1.0</Text>
            </View>
          </View>
          <Pressable
            style={[styles.primaryButton, styles.updateButton]}
            onPress={() => { void Linking.openURL('https://play.google.com/store'); }}
            hitSlop={8}
          >
            <Text style={styles.primaryButtonText}>Mettre à jour</Text>
          </Pressable>
        </View>
      )}

      {/* ── State: loading — progress bar + label at bottom ── */}
      {currentState === 'loading' && (
        <View style={styles.loadingBottom}>
          <Text style={styles.loadingText}>Chargement...</Text>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>
      )}

      {/* DEV-only state switcher */}
      {__DEV__ && (
        <View style={styles.devRow}>
          {DEV_STATES.map((s) => (
            <Pressable
              key={s}
              style={[styles.devButton, currentState === s && styles.devButtonActive]}
              onPress={() => setCurrentState(s)}
            >
              <Text style={styles.devButtonText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Version badge — always visible, bottom-right */}
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.jade900,
    alignItems: 'center',
  },
  // Logo center is at ~40% from top:
  // paddingTop = 0.40 * H - 60  (60 = half of 120px logo)
  logoSection: {
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.40 - 60,
  },
  appName: {
    color: colors.surface,
    fontFamily: fonts.sans,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.sp12,
  },
  stateContent: {
    alignItems: 'center',
    paddingHorizontal: spacing.sp24,
    marginTop: spacing.sp32,
    width: '100%',
  },
  stateBoldText: {
    color: colors.surface,
    fontFamily: fonts.sans,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.sp20,
    textAlign: 'center',
  },
  stateBodyText: {
    color: WHITE_70,
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 22,
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
  },
  iconCircleDanger: {
    width: 64,
    height: 64,
    borderRadius: radius.rFull,
    backgroundColor: DANGER_20,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: colors.surface,
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '700',
  },
  // Outline button (maintenance)
  outlineButton: {
    height: 52,
    width: '80%',
    maxWidth: 320,
    borderRadius: radius.rLg,
    borderWidth: 1.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp32,
  },
  outlineButtonText: {
    color: colors.surface,
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '700',
  },
  // First install
  welcomeHeading: {
    color: colors.surface,
    fontFamily: fonts.sans,
    fontSize: 26,
    fontWeight: '800',
    marginTop: spacing.sp32,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    color: WHITE_80,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
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
    color: colors.surface,
    fontFamily: fonts.sans,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  firstInstallButton: {
    marginTop: spacing.sp24,
  },
  firstInstallCaption: {
    color: WHITE_40,
    fontFamily: fonts.sans,
    fontSize: 11,
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
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  versionBoxNumber: {
    color: colors.surface,
    fontFamily: fonts.mono,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.sp4,
  },
  versionArrow: {
    color: colors.surface,
    fontSize: 20,
  },
  updateButton: {
    marginTop: spacing.sp24,
  },
  // Loading state bottom area
  loadingBottom: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    alignItems: 'center',
  },
  loadingText: {
    color: WHITE_60,
    fontFamily: fonts.sans,
    fontSize: 13,
    marginBottom: spacing.sp8,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: WHITE_15,
  },
  progressFill: {
    height: 3,
    backgroundColor: colors.jade400,
  },
  // DEV switcher
  devRow: {
    position: 'absolute',
    bottom: 36,
    start: 0,
    end: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.sp4,
    paddingHorizontal: spacing.sp8,
  },
  devButton: {
    backgroundColor: WHITE_15,
    paddingHorizontal: spacing.sp6,
    paddingVertical: spacing.sp2,
    borderRadius: radius.rSm,
  },
  devButtonActive: {
    backgroundColor: JADE400_40,
  },
  devButtonText: {
    color: WHITE_60,
    fontSize: 9,
    fontFamily: fonts.mono,
  },
  // Version badge
  version: {
    position: 'absolute',
    bottom: spacing.sp16,
    end: spacing.sp16,
    color: WHITE_60,
    fontFamily: fonts.mono,
    fontSize: 10,
  },
});
