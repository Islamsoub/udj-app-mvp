import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { elevation, fonts, radius, spacing, HEADER_PAD, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export type ProfileHeaderState =
  | 'skeleton'
  | 'loaded'
  | 'offline'
  | 'incomplete'
  | 'error'
  | 'session';

interface ProfileHeaderProps {
  state: ProfileHeaderState;
  topInset: number;
  isScrolled?: boolean;
  onDotsPress?: () => void;
}

export function ProfileHeader({ state, topInset, isScrolled = false, onDotsPress }: ProfileHeaderProps) {
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useColors();
  const isAr = i18n.language === 'ar';
  const styles = useMemo(() => makeStyles(colors, isAr), [colors, isAr]);

  const scrolledStyle = isScrolled
    ? isDark
      ? { borderBottomWidth: 1 as const, borderBottomColor: colors.hair }
      : elevation.card
    : {};

  return (
    <View style={[styles.container, { paddingTop: topInset + HEADER_PAD }, scrolledStyle]}>
      <Text style={styles.title}>{t('profile.title')}</Text>
      <Pressable style={styles.gearChip} hitSlop={8} onPress={onDotsPress}>
        <Ionicons name="settings-outline" size={19} color={colors.textPrimary} />
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Palette, isAr: boolean) => StyleSheet.create({
  container: {
    minHeight: 69,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp20,
    paddingBottom: spacing.sp12,
  },
  title: {
    fontSize: isAr ? 26 : 24,
    fontWeight: '800',
    fontFamily: isAr ? fonts.arabic : fonts.sans,
    color: colors.textPrimary,
    letterSpacing: isAr ? 0 : -0.5,
  },
  gearChip: {
    width: 38,
    height: 38,
    borderRadius: radius.rFull,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.card,
  },
});
