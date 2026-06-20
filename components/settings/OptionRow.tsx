import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, lightColors, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';

interface OptionRowProps {
  label: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
  preview?: { text: string; size: number };
  icon?: (selected: boolean) => React.ReactElement;
}

export function OptionRow({
  label,
  subtitle,
  selected,
  onPress,
  isLast = false,
  preview,
  icon,
}: OptionRowProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <PressBox
      tier="tint"
      style={[styles.row, !isLast && styles.rowBorder]}
      onPress={onPress}
      hitSlop={4}
    >
      {icon ? <View style={styles.iconWrap}>{icon(selected)}</View> : null}
      <View style={styles.left}>
        <Text style={styles.label}>{label}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {preview ? (
          <Text style={[styles.previewText, { fontSize: preview.size }]}>
            {preview.text}
          </Text>
        ) : null}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? (
          <Ionicons name="checkmark" size={14} color={colors.white} />
        ) : null}
      </View>
    </PressBox>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: {
    minHeight: 56,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp20,
    paddingVertical: spacing.sp12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
  },
  left: {
    flex: 1,
    marginEnd: spacing.sp12,
  },
  label: {
    fontSize: fz(14),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: fz(12),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    marginTop: spacing.sp2,
  },
  previewText: {
    fontFamily: fonts.sans,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: spacing.sp4,
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: spacing.sp12,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: colors.jade400,
    borderColor: colors.jade400,
  },
});
