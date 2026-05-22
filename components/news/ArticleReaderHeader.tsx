import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface ArticleReaderHeaderProps {
  topInset: number;
  onBack: () => void;
}

export function ArticleReaderHeader({ topInset, onBack }: ArticleReaderHeaderProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.wrapper, { paddingTop: topInset }]}>
      <View style={styles.row}>
        <Pressable style={({ pressed }) => [styles.btn, pressed && { backgroundColor: colors.textPrimary + '26', borderRadius: 999 }]} onPress={onBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
  },
  btn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
