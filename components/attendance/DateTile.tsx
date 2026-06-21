import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, fz, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export type JustificationStatus = 'unjustified' | 'pending' | 'approved' | 'rejected';

// 3-letter month abbreviations, indexed by Date.getMonth()
const MONTHS_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jui', 'aoû', 'sep', 'oct', 'nov', 'déc'];
const MONTHS_AR = ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'];

interface DateTileProps {
  /** ISO date string */
  date: string;
  status: JustificationStatus;
  /** Tile edge length — default 46 (JustifySheet uses 42) */
  size?: number;
}

/** Status-tinted background fill (light / dark variants). */
function tintBg(status: JustificationStatus, colors: Palette, isDark: boolean): string {
  switch (status) {
    case 'unjustified':
      return isDark ? 'rgba(255,107,107,0.16)' : 'rgba(239,68,68,0.12)';
    case 'pending':
      return isDark ? 'rgba(240,168,75,0.16)' : 'rgba(224,138,30,0.14)';
    case 'approved':
      return withAlpha(colors.jade400, 0.10);
    case 'rejected':
      return colors.surface2;
  }
}

/** Status foreground color, shared by the day number and month label. */
function tintFg(status: JustificationStatus, colors: Palette): string {
  switch (status) {
    case 'unjustified':
      return colors.danger;
    case 'pending':
      return colors.warning;
    case 'approved':
      return colors.jadeText;
    case 'rejected':
      return colors.textTertiary;
  }
}

export function DateTile({ date, status, size = 46 }: DateTileProps) {
  const { i18n } = useTranslation();
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isAr = i18n.language === 'ar';
  const d = new Date(date);
  // Latin digits always — even in Arabic mode
  const dayNum = String(d.getDate());
  const month = (isAr ? MONTHS_AR : MONTHS_FR)[d.getMonth()];

  const bg = tintBg(status, colors, isDark);
  const fg = tintFg(status, colors);

  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: bg }]}>
      <Text style={[styles.day, { color: fg }]}>{dayNum}</Text>
      <Text style={[styles.month, { color: fg, fontFamily: isAr ? fonts.arabic : fonts.sans }]}>
        {month}
      </Text>
    </View>
  );
}

const makeStyles = (_colors: Palette) => StyleSheet.create({
  tile: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    fontSize: fz(17),
    fontWeight: '500',
    fontFamily: fonts.mono,
    includeFontPadding: false,
  },
  month: {
    fontSize: fz(9.5),
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
    includeFontPadding: false,
  },
});
