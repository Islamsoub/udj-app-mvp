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
      {/* Title row — Y=14 from content top per Figma */}
      <View style={[styles.titleRow, { paddingTop: topInset + 14 }]}>
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

      {/* Day strip — has its own top/bottom border per Figma */}
      <DayStrip selectedIndex={selectedDayIndex} onSelect={onDaySelect} />

      {/* Today subtitle — Y=120 from content top (16px gap after strip end at Y=104) */}
      <Text style={styles.subtitle}>{t('schedule.today_prefix')}</Text>

      {/* Header bottom border */}
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
    backgroundColor: colors.scheduleBorder,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.jade400,
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp16,
    paddingBottom: 9,
  },
});
