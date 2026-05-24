import '@/i18n';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { runMigrations } from '@/services/db';
import { useAuthStore } from '@/stores/authStore';
import { useColors } from '@/hooks/useColors';
import {
  registerForPushNotifications,
  setupNotificationListeners,
  isQuietHours,
} from '@/services/pushNotifications';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  const [migrationsReady, setMigrationsReady] = useState(false);
  const loadAuthFromStorage = useAuthStore((s) => s.loadAuthFromStorage);
  const authLoaded = useAuthStore((s) => s.loaded);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const student = useAuthStore((s) => s.student);
  const router = useRouter();
  const { isDark } = useColors();

  // Font files go here once assets/fonts/ is populated — empty map loads instantly
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-ExtraBold': require('../assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
    'DMmono': require('../assets/fonts/DMMono-Regular.ttf'),
    'DMmono-Medium': require('../assets/fonts/DMMono-Medium.ttf'),
    'NotoNaskhArabic': require('../assets/fonts/NotoNaskhArabic-Regular.ttf'),
    'NotoNaskhArabic-Bold': require('../assets/fonts/NotoNaskhArabic-Bold.ttf'),
  });

  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([runMigrations(), loadAuthFromStorage()]);
      } catch {
        // Startup failure — proceed to render; cached state handles offline
      } finally {
        setMigrationsReady(true);
      }
    }
    prepare();
  }, [loadAuthFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) return;

    registerForPushNotifications();

    const cleanup = setupNotificationListeners(
      (notification) => {
        const prefs = student?.preferences;
        if (isQuietHours(prefs?.quietHoursStart ?? null, prefs?.quietHoursEnd ?? null)) {
          Notifications.dismissNotificationAsync(notification.request.identifier);
        }
      },
      (response) => {
        const data = response.notification.request.content.data as { type?: string };
        switch (data?.type) {
          case 'GRADES':
            router.push('/(tabs)/grades');
            break;
          case 'SCHEDULE':
            router.push('/(tabs)/schedule');
            break;
          case 'ATTENDANCE':
            router.push('/attendance');
            break;
          default:
            router.push('/notifications');
            break;
        }
      }
    );

    return cleanup;
  }, [isAuthenticated]);

  useEffect(() => {
    function handleDeepLink(url: string) {
      const { hostname, path } = Linking.parse(url);
      const segments = [hostname, ...(path ? path.split('/') : [])].filter(Boolean);
      if (segments[0] === 'article' && segments[1]) {
        router.push({ pathname: '/article-reader', params: { id: segments[1] } });
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => sub.remove();
  }, [router]);

  useEffect(() => {
    if (fontsLoaded && migrationsReady && authLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, migrationsReady, authLoaded]);

  if (!fontsLoaded || !migrationsReady || !authLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
