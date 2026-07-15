import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, fz, radius, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import type { JustificationStatus } from './DateTile';

// The badge also renders the PARTIAL attendance status (Pass C), which is not a
// justification lifecycle state — hence a locally-widened union.
export type BadgeStatus = JustificationStatus | 'partial';

interface StatusBadgeProps {
  status: BadgeStatus;
}

const LABEL_KEYS: Record<BadgeStatus, string> = {
  unjustified: 'presence.status_unjustified',
  pending: 'presence.status_pending',
  approved: 'presence.status_approved',
  rejected: 'presence.status_rejected',
  partial: 'attendance.partial',
};

/** Pill background + text color for each status (light / dark variants). */
function badgeColors(
  status: BadgeStatus,
  colors: Palette,
  isDark: boolean,
): { bg: string; text: string } {
  switch (status) {
    case 'unjustified':
      return {
        bg: isDark ? 'rgba(255,107,107,0.16)' : 'rgba(239,68,68,0.12)',
        text: isDark ? colors.danger : '#b91c1c',
      };
    case 'pending':
    case 'partial':
      // Both use the amber warning treatment.
      return {
        bg: isDark ? 'rgba(240,168,75,0.16)' : 'rgba(224,138,30,0.14)',
        text: isDark ? colors.warning : '#9a5b06',
      };
    case 'approved':
      return {
        bg: withAlpha(colors.jade400, 0.10),
        text: isDark ? colors.jade400 : colors.jadeText,
      };
    case 'rejected':
      return { bg: colors.surface2, text: colors.textTertiary };
  }
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { bg, text } = badgeColors(status, colors, isDark);

  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color: text }]}>{t(LABEL_KEYS[status])}</Text>
    </View>
  );
}

const makeStyles = (_colors: Palette) => StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: radius.rFull,
  },
  label: {
    fontSize: fz(10.5),
    fontWeight: '700',
    fontFamily: fonts.sans,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
});
