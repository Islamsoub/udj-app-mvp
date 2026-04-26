import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNetworkStore } from '@/stores/networkStore';
import { spacing } from '@/constants/theme';

function formatTimestamp(ts: number | null): string {
  if (!ts) return '--';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function OfflineBanner() {
  const { t } = useTranslation();
  const { isOnline, lastSyncAt } = useNetworkStore();

  if (isOnline) return null;

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <Text style={styles.text}>
        {t('common.offlineBanner', { time: formatTimestamp(lastSyncAt) })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    borderBottomWidth: 1,
    borderBottomColor: '#FBD38D',
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
    width: '100%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
    marginEnd: spacing.sp8,
  },
  text: {
    color: '#9A3412',
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },
});
