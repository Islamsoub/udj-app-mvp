import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, radius, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { toArabicNumerals } from '@/utils/dateFormat';

const FR_ABBREVS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const AR_ABBREVS = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
// Djibouti weekend: Fri+Sat
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

  // Monday-of-week anchors the week label (weekDates[1] — Sun=0, Mon=1)
  const monday = weekDates[1];
  const monthNames = isAr ? MONTHS_AR : MONTHS_FR;
  const dayNum = isAr ? toArabicNumerals(monday.getDate()) : String(monday.getDate());
  const weekLabel = t('schedule.week_of', {
    date: `${dayNum} ${monthNames[monday.getMonth()]}`,
  });

  // RTL: physical arrow direction follows reading direction
  const prevIcon = isAr ? 'chevron-forward' : 'chevron-back';
  const nextIcon = isAr ? 'chevron-back' : 'chevron-forward';

  return (
    <View>
      {/* Week navigation row */}
      <View style={styles.weekNav}>
        <Pressable
          onPress={onPrevWeek}
          style={({ pressed }) => [
            styles.arrowBtn,
            pressed && { backgroundColor: withAlpha(colors.jade400, 0.15) },
          ]}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Ionicons name={prevIcon} size={20} color={colors.textSecondary} />
        </Pressable>

        <Text style={styles.weekLabel} numberOfLines={1}>{weekLabel}</Text>

        <Pressable
          onPress={onNextWeek}
          style={({ pressed }) => [
            styles.arrowBtn,
            pressed && { backgroundColor: withAlpha(colors.jade400, 0.15) },
          ]}
          hitSlop={8}
          accessibilityRole="button"
        >
          <Ionicons name={nextIcon} size={20} color={colors.textSecondary} />
        </Pressable>

        {weekOffset !== 0 && (
          <Pressable
            onPress={onToday}
            style={({ pressed }) => [
              styles.todayPill,
              pressed && { backgroundColor: withAlpha(colors.jade400, 0.25) },
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
          // Djibouti weekend: Fri+Sat
          const isWeekend = WEEKEND_INDICES.has(idx);
          const isToday = weekOffset === 0 && idx === todayDayIndex;
          const dateDisplay = isAr ? toArabicNumerals(d.getDate()) : String(d.getDate());

          return (
            <Pressable
              key={idx}
              style={({ pressed }) => [
                styles.cell,
                isSelected && styles.cellSelected,
                isWeekend && !isSelected && styles.cellWeekend,
                pressed && !isSelected && { backgroundColor: withAlpha(colors.jade400, 0.12) },
              ]}
              onPress={() => onSelect(idx)}
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
                {dateDisplay}
              </Text>
              {isToday && !isSelected && (
                <View style={styles.todayDot} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
    marginTop: spacing.sp14,
    paddingBottom: spacing.sp4,
    gap: spacing.sp8,
  },
  arrowBtn: {
    // 38×38 design constant: comfortable nav button hit area
    width: 38,
    height: 38,
    borderRadius: radius.rFull,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: fz(15),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  todayPill: {
    height: 28,
    paddingHorizontal: spacing.sp12,
    paddingVertical: spacing.sp4,
    borderRadius: radius.rFull,
    backgroundColor: colors.jadeFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayPillText: {
    fontSize: fz(13),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.jadeText,
  },
  strip: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sp16,
    gap: spacing.sp4,
    marginTop: spacing.sp12,
    paddingBottom: spacing.sp12,
  },
  cell: {
    // 62px height: Figma design constant for the day cell
    flex: 1,
    height: 62,
    borderRadius: radius.rXl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sp4,
    paddingVertical: spacing.sp8,
  },
  cellSelected: {
    backgroundColor: colors.jade400,
    shadowColor: colors.jade400,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cellWeekend: {
    backgroundColor: colors.sunken,
  },
  abbrev: {
    // 12.5px: Figma design constant for day-cell label
    fontSize: fz(12.5),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
  },
  dateNum: {
    // 17px DM Mono: Figma design constant for day-cell date number
    fontSize: fz(17),
    fontWeight: '500',
    fontFamily: fonts.mono,
    color: colors.textPrimary,
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
    borderRadius: radius.rFull,
    backgroundColor: colors.jade400,
    marginTop: spacing.sp2,
  },
});
