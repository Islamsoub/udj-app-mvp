import { View, Text, Pressable, StyleSheet, useColorScheme, StatusBar } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Sentry from '@sentry/react-native';
import { fz, lightColors, darkColors, radius } from '@/constants/theme';

// Uses useColorScheme() directly instead of useColors() — this is the global
// error boundary and must not depend on the Zustand theme store, which could
// itself be in a bad state when this renders.
export default function GlobalError({ error, retry }: { error: Error; retry: () => void }) {
  const router = useRouter();
  const scheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = scheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  // Report caught errors (not just unhandled crashes) to Sentry.
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Oups, une erreur est survenue</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {__DEV__ ? error.message : "L'application a rencontré un problème."}
      </Text>
      <Pressable style={[styles.button, { backgroundColor: colors.jade400 }]} onPress={retry}>
        <Text style={[styles.buttonText, { color: colors.white }]}>Réessayer</Text>
      </Pressable>
      <Pressable style={styles.linkButton} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={[styles.linkText, { color: colors.jade400 }]}>Retour à l'accueil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  icon: { fontSize: fz(48), marginBottom: 16 },
  title: { fontSize: fz(20), fontWeight: '600', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: fz(14), textAlign: 'center', marginBottom: 24 },
  button: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: radius.rLg, marginBottom: 12 },
  buttonText: { fontSize: fz(16), fontWeight: '600' },
  linkButton: { padding: 12 },
  linkText: { fontSize: fz(14) },
});
