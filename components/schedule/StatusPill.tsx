import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export type CourseStatus = 'past' | 'active' | 'upcoming';

interface StatusPillProps {
  status: CourseStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const { t } = useTranslation();
  const { colors } = useColors();

  const variants: Record<CourseStatus, { bg: string; color: string; key: string }> = {
    past:     { bg: colors.border,     color: colors.textSecondary, key: 'schedule.status.done' },
    active:   { bg: colors.jade75,     color: colors.jade600,       key: 'schedule.status.active' },
    upcoming: { bg: colors.infoLight,  color: colors.info,          key: 'schedule.status.upcoming' },
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
    height: 21,
    borderRadius: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
    lineHeight: 16,
  },
});
