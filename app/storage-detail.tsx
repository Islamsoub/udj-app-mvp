import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { SettingsHeader } from '@/components/settings/SettingsHeader';

// ─── Mock data ────────────────────────────────────────────────────────────────

const TOTAL_USED_MB = 12.4;
const TOTAL_LIMIT_MB = 50;
const FILL_FLEX = (TOTAL_USED_MB / TOTAL_LIMIT_MB) * 100;
const EMPTY_FLEX = 100 - FILL_FLEX;

type ModuleKey = 'schedule' | 'grades' | 'news' | 'profile';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface ModuleData {
  key: ModuleKey;
  icon: IoniconName;
  iconBg: string;
  iconColor: string;
  mb: number;
}

const MODULES: ModuleData[] = [
  {
    key: 'schedule',
    icon: 'calendar-outline',
    iconBg: `${colors.info}20`,
    iconColor: colors.info,
    mb: 3.2,
  },
  {
    key: 'grades',
    icon: 'document-text-outline',
    iconBg: `${colors.jade400}20`,
    iconColor: colors.jade400,
    mb: 4.1,
  },
  {
    key: 'news',
    icon: 'newspaper-outline',
    iconBg: `${colors.exam}20`,
    iconColor: colors.exam,
    mb: 3.8,
  },
  {
    key: 'profile',
    icon: 'person-outline',
    iconBg: colors.scheduleBorder,
    iconColor: colors.textSecondary,
    mb: 1.3,
  },
];

// ─── Storage row ──────────────────────────────────────────────────────────────

interface StorageRowProps {
  icon: IoniconName;
  iconBg: string;
  iconColor: string;
  name: string;
  size: string;
  clearLabel: string;
  onClear: () => void;
}

function StorageRow({
  icon,
  iconBg,
  iconColor,
  name,
  size,
  clearLabel,
  onClear,
}: StorageRowProps) {
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={rowStyles.center}>
        <Text style={rowStyles.name}>{name}</Text>
        <Text style={rowStyles.size}>{size}</Text>
      </View>
      <Pressable style={rowStyles.clearBtn} onPress={onClear} hitSlop={4}>
        <Text style={rowStyles.clearBtnText}>{clearLabel}</Text>
      </Pressable>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    height: 54,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sp16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    marginStart: spacing.sp12,
  },
  name: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  size: {
    fontSize: 12,
    fontFamily: fonts.mono,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: spacing.sp2,
  },
  clearBtn: {
    paddingHorizontal: spacing.sp12,
    height: 30,
    borderRadius: radius.rFull,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.danger,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function StorageDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
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
        {/* ── Total usage card ── */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{t('settings.storage.total_label')}</Text>
          <Text style={styles.totalValue}>{TOTAL_USED_MB} MB</Text>
          <Text style={styles.totalLimit}>
            {t('settings.storage.total_limit', { limit: `${TOTAL_LIMIT_MB} MB` })}
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { flex: FILL_FLEX }]} />
            <View style={{ flex: EMPTY_FLEX }} />
          </View>
        </View>

        {/* ── Per-module section ── */}
        <Text style={styles.sectionHeader}>{t('settings.storage.per_module')}</Text>

        {MODULES.map((m) => (
          <StorageRow
            key={m.key}
            icon={m.icon}
            iconBg={m.iconBg}
            iconColor={m.iconColor}
            name={t(`settings.storage.module_${m.key}`)}
            size={`${m.mb} MB`}
            clearLabel={t('settings.storage.clear_module')}
            onClear={() => {}}
          />
        ))}

        {/* ── Clear all ── */}
        <Pressable style={styles.clearAllBtn} onPress={() => {}}>
          <Text style={styles.clearAllText}>{t('settings.storage.clear_all')}</Text>
        </Pressable>

        <View style={{ height: spacing.sp32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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

  // Total card
  totalCard: {
    marginHorizontal: spacing.sp16,
    marginTop: spacing.sp16,
    borderRadius: radius.rLg,
    backgroundColor: colors.surface,
    padding: spacing.sp16,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 32,
    fontWeight: '700',
    fontFamily: fonts.mono,
    color: colors.textPrimary,
    marginTop: 4,
  },
  totalLimit: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginTop: spacing.sp12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  progressFill: {
    backgroundColor: colors.jade400,
  },

  // Section header
  sectionHeader: {
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
    backgroundColor: colors.background,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  // Clear all button
  clearAllBtn: {
    marginHorizontal: spacing.sp16,
    marginTop: spacing.sp24,
    height: 48,
    borderRadius: radius.rLg,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
