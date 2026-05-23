import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

const FR_ABBREVS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const AR_ABBREVS = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
const WEEKEND_INDICES = new Set([5, 6]);

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const MONTHS_AR = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

function getWeekDates(weekOffset: number = 0): Date[] {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
}

function toArabicNumerals(n: number): string {
  const ar = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(n).split('').map((d) => ar[Number(d)] ?? d).join('');
}

interface DayStripProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function DayStrip({
  selectedIndex,
  onSelect,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onToday,
}: DayStripProps) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const abbrevs = isAr ? AR_ABBREVS : FR_ABBREVS;
  const weekDates = getWeekDates(weekOffset);
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const todayDayIndex = new Date().getDay();

  // Monday-of-week anchors the label (weekDates[1] — Sun=0, Mon=1)
  const monday = weekDates[1];
  const monthNames = isAr ? MONTHS_AR : MONTHS_FR;
  const dayNum = isAr ? toArabicNumerals(monday.getDate()) : String(monday.getDate());
  const weekLabel = t('schedule.week_of', {
    date: `${dayNum} ${monthNames[monday.getMonth()]}`,
  });

  // RTL: physical arrow direction follows reading direction so prev is always
  // on the start edge of the row.
  const prevIcon = isAr ? 'chevron-forward' : 'chevron-back';
  const nextIcon = isAr ? 'chevron-back' : 'chevron-forward';

  return (
    <View style={styles.wrapper}>
      {/* Week navigation row */}
      <View style={styles.weekNav}>
        <Pressable
          onPress={onPrevWeek}
          style={({ pressed }) => [
            styles.arrowBtn,
            pressed && { backgroundColor: colors.jade400 + '26' },
          ]}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Ionicons name={prevIcon} size={18} color={colors.textSecondary} />
        </Pressable>

        <Text style={styles.weekLabel} numberOfLines={1}>{weekLabel}</Text>

        <Pressable
          onPress={onNextWeek}
          style={({ pressed }) => [
            styles.arrowBtn,
            pressed && { backgroundColor: colors.jade400 + '26' },
          ]}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Ionicons name={nextIcon} size={18} color={colors.textSecondary} />
        </Pressable>

        {weekOffset !== 0 && (
          <Pressable
            onPress={onToday}
            style={({ pressed }) => [
              styles.todayPill,
              pressed && { backgroundColor: colors.jade600 },
            ]}
            hitSlop={6}
            accessibilityRole="button"
          >
            <Text style={styles.todayPillText}>{t('schedule.today')}</Text>
          </Pressable>
        )}
      </View>

      {/* Day cells row */}
      <View style={styles.strip}>
        {weekDates.map((d, idx) => {
          const isSelected = idx === selectedIndex;
          const isWeekend = WEEKEND_INDICES.has(idx);
          const isToday = weekOffset === 0 && idx === todayDayIndex;

          return (
            <Pressable
              key={idx}
              style={({ pressed }) => [
                styles.cell,
                isSelected && styles.cellSelected,
                isWeekend && !isSelected && styles.cellWeekend,
                pressed && !isWeekend && { backgroundColor: colors.jade400 + '26' },
              ]}
              onPress={() => !isWeekend && onSelect(idx)}
              hitSlop={4}
              accessibilityRole="button"
            >
              <Text style={[
                styles.abbrev,
                isSelected && styles.textSelected,
                isWeekend && !isSelected && styles.textWeekend,
              ]}>
                {abbrevs[idx]}
              </Text>
              <Text style={[
                styles.dateNum,
                isSelected && styles.textSelected,
                isWeekend && !isSelected && styles.textWeekend,
              ]}>
                {d.getDate()}
              </Text>
              {isToday && (
                <View style={[
                  styles.todayDot,
                  isSelected && styles.todayDotSelected,
                ]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.scheduleBorder,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp8,
    paddingBottom: spacing.sp4,
    gap: spacing.sp8,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  todayPill: {
    height: 28,
    paddingHorizontal: spacing.sp12,
    borderRadius: 14,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPillText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
  strip: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sp16,
    gap: spacing.sp4,
    height: 56,
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    height: 48,
    borderRadius: radius.rLg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sp2,
  },
  cellSelected: {
    backgroundColor: colors.jade400,
  },
  cellWeekend: {
    backgroundColor: colors.skeletonBase,
  },
  abbrev: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  dateNum: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  textSelected: {
    color: colors.surface,
  },
  textWeekend: {
    color: colors.textTertiary,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.jade400,
  },
  todayDotSelected: {
    backgroundColor: colors.surface,
  },
});
