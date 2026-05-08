import React, { useState } from 'react';
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
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSkeleton } from '@/components/settings/SettingsSkeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

type SettingsState = 'skeleton' | 'loaded' | 'offline' | 'error' | 'session';

// ─── DEV switcher config ──────────────────────────────────────────────────────

const ALL_STATES: SettingsState[] = ['loaded', 'skeleton', 'offline', 'error', 'session'];

const STATE_LABELS: Record<SettingsState, string> = {
  loaded: 'loaded',
  skeleton: 'skeleton',
  offline: 'offline',
  error: 'error',
  session: 'session',
};

// ─── Loaded body ──────────────────────────────────────────────────────────────

function SettingsBody({ isOffline }: { isOffline: boolean }) {
  const { t } = useTranslation();

  const [notifGrades, setNotifGrades] = useState(true);
  const [notifCours, setNotifCours] = useState(true);
  const [notifPresence, setNotifPresence] = useState(true);

  return (
    <View>
      {/* PRÉFÉRENCES */}
      <Text style={styles.sectionHeader}>{t('settings.section.preferences')}</Text>
      <SettingsRow
        label={t('settings.row.language')}
        value={t('settings.row.language_value')}
        onPress={() => {}}
      />
      <SettingsRow
        label={t('settings.row.theme')}
        value={t('settings.row.theme_value')}
        onPress={() => {}}
      />
      <SettingsRow
        label={t('settings.row.text_size')}
        value={t('settings.row.text_size_value')}
        onPress={() => {}}
      />

      {/* NOTIFICATIONS */}
      <Text style={styles.sectionHeader}>{t('settings.section.notifications')}</Text>
      <SettingsRow
        label={t('settings.row.notif_grades')}
        isToggle
        toggleValue={notifGrades}
        onToggle={isOffline ? undefined : setNotifGrades}
        disabled={isOffline}
      />
      <SettingsRow
        label={t('settings.row.notif_courses')}
        isToggle
        toggleValue={notifCours}
        onToggle={isOffline ? undefined : setNotifCours}
        disabled={isOffline}
      />
      <SettingsRow
        label={t('settings.row.notif_attendance')}
        isToggle
        toggleValue={notifPresence}
        onToggle={isOffline ? undefined : setNotifPresence}
        disabled={isOffline}
      />
      <SettingsRow
        label={t('settings.row.quiet_hours')}
        value={t('settings.row.quiet_hours_value')}
        onPress={() => {}}
      />

      {/* DONNÉES & CACHE */}
      <Text style={styles.sectionHeader}>{t('settings.section.data')}</Text>
      <SettingsRow
        label={t('settings.row.offline_storage')}
        value={t('settings.row.offline_storage_value')}
        onPress={() => {}}
      />
      <SettingsRow
        label={t('settings.row.clear_cache')}
        isDestructive
        onPress={() => {}}
      />
      <SettingsRow
        label={t('settings.row.last_sync')}
        value={t('settings.row.last_sync_value')}
        showChevron={false}
      />

      {/* COMPTE */}
      <Text style={styles.sectionHeader}>{t('settings.section.account')}</Text>
      <SettingsRow
        label={t('settings.row.account_info')}
        value={t('settings.row.account_info_value')}
        onPress={() => {}}
      />
      <SettingsRow
        label={t('settings.row.logout')}
        isDestructive
        onPress={() => {}}
      />

      <View style={{ height: 120 }} />
    </View>
  );
}

// ─── Error body ───────────────────────────────────────────────────────────────

function ErrorBody({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <View style={styles.centeredBody}>
      <Text style={styles.errorTitle}>{t('settings.error.title')}</Text>
      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [settingsState, setSettingsState] = useState<SettingsState>('loaded');

  const showBody =
    settingsState === 'loaded' ||
    settingsState === 'offline' ||
    settingsState === 'session';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <SettingsHeader
        topInset={insets.top}
        onBack={() => router.back()}
      />

      {settingsState === 'offline' && <OfflineBanner />}

      {settingsState === 'skeleton' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SettingsSkeleton />
        </ScrollView>
      )}

      {showBody && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SettingsBody isOffline={settingsState === 'offline'} />
        </ScrollView>
      )}

      {settingsState === 'error' && (
        <ErrorBody onRetry={() => setSettingsState('loaded')} />
      )}

      <SessionExpiredModal
        visible={settingsState === 'session'}
        onContinueOffline={() => setSettingsState('offline')}
      />

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={settingsState}
        onChange={setSettingsState}
      />
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

  // ── Error state
  centeredBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp24,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  retryBtn: {
    width: 168,
    height: 56,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
