import React, { useMemo } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, spacing, sizing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export type PDFData = {
  id: string;
  name: string;
  url: string;
};

type Props = {
  item: PDFData;
  onDownload?: () => void;
  isLast?: boolean;
};

export function PDFRow({ item, onDownload, isLast = false }: Props) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      android_ripple={{ color: colors.jade50 }}
      style={({ pressed }) => [
        styles.row,
        isLast && styles.rowLast,
        pressed && { backgroundColor: withAlpha(colors.textPrimary, 0.06) },
      ]}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>PDF</Text>
      </View>

      <Text style={styles.name} numberOfLines={2}>{item.name}</Text>

      <Pressable
        onPress={onDownload}
        hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }}
        style={styles.downloadBtn}
      >
        <Ionicons name="download-outline" size={22} color={colors.jade400} />
      </Pressable>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: spacing.sp16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: fz(11),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.danger,
  },
  name: {
    flex: 1,
    marginStart: spacing.sp12,
    fontSize: fz(15),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  downloadBtn: {
    width: sizing.touchTarget,
    height: sizing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
