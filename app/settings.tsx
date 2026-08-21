import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  Linking,
} from 'react-native';
import { PressBox } from '@/components/PressBox';
import { reloadApp } from '@/utils/reload';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { elevation, fonts, fz, spacing, radius, type Palette } from '@/constants/theme';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { SettingsRow } from '@/components/settings/SettingsRow';
import { SettingsSkeleton } from '@/components/settings/SettingsSkeleton';
import { LanguePicker } from '@/components/settings/LanguePicker';
import { ThemePicker } from '@/components/settings/ThemePicker';
import { QuietHoursPicker } from '@/components/settings/QuietHoursPicker';
import { ClearCacheConfirm } from '@/components/settings/ClearCacheConfirm';
import { LogoutConfirm } from '@/components/settings/LogoutConfirm';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useColors } from '@/hooks/useColors';
import { patchPreferences } from '@/services/api';
import { logout } from '@/services/auth';
import { getCacheStats, getLastSyncTime } from '@/services/db';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

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
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const student = useAuthStore((s) => s.student);
  const prefs = student?.preferences;
  const updatePreferences = useAuthStore((s) => s.updatePreferences);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const currentLang: 'fr' | 'ar' = i18n.language === 'ar' ? 'ar' : 'fr';

  const themeLabel = {
    light: t('settings.picker.theme_light'),
    dark: t('settings.picker.theme_dark'),
    system: t('settings.picker.theme_system'),
  }[themeMode];

  const languageLabel =
    currentLang === 'ar' ? t('settings.picker.lang_ar') : t('settings.picker.lang_fr');

  const [notifGrades, setNotifGrades] = useState(prefs?.notifGrades ?? true);
  const [notifCours, setNotifCours] = useState(prefs?.notifCourses ?? true);
  const [notifPresence, setNotifPresence] = useState(prefs?.notifAttendance ?? true);

  const [langueVisible, setLangueVisible] = useState(false);
  const [themeVisible, setThemeVisible] = useState(false);
  const [quietHoursVisible, setQuietHoursVisible] = useState(false);
  const [clearCacheVisible, setClearCacheVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const [quietStart, setQuietStart] = useState(() =>
    parseInt(prefs?.quietHoursStart?.split(':')[0] || '22', 10),
  );
  const [quietEnd, setQuietEnd] = useState(() =>
    parseInt(prefs?.quietHoursEnd?.split(':')[0] || '7', 10),
  );

  const [cacheSize, setCacheSize] = useState('…');
  const [lastSync, setLastSync] = useState('—');

  useEffect(() => {
    getCacheStats()
      .then((stats) => {
        // Exclude bookmarks — they're a subset of news_cache, already counted.
        const total = stats.reduce(
          (sum, s) => (s.key === 'bookmarks' ? sum : sum + s.estimatedBytes),
          0,
        );
        setCacheSize(formatBytes(total));
      })
      .catch(() => {}); // Non-critical — the row keeps its placeholder.
  }, []);

  useEffect(() => {
    getLastSyncTime()
      .then((ts) => {
        if (!ts) return;
        const d = new Date(ts);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSync(
          isToday ? `${t('common.today')} ${time}` : `${d.toLocaleDateString()} ${time}`,
        );
      })
      .catch(() => {}); // Non-critical — the row keeps its "—" placeholder.
  }, [t]);

  const handleNotifToggle =
    (key: 'notifGrades' | 'notifCourses' | 'notifAttendance') => (value: boolean) => {
      patchPreferences({ [key]: value })
        .then(() => updatePreferences({ [key]: value }))
        .catch(() => {});
    };

  const handleLanguageChange = async (lang: 'fr' | 'ar') => {
    setLangueVisible(false);
    if (lang === currentLang) return;
    i18n.changeLanguage(lang);
    useSettingsStore.getState().setLanguage(lang);
    try {
      await reloadApp();
    } catch {
      Alert.alert(
        t('settings.restart_title'),
        t('settings.restart_message'),
        [{ text: t('common.ok') }],
      );
    }
  };

  const handleQuietHoursSave = (start: number, end: number) => {
    setQuietStart(start);
    setQuietEnd(end);
    const startStr = `${String(start).padStart(2, '0')}:00`;
    const endStr = `${String(end).padStart(2, '0')}:00`;
    patchPreferences({ quietHoursStart: startStr, quietHoursEnd: endStr })
      .then(() => updatePreferences({ quietHoursStart: startStr, quietHoursEnd: endStr }))
      .catch(() => {});
  };

  const handleLogout = () => {
    logout()
      .catch(() => {})
      .finally(() => router.replace('/(auth)/login'));
  };

  const studentName = student
    ? `${student.firstName} ${student.lastName}`
    : t('settings.row.account_info_value');

  return (
    <View>
      {/* PRÉFÉRENCES */}
      <Text style={styles.sectionHeader}>{t('settings.section.preferences')}</Text>
      <View style={[styles.sectionCard, elevation.card]}>
        <SettingsRow
          label={t('settings.row.language')}
          value={languageLabel}
          onPress={() => setLangueVisible(true)}
        />
        <SettingsRow
          label={t('settings.row.theme')}
          value={themeLabel}
          onPress={() => setThemeVisible(true)}
          isLast
        />
      </View>

      {/* NOTIFICATIONS */}
      <Text style={styles.sectionHeader}>{t('settings.section.notifications')}</Text>
      <View style={[styles.sectionCard, elevation.card]}>
        <SettingsRow
          label={t('settings.row.notif_grades')}
          isToggle
          toggleValue={notifGrades}
          onToggle={isOffline ? undefined : (v) => {
            setNotifGrades(v);
            handleNotifToggle('notifGrades')(v);
          }}
          disabled={isOffline}
        />
        <SettingsRow
          label={t('settings.row.notif_courses')}
          isToggle
          toggleValue={notifCours}
          onToggle={isOffline ? undefined : (v) => {
            setNotifCours(v);
            handleNotifToggle('notifCourses')(v);
          }}
          disabled={isOffline}
        />
        <SettingsRow
          label={t('settings.row.notif_attendance')}
          isToggle
          toggleValue={notifPresence}
          onToggle={isOffline ? undefined : (v) => {
            setNotifPresence(v);
            handleNotifToggle('notifAttendance')(v);
          }}
          disabled={isOffline}
        />
        <SettingsRow
          label={t('settings.row.quiet_hours')}
          value={`${String(quietStart).padStart(2, '0')}h – ${String(quietEnd).padStart(2, '0')}h`}
          onPress={() => setQuietHoursVisible(true)}
          isLast
        />
      </View>

      {/* DONNÉES & CACHE */}
      <Text style={styles.sectionHeader}>{t('settings.section.data')}</Text>
      <View style={[styles.sectionCard, elevation.card]}>
        <SettingsRow
          label={t('settings.row.offline_storage')}
          value={cacheSize}
          onPress={() => router.push('/storage-detail')}
        />
        <SettingsRow
          label={t('settings.row.clear_cache')}
          isDestructive
          onPress={() => setClearCacheVisible(true)}
        />
        <SettingsRow
          label={t('settings.row.last_sync')}
          value={lastSync}
          showChevron={false}
          isLast
        />
      </View>

      {/* COMPTE */}
      <Text style={styles.sectionHeader}>{t('settings.section.account')}</Text>
      <View style={[styles.sectionCard, elevation.card]}>
        <SettingsRow
          label={t('settings.row.account_info')}
          value={studentName}
          onPress={() => router.push('/account-info')}
        />
        <SettingsRow
          label={t('infoCenter.title')}
          onPress={() => router.push('/info-center')}
        />
        <SettingsRow
          label={t('settings.row.privacy')}
          onPress={() => void Linking.openURL('https://udj-api.onrender.com/public/privacy-policy.html')}
        />
        <SettingsRow
          label={t('settings.row.logout')}
          isDestructive
          onPress={() => setLogoutVisible(true)}
          isLast
        />
      </View>

      <View style={{ height: 120 }} />

      <LanguePicker
        visible={langueVisible}
        onClose={() => setLangueVisible(false)}
        currentValue={currentLang}
        onSelect={handleLanguageChange}
      />
      <ThemePicker
        visible={themeVisible}
        onClose={() => setThemeVisible(false)}
        currentValue={themeMode}
        onSelect={(v) => { setThemeMode(v); setThemeVisible(false); }}
      />
      <QuietHoursPicker
        visible={quietHoursVisible}
        onClose={() => setQuietHoursVisible(false)}
        startHour={quietStart}
        endHour={quietEnd}
        onSave={handleQuietHoursSave}
      />
      <ClearCacheConfirm
        visible={clearCacheVisible}
        onClose={() => setClearCacheVisible(false)}
        onConfirm={() => {}}
      />
      <LogoutConfirm
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        onConfirm={handleLogout}
      />
    </View>
  );
}

// ─── Error body ───────────────────────────────────────────────────────────────

function ErrorBody({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.centeredBody}>
      <Text style={styles.errorTitle}>{t('settings.error.title')}</Text>
      <PressBox tier="button" style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
      </PressBox>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [settingsState, setSettingsState] = useState<SettingsState>('loaded');

  const showBody =
    settingsState === 'loaded' ||
    settingsState === 'offline' ||
    settingsState === 'session';

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SettingsHeader
        big
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
          <View style={{ height: insets.bottom + 16 }} />
        </ScrollView>
      )}

      {showBody && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SettingsBody isOffline={settingsState === 'offline'} />
          <View style={{ height: insets.bottom + 16 }} />
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

const makeStyles = (colors: Palette) => StyleSheet.create({
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

  // ── Error state
  centeredBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp24,
  },
  errorTitle: {
    fontSize: fz(14),
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
    fontSize: fz(14),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
