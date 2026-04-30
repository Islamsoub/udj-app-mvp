import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export function CacheBanner() {
  const { t } = useTranslation();

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>
        <Text>{'🗓 '}</Text>
        <Text style={styles.normal}>{t('schedule.offline.cache_prefix')}</Text>
        <Text style={styles.bold}>{t('schedule.offline.cache_semester')}</Text>
        <Text style={styles.normal}>{t('schedule.offline.cache_suffix')}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderWidth: 1,
    borderColor: colors.offline,
    borderRadius: radius.rLg,
    backgroundColor: colors.offlineBg,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp12,
    marginBottom: spacing.sp16,
  },
  text: {
    fontSize: 13,
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    flexWrap: 'wrap',
  },
  normal: {
    fontWeight: '500',
  },
  bold: {
    fontWeight: '700',
  },
});
