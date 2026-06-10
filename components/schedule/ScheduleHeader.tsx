import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { elevation, fonts, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { DayStrip } from './DayStrip';
import { formatScheduleDate } from '@/utils/dateFormat';

interface ScheduleHeaderProps {
  topInset: number;
  selectedDayIndex: number;
  onDaySelect: (index: number) => void;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  isScrolled: boolean;
}

export function ScheduleHeader({
  topInset,
  selectedDayIndex,
  onDaySelect,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onToday,
  isScrolled,
}: ScheduleHeaderProps) {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isAr = i18n.language === 'ar';

  const selectedDate = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    const selected = new Date(startOfWeek);
    selected.setDate(startOfWeek.getDate() + selectedDayIndex);
    return selected;
  }, [selectedDayIndex, weekOffset]);

  const isToday = weekOffset === 0 && selectedDayIndex === new Date().getDay();
  const dateLabel = formatScheduleDate(selectedDate);
  const subtitle = isToday
    ? t('schedule.subtitle_today', { date: dateLabel })
    : dateLabel;

  const scrolledStyle = isScrolled
    ? isDark
      ? { borderBottomWidth: 1 as const, borderBottomColor: colors.hair }
      : elevation.card
    : undefined;

  return (
    <View style={[styles.header, scrolledStyle]}>
      <View style={[styles.titleRow, { paddingTop: topInset + spacing.sp2 }]}>
        <Text style={[styles.title, isAr && styles.titleAr]}>
          {t('schedule.title')}
        </Text>
      </View>

      <DayStrip
        selectedIndex={selectedDayIndex}
        onSelect={onDaySelect}
        weekOffset={weekOffset}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onToday={onToday}
      />

      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.hairline} />
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  header: {
    backgroundColor: colors.background,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp20,
    paddingBottom: spacing.sp14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fonts.sans,
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  titleAr: {
    fontSize: 26,
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.jadeText,
    paddingHorizontal: spacing.sp16,
    marginTop: spacing.sp12,
    paddingBottom: spacing.sp8,
  },
  hairline: {
    height: 1,
    backgroundColor: colors.hair,
    marginTop: spacing.sp14,
  },
});
