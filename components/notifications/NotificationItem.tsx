import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, radius, type Palette } from '@/constants/theme';
import { PressBox } from '@/components/PressBox';
import { useColors } from '@/hooks/useColors';
import { useTranslation } from 'react-i18next';
import { getCategoryColors, type NotifCategory } from '@/constants/colorMap';

export type NotificationType = 'grades' | 'schedule' | 'attendance' | 'news' | 'general';

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
  isLast?: boolean;
};

const TYPE_TO_CATEGORY: Record<NotificationType, NotifCategory> = {
  grades:     'notes',
  schedule:   'agenda',
  attendance: 'presence',
  news:       'actualites',
  general:    'general',
};

const TYPE_LABEL_KEY: Record<NotificationType, string> = {
  grades:     'notifications.type_grades',
  schedule:   'notifications.type_schedule',
  attendance: 'notifications.type_attendance',
  news:       'notifications.type_news',
  general:    'notifications.type_general',
};

const TYPE_ICON: Record<NotificationType, React.ComponentProps<typeof Ionicons>['name']> = {
  grades:     'document-text-outline',
  schedule:   'calendar-outline',
  attendance: 'warning-outline',
  news:       'newspaper-outline',
  general:    'notifications-outline',
};

export function NotificationItem({ item, onPress, isLast }: Props) {
  const { colors } = useColors();
  const { t } = useTranslation();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const catColors = getCategoryColors(TYPE_TO_CATEGORY[item.type], colors);

  return (
    <PressBox
      tier="tint"
      onPress={onPress}
      style={[
        styles.row,
        item.isUnread && styles.rowUnread,
        isLast && styles.rowLast,
      ]}
    >
      <View style={[styles.chip, { backgroundColor: catColors.bg }]}>
        <Ionicons name={TYPE_ICON[item.type]} size={19} color={catColors.fg} />
      </View>

      <View style={styles.textCol}>
        <Text style={[styles.title, item.isUnread && styles.titleUnread]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.body} numberOfLines={2}>
          {item.body}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.timestamp}>{item.timestamp}</Text>
          <View style={[styles.typePill, { backgroundColor: catColors.bg }]}>
            <Text style={[styles.typePillText, { color: catColors.fg }]}>
              {t(TYPE_LABEL_KEY[item.type])}
            </Text>
          </View>
        </View>
      </View>

      {item.isUnread && <View style={styles.dot} />}
    </PressBox>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
  },
  rowUnread: {
    backgroundColor: colors.jadeFaint,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  chip: {
    width: 38,
    height: 38,
    borderRadius: radius.rMd,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textCol: {
    flex: 1,
    paddingEnd: 24,
  },
  title: {
    fontSize: fz(15),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    lineHeight: fz(19.5),
  },
  titleUnread: {
    fontWeight: '700',
  },
  body: {
    fontSize: fz(13.5),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    lineHeight: fz(19),
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 9,
  },
  timestamp: {
    fontSize: fz(12),
    fontWeight: '400',
    fontFamily: fonts.mono,
    color: colors.textTertiary,
  },
  typePill: {
    borderRadius: radius.rFull,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  typePillText: {
    fontSize: fz(12),
    fontWeight: '600',
    fontFamily: fonts.sans,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: radius.rFull,
    backgroundColor: colors.jade400,
    top: 16,
    end: 14,
  },
});
