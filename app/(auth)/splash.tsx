import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { colors } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ONBOARDED_KEY = 'udj_onboarded';

export default function SplashScreen() {
  const router = useRouter();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const language = useSettingsStore((s) => s.language);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    i18n.changeLanguage(language);

    // Fade in the app name at 400ms
    const fadeTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }, 400);

    // Animate the progress bar over 1.5s
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Route after max 2s
    const routeTimer = setTimeout(async () => {
      try {
        if (isLoggedIn) {
          router.replace('/(tabs)/home');
          return;
        }
        const onboarded = await AsyncStorage.getItem(ONBOARDED_KEY);
        if (!onboarded) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(auth)/login');
        }
      } catch {
        router.replace('/(auth)/login');
      }
    }, 2000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(routeTimer);
    };
  }, [isLoggedIn, language, fadeAnim, progressAnim, router]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SCREEN_WIDTH],
  });

  return (
    <View style={styles.container}>
      {/* Logo placeholder — replace with SVG once assets are ready */}
      <View style={styles.logoContainer}>
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>UDJ</Text>
        </View>
        <Animated.Text style={[styles.appName, { opacity: fadeAnim }]}>
          Université de Djibouti
        </Animated.Text>
      </View>

      {/* Loading bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>

      {/* Version */}
      <Text style={styles.version}>v1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.jade900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
  },
  appName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    letterSpacing: 0.5,
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.jade400,
  },
  version: {
    position: 'absolute',
    bottom: 12,
    end: 16,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontFamily: 'DMmono',
  },
});
