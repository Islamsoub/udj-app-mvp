import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { elevation, fonts, fz, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';

export type FilterValue = 'actionable' | 'all';

interface FilterSegmentProps {
  value: FilterValue;
  actionableCount: number;
  onChange: (value: FilterValue) => void;
}

export function FilterSegment({ value, actionableCount, onChange }: FilterSegmentProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isActionable = value === 'actionable';

  return (
    <View style={styles.track}>
      <PressBox
        tier="tint"
        style={[styles.segment, isActionable && styles.segmentActive]}
        onPress={() => onChange('actionable')}
        accessibilityRole="button"
        accessibilityState={{ selected: isActionable }}
      >
        <View style={styles.segmentInner}>
          <Text style={[styles.label, isActionable ? styles.labelActive : styles.labelInactive]}>
            {t('presence.filter_actionable')}
          </Text>
          {actionableCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{String(actionableCount)}</Text>
            </View>
          )}
        </View>
      </PressBox>

      <PressBox
        tier="tint"
        style={[styles.segment, !isActionable && styles.segmentActive]}
        onPress={() => onChange('all')}
        accessibilityRole="button"
        accessibilityState={{ selected: !isActionable }}
      >
        <View style={styles.segmentInner}>
          <Text style={[styles.label, !isActionable ? styles.labelActive : styles.labelInactive]}>
            {t('presence.filter_all')}
          </Text>
        </View>
      </PressBox>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  track: {
    flexDirection: 'row',
    marginHorizontal: spacing.sp16,
    padding: spacing.sp4,
    borderRadius: radius.rMd,
    backgroundColor: colors.surface2,
    gap: spacing.sp4,
  },
  segment: {
    flex: 1,
    padding: spacing.sp8,
    borderRadius: 9,
  },
  segmentActive: {
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  segmentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sp6,
  },
  label: {
    fontSize: fz(12.5),
    fontFamily: fonts.sans,
  },
  labelActive: {
    fontWeight: '700',
    color: colors.jadeText,
  },
  labelInactive: {
    fontWeight: '600',
    color: colors.textTertiary,
  },
  countBadge: {
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: radius.rFull,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: fz(10.5),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.white,
    includeFontPadding: false,
  },
});
