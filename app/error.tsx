import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { fz } from '@/constants/theme';

// Hardcoded colors are intentional — if useColors()/theme crashes, this screen
// must still render. This is the only acceptable exception to the no-hardcoded-colors rule.
export default function GlobalError({ error, retry }: { error: Error; retry: () => void }) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.title}>Oups, une erreur est survenue</Text>
      <Text style={styles.message}>
        {__DEV__ ? error.message : "L'application a rencontré un problème."}
      </Text>
      <Pressable style={styles.button} onPress={retry}>
        <Text style={styles.buttonText}>Réessayer</Text>
      </Pressable>
      <Pressable style={styles.linkButton} onPress={() => router.replace('/(tabs)/home')}>
        <Text style={styles.linkText}>Retour à l'accueil</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#F5F7F6' },
  icon: { fontSize: fz(48), marginBottom: 16 },
  title: { fontSize: fz(20), fontWeight: '600', marginBottom: 8, textAlign: 'center', color: '#1C2320' },
  message: { fontSize: fz(14), color: '#6B7B74', textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#1D9E75', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginBottom: 12 },
  buttonText: { color: '#FFFFFF', fontSize: fz(16), fontWeight: '600' },
  linkButton: { padding: 12 },
  linkText: { color: '#1D9E75', fontSize: fz(14) },
});
