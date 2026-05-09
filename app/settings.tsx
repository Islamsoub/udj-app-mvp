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
import { LanguePicker } from '@/components/settings/LanguePicker';
import { ThemePicker } from '@/components/settings/ThemePicker';
import { TextSizePicker } from '@/components/settings/TextSizePicker';
import { QuietHoursPicker } from '@/components/settings/QuietHoursPicker';
import { ClearCacheConfirm } from '@/components/settings/ClearCacheConfirm';
import { LogoutConfirm } from '@/components/settings/LogoutConfirm';

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
  const router = useRouter();

  const [notifGrades, setNotifGrades] = useState(true);
  const [notifCours, setNotifCours] = useState(true);
  const [notifPresence, setNotifPresence] = useState(true);

  const [langueVisible, setLangueVisible] = useState(false);
  const [themeVisible, setThemeVisible] = useState(false);
  const [textSizeVisible, setTextSizeVisible] = useState(false);
  const [quietHoursVisible, setQuietHoursVisible] = useState(false);
  const [clearCacheVisible, setClearCacheVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const [langue, setLangue] = useState<'fr' | 'ar'>('fr');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [textSize, setTextSize] = useState<'small' | 'normal' | 'large'>('normal');
  const [quietStart, setQuietStart] = useState(22);
  const [quietEnd, setQuietEnd] = useState(7);

  return (
    <View>
      {/* PRÉFÉRENCES */}
      <Text style={styles.sectionHeader}>{t('settings.section.preferences')}</Text>
      <SettingsRow
        label={t('settings.row.language')}
        value={t('settings.row.language_value')}
        onPress={() => setLangueVisible(true)}
      />
      <SettingsRow
        label={t('settings.row.theme')}
        value={t('settings.row.theme_value')}
        onPress={() => setThemeVisible(true)}
      />
      <SettingsRow
        label={t('settings.row.text_size')}
        value={t('settings.row.text_size_value')}
        onPress={() => setTextSizeVisible(true)}
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
        value={`${String(quietStart).padStart(2, '0')}h – ${String(quietEnd).padStart(2, '0')}h`}
        onPress={() => setQuietHoursVisible(true)}
      />

      {/* DONNÉES & CACHE */}
      <Text style={styles.sectionHeader}>{t('settings.section.data')}</Text>
      <SettingsRow
        label={t('settings.row.offline_storage')}
        value={t('settings.row.offline_storage_value')}
        onPress={() => router.push('/storage-detail')}
      />
      <SettingsRow
        label={t('settings.row.clear_cache')}
        isDestructive
        onPress={() => setClearCacheVisible(true)}
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
        onPress={() => router.push('/account-info')}
      />
      <SettingsRow
        label={t('settings.row.logout')}
        isDestructive
        onPress={() => setLogoutVisible(true)}
      />

      <View style={{ height: 120 }} />

      <LanguePicker
        visible={langueVisible}
        onClose={() => setLangueVisible(false)}
        currentValue={langue}
        onSelect={(v) => { setLangue(v); setLangueVisible(false); }}
      />
      <ThemePicker
        visible={themeVisible}
        onClose={() => setThemeVisible(false)}
        currentValue={theme}
        onSelect={(v) => { setTheme(v); setThemeVisible(false); }}
      />
      <TextSizePicker
        visible={textSizeVisible}
        onClose={() => setTextSizeVisible(false)}
        currentValue={textSize}
        onSelect={(v) => { setTextSize(v); setTextSizeVisible(false); }}
      />
      <QuietHoursPicker
        visible={quietHoursVisible}
        onClose={() => setQuietHoursVisible(false)}
        startHour={quietStart}
        endHour={quietEnd}
        onSave={(start, end) => { setQuietStart(start); setQuietEnd(end); }}
      />
      <ClearCacheConfirm
        visible={clearCacheVisible}
        onClose={() => setClearCacheVisible(false)}
        onConfirm={() => {}}
      />
      <LogoutConfirm
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        onConfirm={() => {}}
      />
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
