import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface OptionRowProps {
  label: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
  preview?: { text: string; size: number };
}

export function OptionRow({
  label,
  subtitle,
  selected,
  onPress,
  isLast = false,
  preview,
}: OptionRowProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      style={({ pressed }) => [styles.row, !isLast && styles.rowBorder, pressed && { backgroundColor: colors.textPrimary + '0F' }]}
      onPress={onPress}
      hitSlop={4}
    >
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
          <Ionicons name="checkmark" size={14} color={colors.surface} />
        ) : null}
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: {
    minHeight: 54,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp20,
    paddingVertical: spacing.sp12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flex: 1,
    marginEnd: spacing.sp12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
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
