import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '@/constants/theme';

export type NotificationType = 'grades' | 'schedule' | 'attendance' | 'general';

export type NotificationItemData = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  isUnread: boolean;
};

type Props = {
  item: NotificationItemData;
  onPress?: () => void;
};

// Light lavender — not in theme palette; notification-specific inline constant
const NOTIF_GENERAL_BG = '#E0E7FF';

type IconConfig = {
  bg: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
};

const ICON_CONFIG: Record<NotificationType, IconConfig> = {
  grades:     { bg: colors.jade400,      icon: 'document-text', iconColor: colors.surface },
  schedule:   { bg: colors.info,         icon: 'calendar',      iconColor: colors.surface },
  attendance: { bg: colors.danger,       icon: 'warning',       iconColor: colors.surface },
  general:    { bg: NOTIF_GENERAL_BG,    icon: 'notifications', iconColor: colors.jade400 },
};

export function NotificationItem({ item, onPress }: Props) {
  const { bg, icon, iconColor } = ICON_CONFIG[item.type];

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.jade50 }}
      style={styles.row}
    >
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>

      <View style={styles.textCol}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>

      {item.isUnread && <View style={styles.dot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    marginStart: spacing.sp12,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  body: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: fonts.mono,
    color: colors.textTertiary,
    marginTop: 2,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.jade400,
    marginTop: 6,
    marginStart: spacing.sp8,
  },
});
