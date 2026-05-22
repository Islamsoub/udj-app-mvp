import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Animated,
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
import { fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import type { ComponentProps } from 'react';
import { DevSwitcher } from '@/components/ui/DevSwitcher';

// SVG transformer handles the module — typed explicitly to avoid `any` exposure
const LogoSVG = (
  require('@/assets/icons/Logo.svg') as { default: React.FC<{ width: number; height: number }> }
).default;

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

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    const encodedPayload = parts[1];
    if (!encodedPayload) return false;
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function SplashScreen() {
  const router = useRouter();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [splashState, setSplashState] = useState<SplashState>('loading');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
        const token = await SecureStore.getItemAsync(JWT_KEY);
        if (token !== null && isTokenValid(token)) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/(auth)/onboarding');
        }
      } catch {
        router.replace('/(auth)/onboarding');
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
            <Ionicons name="cloud-offline-outline" size={32} color={colors.surface} />
          </View>
          <Text style={styles.stateBoldText}>Pas de connexion</Text>
          <Text style={styles.stateBodyText}>
            {'Vérifiez votre connexion Wi-Fi\nou données mobiles pour continuer.'}
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => setSplashState('loading')}
            hitSlop={8}
          >
            <Text style={styles.primaryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {/* ── State: maintenance ── */}
      {splashState === 'maintenance' && (
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
      {splashState === 'first-install' && (
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
      {splashState === 'force-update' && (
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

      {/* ── State: loading — static pill + label ── */}
      {splashState === 'loading' && (
        <>
          <View style={styles.pillTrack}>
            <Animated.View
              style={{
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 37] }),
                height: 3,
                borderRadius: 12,
                backgroundColor: '#D9D9D9',
              }}
            />
          </View>
          <Text style={styles.loadingText}>Chargement</Text>
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
    left: 0,
    right: 0,
    alignSelf: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontFamily: fonts.sans,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
  // Loading state: static pill indicator
  pillTrack: {
    position: 'absolute',
    top: 691,
    alignSelf: 'center',
    width: 37,
    height: 3,
    borderRadius: 12,
    backgroundColor: '#6B7B74',
  },
  pillFill: {
    width: 24,
    height: 3,
    borderRadius: 12,
    backgroundColor: '#D9D9D9',
  },
  loadingText: {
    position: 'absolute',
    top: 705,
    alignSelf: 'center',
    fontFamily: fonts.sans,
    fontSize: 12,
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
    fontSize: 10,
  },
});
