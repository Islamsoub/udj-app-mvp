import React from 'react';
import { Pressable, View, Text, StyleSheet, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '@/constants/theme';

export type ContactType = 'phone' | 'location' | 'email';

export type ContactData = {
  id: string;
  type: ContactType;
  name: string;
  detail: string;
};

type Props = {
  item: ContactData;
  onPress?: () => void;
};

const ICON_NAME: Record<ContactType, React.ComponentProps<typeof Ionicons>['name']> = {
  phone: 'call-outline',
  location: 'location-outline',
  email: 'mail-outline',
};

export function ContactRow({ item, onPress }: Props) {
  const chevron = I18nManager.isRTL ? 'chevron-back' : 'chevron-forward';

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.jade50 }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.textPrimary + '0F' }]}
    >
      <Ionicons name={ICON_NAME[item.type]} size={22} color={colors.jade400} />

      <Text style={styles.name} numberOfLines={1}>{item.name}</Text>

      <View style={styles.right}>
        <Text style={styles.detail} numberOfLines={1}>{item.detail}</Text>
        <Ionicons name={chevron} size={16} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: spacing.sp16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  name: {
    flex: 1,
    marginStart: spacing.sp12,
    fontSize: 15,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp8,
  },
  detail: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.mono,
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
