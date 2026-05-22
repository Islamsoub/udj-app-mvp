import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '@/constants/theme';
import { SkeletonBox } from '@/components/ui/SkeletonBox';

export type NewsHeaderState = 'skeleton' | 'loaded' | 'offline' | 'empty' | 'error' | 'session';

interface NewsHeaderProps {
  state: NewsHeaderState;
  topInset: number;
  onMarkAllRead?: () => void;
}

// Content height below safe area (93 spec total − 24 Figma Android status bar)
const CONTENT_H = 69;

export function NewsHeader({ state, topInset, onMarkAllRead }: NewsHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {state === 'skeleton' ? (
        <SkeletonBox width={120} height={15} borderRadius={8} />
      ) : (
        <Text style={styles.title}>{t('news.title')}</Text>
      )}

      <View style={styles.actions}>
        {state === 'loaded' && onMarkAllRead != null && (
          <Pressable
            onPress={onMarkAllRead}
            hitSlop={8}
            style={({ pressed }) => pressed && { backgroundColor: colors.jade400 + '26', borderRadius: 6 }}
          >
            <Text style={styles.markAllReadText}>{t('notifications.markAllRead')}</Text>
          </Pressable>
        )}
        <View style={styles.searchCircle}>
          {state === 'skeleton' ? (
            <View style={styles.searchIconPlaceholder} />
          ) : (
            <Ionicons name="search-outline" size={20} color={colors.greyMedium} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CONTENT_H,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.newsHeaderBorder,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
    paddingBottom: 14,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp12,
    marginBottom: 6,
  },
  markAllReadText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.jade400,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  searchCircle: {
    width: 34,
    height: 34,
    borderRadius: 30,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconPlaceholder: {
    width: 16,
    height: 17,
    borderRadius: 4,
    backgroundColor: colors.skeletonBase,
  },
});
