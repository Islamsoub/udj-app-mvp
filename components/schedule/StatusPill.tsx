import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export type CourseStatus = 'past' | 'active' | 'upcoming';

interface StatusPillProps {
  status: CourseStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const { t } = useTranslation();
  const { colors } = useColors();

  const variants: Record<CourseStatus, { bg: string; color: string; key: string }> = {
    past:     { bg: colors.slateBg,   color: colors.slate,     key: 'schedule.status.done' },
    active:   { bg: colors.jadeFaint, color: colors.jadeText,  key: 'schedule.status.active' },
    upcoming: { bg: colors.blueBg,    color: colors.blue,      key: 'schedule.status.upcoming' },
  };

  const { bg, color, key } = variants[status];

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{t(key)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radius.rFull,
    paddingVertical: 5, // design constant: pill padding
    paddingHorizontal: spacing.sp12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fonts.sans,
  },
});
