import React from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '@/constants/theme';

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
}: SettingsRowProps) {
  const labelColor = isDestructive ? colors.danger : colors.textPrimary;

  if (isToggle) {
    return (
      <View style={[styles.row, disabled && styles.rowDisabled]}>
        <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
          {label}
        </Text>
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ false: '#D9D9D9', true: colors.jade400 }}
          thumbColor={colors.surface}
        />
      </View>
    );
  }

  return (
    <Pressable style={styles.row} onPress={onPress} hitSlop={4} disabled={disabled}>
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {!isDestructive && showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={colors.greyMedium} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 54,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
  },
  rowDisabled: {
    opacity: 0.5,
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    marginEnd: spacing.sp8,
  },
});
