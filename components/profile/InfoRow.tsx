import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, radius, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface InfoRowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  isLogout?: boolean;
  isLast?: boolean;
  icon?: IoniconName;
  iconColor?: string;
}

export function InfoRow({
  label,
  value,
  onPress,
  isLogout = false,
  isLast = false,
  icon,
  iconColor,
}: InfoRowProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const labelColor = isLogout ? colors.danger : colors.textPrimary;
  const chevronColor = isLogout ? colors.danger : colors.greyMedium;
  const showChevron = onPress !== undefined && !isLogout;

  const content = (
    <>
      {icon && iconColor ? (
        <View
          style={[
            styles.iconChip,
            { backgroundColor: withAlpha(iconColor, 0.12) },
          ]}
        >
          <Ionicons name={icon} size={17} color={iconColor} />
        </View>
      ) : null}
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {label}
      </Text>
      {value ? (
        <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
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
          isLast && styles.rowLast,
          pressed && { backgroundColor: withAlpha(colors.textPrimary, 0.06) },
        ]}
        onPress={onPress}
        hitSlop={4}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      {content}
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: {
    minHeight: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconChip: {
    width: 34,
    height: 34,
    borderRadius: radius.rMd,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 13,
    flexShrink: 0,
  },
  label: {
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 'auto',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  value: {
    flexShrink: 1,
    flexBasis: 'auto',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    marginStart: spacing.sp8,
    marginEnd: spacing.sp8,
  },
});
