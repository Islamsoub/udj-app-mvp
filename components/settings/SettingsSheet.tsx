import React, { ReactNode, useMemo } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { fonts, radius, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface SettingsSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  height?: number;
  children: ReactNode;
}

export function SettingsSheet({
  visible,
  onClose,
  title,
  subtitle,
  height,
  children,
}: SettingsSheetProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, height ? { minHeight: height } : undefined]}>
          <View style={styles.handle} />
          {title ? <Text style={styles.title}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: withAlpha(colors.black, 0.45),
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.r2xl,
    borderTopRightRadius: radius.r2xl,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.rFull,
    backgroundColor: colors.skeletonBase,
    marginTop: spacing.sp12,
    marginBottom: spacing.sp16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sp20,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
    paddingHorizontal: spacing.sp20,
    marginTop: spacing.sp4,
  },
  content: {
    marginTop: spacing.sp8,
  },
});
