import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '@/constants/theme';

interface InfoRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  isLogout?: boolean;
}

export function InfoRow({ label, value, onPress, isLogout = false }: InfoRowProps) {
  const labelColor = isLogout ? colors.danger : colors.textPrimary;
  const chevronColor = isLogout ? colors.danger : colors.greyMedium;

  return (
    <Pressable style={styles.row} onPress={onPress} hitSlop={4}>
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={chevronColor} />
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
