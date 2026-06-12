import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { elevation, fonts, fz, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { getCacheStats, clearAllCache, clearTableCache, type CacheStat } from '@/services/db';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface CategoryMeta {
  key: string;
  icon: IoniconName;
}

const CATEGORIES: CategoryMeta[] = [
  { key: 'profile', icon: 'person-outline' },
  { key: 'schedule', icon: 'calendar-outline' },
  { key: 'grades', icon: 'document-text-outline' },
  { key: 'news', icon: 'newspaper-outline' },
  { key: 'notifications', icon: 'notifications-outline' },
  { key: 'attendance', icon: 'checkmark-circle-outline' },
  { key: 'bookmarks', icon: 'bookmark-outline' },
];

// ─── Category row ────────────────────────────────────────────────────────────

interface CategoryRowProps {
  icon: IoniconName;
  name: string;
  rows: number;
  size: string;
  rowsLabel: string;
  onClear: () => void;
  isLast?: boolean;
}

function CategoryRow({ icon, name, rows, size, rowsLabel, onClear, isLast = false }: CategoryRowProps) {
  const { colors } = useColors();
  const rowStyles = useMemo(() => makeRowStyles(colors), [colors]);

  return (
    <Pressable style={[rowStyles.row, isLast && rowStyles.rowLast]} onPress={onClear}>
      <View style={rowStyles.iconCircle}>
        <Ionicons name={icon} size={18} color={colors.jade400} />
      </View>
      <View style={rowStyles.center}>
        <Text style={rowStyles.name}>{name}</Text>
        <Text style={rowStyles.meta}>
          {rowsLabel} · {size}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

const makeRowStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      minHeight: 56,
      borderBottomWidth: 1,
      borderBottomColor: colors.hair,
      paddingHorizontal: spacing.sp16,
      paddingVertical: spacing.sp12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowLast: {
      borderBottomWidth: 0,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: radius.rSm,
      backgroundColor: colors.jade50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: {
      flex: 1,
      marginStart: spacing.sp12,
    },
    name: {
      fontSize: fz(14),
      fontWeight: '500',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
    meta: {
      fontSize: fz(12),
      fontFamily: fonts.mono,
      fontWeight: '400',
      color: colors.textSecondary,
      marginTop: spacing.sp2,
    },
  });

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function StorageDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [stats, setStats] = useState<CacheStat[]>([]);

  const loadStats = useCallback(async () => {
    const data = await getCacheStats();
    setStats(data);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totalBytes = stats.reduce((sum, s) => {
    if (s.key === 'bookmarks') return sum;
    return sum + s.estimatedBytes;
  }, 0);

  const handleClearCategory = (stat: CacheStat) => {
    const name = t(`settings.storage.${stat.key}`);
    Alert.alert(
      t('settings.storage.clear_category', { name }),
      t('settings.storage.clear_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.storage.clear_all'),
          style: 'destructive',
          onPress: async () => {
            await clearTableCache(stat.table);
            await loadStats();
            Alert.alert(t('settings.storage.cleared'));
          },
        },
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      t('settings.storage.clear_confirm'),
      t('settings.storage.clear_confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.storage.clear_all'),
          style: 'destructive',
          onPress: async () => {
            await clearAllCache();
            await loadStats();
            Alert.alert(t('settings.storage.cleared'));
          },
        },
      ],
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SettingsHeader
        topInset={insets.top}
        onBack={() => router.back()}
        title={t('settings.storage.title')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Total usage ── */}
        <View style={[styles.totalCard, elevation.card]}>
          <Text style={styles.totalLabel}>{t('settings.storage.total')}</Text>
          <Text style={styles.totalValue}>{formatBytes(totalBytes)}</Text>
        </View>

        {/* ── Categories ── */}
        <Text style={styles.sectionHeader}>
          {t('settings.section.data')}
        </Text>
        <View style={[styles.sectionCard, elevation.card]}>
          {CATEGORIES.map((cat, i) => {
            const stat = stats.find((s) => s.key === cat.key);
            return (
              <CategoryRow
                key={cat.key}
                icon={cat.icon}
                name={t(`settings.storage.${cat.key}`)}
                rows={stat?.rows ?? 0}
                size={formatBytes(stat?.estimatedBytes ?? 0)}
                rowsLabel={t('settings.storage.rows', { count: stat?.rows ?? 0 })}
                onClear={() => stat && handleClearCategory(stat)}
                isLast={i === CATEGORIES.length - 1}
              />
            );
          })}
        </View>

        {/* ── Clear all button ── */}
        <Pressable
          style={({ pressed }) => [
            styles.clearAllBtn,
            pressed && { opacity: 0.85 },
          ]}
          onPress={handleClearAll}
        >
          <Text style={styles.clearAllText}>{t('settings.storage.clear_all')}</Text>
        </Pressable>

        <View style={{ height: spacing.sp64 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },

    totalCard: {
      marginHorizontal: spacing.sp16,
      marginTop: spacing.sp16,
      borderRadius: radius.rXl,
      backgroundColor: colors.surface,
      padding: spacing.sp16,
    },
    totalLabel: {
      fontSize: fz(13),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    totalValue: {
      fontSize: fz(32),
      fontWeight: '700',
      fontFamily: fonts.mono,
      color: colors.textPrimary,
      marginTop: spacing.sp4,
    },

    sectionHeader: {
      marginTop: 22,
      marginBottom: spacing.sp8,
      marginHorizontal: spacing.sp20,
      fontSize: fz(13),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.rXl,
      marginHorizontal: spacing.sp16,
      marginBottom: spacing.sp8,
      overflow: 'hidden',
    },

    clearAllBtn: {
      marginHorizontal: spacing.sp16,
      marginTop: spacing.sp24,
      height: 50,
      borderRadius: radius.rBtn,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearAllText: {
      fontSize: fz(14),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.surface,
    },
  });
