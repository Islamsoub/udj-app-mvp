import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, radius, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export function CacheBanner() {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.banner}>
      <Ionicons name="calendar-outline" size={22} color={colors.offline} style={styles.icon} />
      <Text style={styles.text} numberOfLines={1}>
        <Text style={styles.normal}>{t('schedule.offline.cache_prefix')}</Text>
        <Text style={styles.bold}>{t('schedule.offline.cache_semester')}</Text>
        <Text style={styles.normal}>{t('schedule.offline.cache_suffix')}</Text>
      </Text>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  banner: {
    height: 27,
    borderWidth: 1,
    borderColor: colors.offline,
    borderRadius: radius.rMd,
    backgroundColor: colors.offlineBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: 22,
    paddingEnd: 8,
    gap: 8,
    overflow: 'hidden',
  },
  icon: {
    flexShrink: 0,
  },
  text: {
    fontSize: 10,
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  normal: {
    fontWeight: '500',
  },
  bold: {
    fontWeight: '700',
  },
});
