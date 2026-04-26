import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { colors } from '@/constants/theme';

export default function ProfileScreen() {
  const { t } = useTranslation();
  useNetworkStatus();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <OfflineBanner />
      <View style={styles.center}>
        <Text style={styles.label}>{t('screens.profile')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
});
