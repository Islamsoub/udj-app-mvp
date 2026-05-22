import React, { useMemo } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing, radius, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { getCategoryColor } from '@/constants/colorMap';

export type NotificationType = 'grades' | 'schedule' | 'attendance' | 'news' | 'general';

export type NotificationItemData = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  isUnread: boolean;
  referenceId?: string;
};

type Props = {
  item: NotificationItemData;
  onPress?: () => void;
};

// Light lavender — not in theme palette; notification-specific inline constant
const NOTIF_GENERAL_BG = '#E0E7FF';

const NOTIF_TYPE_LABEL: Record<NotificationType, string> = {
  grades:     'Notes',
  schedule:   'Agenda',
  attendance: 'Présence',
  news:       'Actualités',
  general:    'Général',
};

const NOTIF_TYPE_CATEGORY_KEY: Record<NotificationType, string> = {
  grades:     'GRADES',
  schedule:   'SCHEDULE',
  attendance: 'ATTENDANCE',
  news:       'NEWS',
  general:    'GENERAL',
};

type IconConfig = {
  bg: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
};

function makeIconConfig(colors: Palette): Record<NotificationType, IconConfig> {
  return {
    grades:     { bg: colors.jade400,      icon: 'document-text', iconColor: colors.surface },
    schedule:   { bg: colors.info,         icon: 'calendar',      iconColor: colors.surface },
    attendance: { bg: colors.danger,       icon: 'warning',       iconColor: colors.surface },
    news:       { bg: colors.info,         icon: 'newspaper',     iconColor: colors.surface },
    general:    { bg: NOTIF_GENERAL_BG,    icon: 'notifications', iconColor: colors.jade400 },
  };
}

export function NotificationItem({ item, onPress }: Props) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const iconConfig = useMemo(() => makeIconConfig(colors), [colors]);
  const { bg, icon, iconColor } = iconConfig[item.type];
  const catColor = getCategoryColor(NOTIF_TYPE_CATEGORY_KEY[item.type]);
  const typeLabel = NOTIF_TYPE_LABEL[item.type];

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: colors.jade50 }}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.textPrimary + '0F' }]}
    >
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>

      <View style={styles.textCol}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, item.isUnread && styles.titleUnread]} numberOfLines={2}>{item.title}</Text>
          {item.isUnread && <View style={styles.dot} />}
        </View>
        <Text style={styles.body} numberOfLines={2}>{item.body}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
          <View style={[styles.typePill, { backgroundColor: catColor.bg }]}>
            <Text style={[styles.typePillText, { color: catColor.text }]}>{typeLabel}</Text>
          </View>
        </View>
      </View>

    </Pressable>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp4,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  titleUnread: {
    fontWeight: '700',
  },
  body: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: fonts.mono,
    color: colors.textTertiary,
  },
  typePill: {
    borderRadius: radius.rFull,
    paddingHorizontal: spacing.sp8,
    paddingVertical: 2,
  },
  typePillText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: fonts.sans,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.jade400,
    flexShrink: 0,
  },
});
