import '@/i18n';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { runMigrations } from '@/services/db';
import { useAuthStore } from '@/stores/authStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export default function RootLayout() {
  const [migrationsReady, setMigrationsReady] = useState(false);
  const loadAuthFromStorage = useAuthStore((s) => s.loadAuthFromStorage);
  const authLoaded = useAuthStore((s) => s.loaded);

  // Font files go here once assets/fonts/ is populated — empty map loads instantly
  const [fontsLoaded] = useFonts({});

  useEffect(() => {
    async function prepare() {
      try {
        await Promise.all([runMigrations(), loadAuthFromStorage()]);
      } catch (e) {
        console.warn('Startup error:', e);
      } finally {
        setMigrationsReady(true);
      }
    }
    prepare();
  }, [loadAuthFromStorage]);

  useEffect(() => {
    if (fontsLoaded && migrationsReady && authLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, migrationsReady, authLoaded]);

  if (!fontsLoaded || !migrationsReady) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
