import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '@/constants/theme';

export type PDFData = {
  id: string;
  name: string;
  url: string;
};

type Props = {
  item: PDFData;
  onDownload?: () => void;
};

// Not in theme palette — PDF-specific inline constant
const PDF_BADGE_BG = '#FEE2E2';

export function PDFRow({ item, onDownload }: Props) {
  return (
    <Pressable
      android_ripple={{ color: colors.jade50 }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.textPrimary + '0F' }]}
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: spacing.sp16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: PDF_BADGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.danger,
  },
  name: {
    flex: 1,
    marginStart: spacing.sp12,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  downloadBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
