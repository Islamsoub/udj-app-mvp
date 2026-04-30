import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';

const FR_ABBREVS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const AR_ABBREVS = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];
const WEEKEND_INDICES = new Set([5, 6]);

function getWeekDates(): number[] {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d.getDate();
  });
}

interface DayStripProps {
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function DayStrip({ selectedIndex, onSelect }: DayStripProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const abbrevs = isAr ? AR_ABBREVS : FR_ABBREVS;
  const weekDates = getWeekDates();

  return (
    <View style={styles.strip}>
      {weekDates.map((date, idx) => {
        const isSelected = idx === selectedIndex;
        const isWeekend  = WEEKEND_INDICES.has(idx);

        return (
          <Pressable
            key={date}
            style={[
              styles.cell,
              isSelected && styles.cellSelected,
              isWeekend && !isSelected && styles.cellWeekend,
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
              {date}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
});
