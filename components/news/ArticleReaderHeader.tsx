import React, { useMemo } from 'react';
import { View, Pressable, StyleSheet, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { elevation, radius, spacing, HEADER_PAD, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface ArticleReaderHeaderProps {
  topInset: number;
  onBack: () => void;
}

export function ArticleReaderHeader({ topInset, onBack }: ArticleReaderHeaderProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const chevron = I18nManager.isRTL ? 'chevron-forward' : 'chevron-back';

  return (
    <View style={[styles.wrapper, { paddingTop: topInset + HEADER_PAD }]}>
      <View style={styles.row}>
        <Pressable
          style={[styles.btn, elevation.card]}
          onPress={onBack}
          hitSlop={8}
        >
          <Ionicons name={chevron} size={22} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background,
    },
    row: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sp16,
    },
    btn: {
      width: 38,
      height: 38,
      borderRadius: radius.rFull,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
