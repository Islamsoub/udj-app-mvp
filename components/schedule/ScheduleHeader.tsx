import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { DayStrip } from './DayStrip';

interface ScheduleHeaderProps {
  topInset: number;
  selectedDayIndex: number;
  onDaySelect: (index: number) => void;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function ScheduleHeader({
  topInset,
  selectedDayIndex,
  onDaySelect,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onToday,
}: ScheduleHeaderProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const DAYS_AR = ['الأحد','الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
  const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

  // Date of the currently-selected day in the currently-displayed week.
  const selectedDate = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + weekOffset * 7);
    const selected = new Date(startOfWeek);
    selected.setDate(startOfWeek.getDate() + selectedDayIndex);
    return selected;
  }, [selectedDayIndex, weekOffset]);

  const isToday = weekOffset === 0 && selectedDayIndex === new Date().getDay();
  const isAr = i18n.language === 'ar';
  const days = isAr ? DAYS_AR : DAYS_FR;
  const months = isAr ? MONTHS_AR : MONTHS_FR;
  const dateLabel = `${days[selectedDate.getDay()]} ${selectedDate.getDate()} ${months[selectedDate.getMonth()]}`;
  const subtitle = isToday ? `${t('schedule.today')} – ${dateLabel}` : dateLabel;

  return (
    <View style={styles.header}>
      {/* Title row — Y=14 from content top per Figma */}
      <View style={[styles.titleRow, { paddingTop: topInset + 14 }]}>
        <Text style={styles.title}>{t('schedule.title')}</Text>
      </View>

      {/* Day strip — has its own top/bottom border per Figma */}
      <DayStrip
        selectedIndex={selectedDayIndex}
        onSelect={onDaySelect}
        weekOffset={weekOffset}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onToday={onToday}
      />

      {/* Selected-day subtitle — Y=120 from content top (16px gap after strip end at Y=104) */}
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* Header bottom border */}
      <View style={styles.divider} />
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
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
