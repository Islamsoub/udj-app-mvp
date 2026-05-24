import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface InfoRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  isLogout?: boolean;
  icon?: IoniconName;
}

export function InfoRow({ label, value, onPress, isLogout = false, icon }: InfoRowProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const labelColor = isLogout ? colors.danger : colors.textPrimary;
  const chevronColor = isLogout ? colors.danger : colors.greyMedium;
  const iconColor = isLogout ? colors.danger : colors.greyMedium;
  const showChevron = onPress !== undefined;

  const content = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={20}
          color={iconColor}
          style={styles.icon}
        />
      ) : null}
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {showChevron ? (
        <Ionicons name="chevron-forward" size={16} color={chevronColor} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.row,
          pressed && { backgroundColor: withAlpha(colors.textPrimary, 0.06) },
        ]}
        onPress={onPress}
        hitSlop={4}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={styles.row}>{content}</View>;
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: {
    minHeight: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
  },
  icon: {
    marginEnd: spacing.sp12,
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
