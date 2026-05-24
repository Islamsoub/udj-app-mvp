import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface SemesterTabsProps {
  active: 1 | 2;
  onChange: (s: 1 | 2) => void;
}

export function SemesterTabs({ active, onChange }: SemesterTabsProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Pressable style={({ pressed }) => [styles.tab, pressed && { backgroundColor: withAlpha(colors.jade400, 0.15), borderRadius: 6 }]} onPress={() => onChange(1)} hitSlop={4}>
        <Text style={[styles.label, active === 1 && styles.labelActive]}>
          {t('grades.semester1')}
        </Text>
        {active === 1 && <View style={styles.underline} />}
      </Pressable>

      {/* 20px spacer between the two 154px tabs */}
      <View style={styles.gap} />

      <Pressable style={({ pressed }) => [styles.tab, pressed && { backgroundColor: withAlpha(colors.jade400, 0.15), borderRadius: 6 }]} onPress={() => onChange(2)} hitSlop={4}>
        <Text style={[styles.label, active === 2 && styles.labelActive]}>
          {t('grades.semester2')}
        </Text>
        {active === 2 && <View style={styles.underline} />}
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 44,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp16,
    alignItems: 'center',
  },
  tab: {
    width: 154,
    height: 44,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  gap: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  labelActive: {
    color: colors.jade600,
  },
  underline: {
    width: 130,
    height: 1,
    backgroundColor: colors.jade600,
  },
});
