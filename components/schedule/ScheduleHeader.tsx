import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { DayStrip } from './DayStrip';

interface ScheduleHeaderProps {
  topInset: number;
  selectedDayIndex: number;
  onDaySelect: (index: number) => void;
}

export function ScheduleHeader({ topInset, selectedDayIndex, onDaySelect }: ScheduleHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      {/* Title row */}
      <View style={[styles.titleRow, { paddingTop: topInset + spacing.sp16 }]}>
        <Text style={styles.title}>{t('schedule.title')}</Text>
        <View style={styles.actions}>
          <View style={styles.iconCircle}>
            <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
          </View>
          <View style={styles.iconCircle}>
            <Ionicons name="menu-outline" size={16} color={colors.textSecondary} />
          </View>
        </View>
      </View>

      {/* Divider between title and day strip */}
      <View style={styles.divider} />

      {/* Day strip */}
      <DayStrip selectedIndex={selectedDayIndex} onSelect={onDaySelect} />

      {/* Today subtitle */}
      <Text style={styles.subtitle}>{t('schedule.today_prefix')}</Text>

      {/* Bottom divider */}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
    paddingBottom: spacing.sp16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sp8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.rFull,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.jade400,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp12,
  },
});
