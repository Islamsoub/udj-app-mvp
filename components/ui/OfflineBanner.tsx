import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNetworkStore } from '@/stores/networkStore';
import { useColors } from '@/hooks/useColors';
import { fz, spacing } from '@/constants/theme';

function formatTimestamp(ts: number | null): string {
  if (!ts) return '--';
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function OfflineBanner() {
  const { t } = useTranslation();
  const { colors } = useColors();
  const { isOnline, lastSyncAt } = useNetworkStore();

  if (isOnline) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.offlineBg, borderBottomColor: colors.warningBorder }]}>
      <View style={[styles.dot, { backgroundColor: colors.offline }]} />
      <Text style={[styles.text, { color: colors.offlineText }]}>
        {t('common.offlineBanner', { time: formatTimestamp(lastSyncAt) })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
    width: '100%',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginEnd: spacing.sp8,
  },
  text: {
    fontSize: fz(12),
    fontWeight: '500',
    flexShrink: 1,
  },
});
