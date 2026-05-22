import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { spacing, radius } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface TagProps {
  label: string;
  color?: string;
  background?: string;
  style?: StyleProp<ViewStyle>;
}

export function Tag({ label, color, background, style }: TagProps) {
  const { colors } = useColors();
  const resolvedColor = color ?? colors.jade400;
  const resolvedBackground = background ?? colors.jade50;
  return (
    <View style={[styles.tag, { backgroundColor: resolvedBackground }, style]}>
      <Text style={[styles.label, { color: resolvedColor }]}>{label}</Text>
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
