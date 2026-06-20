import React, { useMemo } from 'react';
import { View, Text, Switch, StyleSheet, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';

interface SettingsRowProps {
  label: string;
  value?: string;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  isDestructive?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
}

export function SettingsRow({
  label,
  value,
  isToggle = false,
  toggleValue = false,
  onToggle,
  isDestructive = false,
  onPress,
  disabled = false,
  showChevron = true,
  isLast = false,
}: SettingsRowProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const labelColor = isDestructive ? colors.danger : colors.textPrimary;

  if (isToggle) {
    return (
      <View style={[styles.row, isLast && styles.rowLast, disabled && styles.rowDisabled]}>
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
          {label}
        </Text>
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ false: colors.scheduleBorder, true: colors.jade400 }}
          thumbColor={colors.surface}
          ios_backgroundColor={colors.scheduleBorder}
          style={{ transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }] }}
        />
      </View>
    );
  }

  return (
    <PressBox
      tier="tint"
      style={[
        styles.row,
        isLast && styles.rowLast,
      ]}
      onPress={onPress}
      hitSlop={4}
      disabled={disabled}
    >
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {!isDestructive && showChevron ? (
        <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.greyMedium} />
      ) : null}
    </PressBox>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  label: {
    flex: 1,
    fontSize: fz(15.5),
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  value: {
    fontSize: fz(15),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    marginEnd: spacing.sp8,
  },
});
