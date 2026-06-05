import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing, withAlpha, type Palette } from '@/constants/theme';
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
  onDotsPress?: () => void;
}

// Header strip height (content area; topInset added at render)
const HEADER_STRIP_H = 93;

// ── Header strip inner ────────────────────────────────────────────────────────

function HeaderStrip({
  t,
  onDotsPress,
  styles,
  colors,
}: {
  t: ReturnType<typeof useTranslation>['t'];
  onDotsPress?: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: Palette;
}) {
  return (
    <View style={styles.headerStrip}>
      <Text style={styles.headerTitle}>{t('profile.title')}</Text>
      <Pressable style={({ pressed }) => [styles.dotsButton, pressed && { backgroundColor: withAlpha(colors.greyMedium, 0.15), borderRadius: 999 }]} hitSlop={8} onPress={onDotsPress}>
        <Ionicons name="settings-outline" size={18} color={colors.greyMedium} />
      </Pressable>
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ProfileHeader({ state, topInset, onDotsPress }: ProfileHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View
      style={[
        styles.whiteArea,
        styles.whiteAreaBorder,
        { height: HEADER_STRIP_H + topInset, paddingTop: topInset },
      ]}
    >
      <HeaderStrip t={t} onDotsPress={onDotsPress} styles={styles} colors={colors} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (colors: Palette) => StyleSheet.create({
  // White area container
  whiteArea: {
    backgroundColor: colors.surface,
    flexDirection: 'column',
  },
  whiteAreaBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.scheduleBorder,
  },

  // Header strip
  headerStrip: {
    height: HEADER_STRIP_H,
    borderBottomWidth: 1,
    borderBottomColor: colors.newsHeaderBorder,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
    paddingBottom: spacing.sp14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  dotsButton: {
    width: 34,
    height: 34,
    borderRadius: 30,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sp6,
  },

});

