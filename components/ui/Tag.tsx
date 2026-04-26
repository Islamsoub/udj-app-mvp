import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { colors, spacing, radius } from '@/constants/theme';

interface TagProps {
  label: string;
  color?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
}

export function Tag({ label, color = colors.jade400, background = colors.jade50, style }: TagProps) {
  return (
    <View style={[styles.tag, { backgroundColor: background }, style]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sp4,
    paddingHorizontal: spacing.sp8,
    borderRadius: radius.rFull,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.1 * 10,
  },
});
