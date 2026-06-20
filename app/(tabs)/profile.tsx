import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Image,
  Alert,
  Keyboard,
  Linking,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { elevation, fonts, radius, spacing, fz, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import {
  ProfileHeader,
  ProfileHeaderState,
} from '@/components/profile/ProfileHeader';
import { StudentCard } from '@/components/profile/StudentCard';
import { InfoRow } from '@/components/profile/InfoRow';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { Ionicons } from '@expo/vector-icons';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { useAuthStore } from '@/stores/authStore';
import { getStudentMe, getQrToken } from '@/services/api';
import type { StudentProfileCache } from '@/services/api';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { getStudentProfile, upsertProfile } from '@/services/db';
import { mapProfileToCache } from '@/services/cacheMappers';
import { logout as logoutService } from '@/services/auth';

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileState = ProfileHeaderState;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusKey(status: string): 'active' | 'suspended' | 'graduated' | null {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return 'active';
  if (s === 'SUSPENDED') return 'suspended';
  if (s === 'GRADUATED') return 'graduated';
  return null;
}

// ─── Quick-action tile ────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function QuickTile({
  icon,
  label,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useColors();
  const styles = useMemo(() => makeTileStyles(colors), [colors]);
  return (
    <PressBox
      tier="lift"
      style={styles.tile}
      onPress={onPress}
      hitSlop={4}
    >
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={18} color={colors.jade400} />
      </View>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {label}
      </Text>
    </PressBox>
  );
}

// ─── Loaded / Offline body ────────────────────────────────────────────────────

interface ProfileBodyProps {
  student: StudentProfileCache | null;
  qrToken: string | null;
  onPresencePress: () => void;
  onFacultyPress: () => void;
  onProgrammePress: () => void;
  onEmailPress: () => void;
  onLogoutPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}

function ProfileBody({
  student,
  qrToken,
  onPresencePress,
  onFacultyPress,
  onProgrammePress,
  onEmailPress,
  onLogoutPress,
  styles,
}: ProfileBodyProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useColors();
  const router = useRouter();
  const isAr = i18n.language === 'ar';

  const name = student?.name ?? '—';
  const id = student?.studentId ?? '—';
  const filiere = isAr && student?.programmeNameAr
    ? student.programmeNameAr
    : (student?.programmeName ?? '—');
  const facultyName = isAr && student?.facultyNameAr
    ? student.facultyNameAr
    : (student?.facultyName ?? '—');
  const presence = student?.attendancePercentage ?? 0;
  const email = student?.email ?? '—';

  const sKey = statusKey(student?.status ?? '');
  const statusValue = sKey ? t(`profile.status.${sKey}`) : (student?.status ?? '—');

  const programmeLevel = student?.programmeLevel ?? '';
  const programmeDuration = student?.programmeDurationSemesters ?? 0;
  const programmeCredits = student?.programmeTotalCredits ?? 0;
  const semesterUnit = t('profile.unit.semester');
  const creditsUnit = t('profile.unit.credits');
  const programmeInfoValue =
    programmeLevel || programmeDuration || programmeCredits
      ? `${programmeLevel} · ${programmeDuration} ${semesterUnit} · ${programmeCredits} ${creditsUnit}`
      : '—';

  const currentSem = student?.currentSemester ?? 0;
  const currentSemesterValue =
    currentSem > 0 ? t('profile.info.semester_value', { n: currentSem }) : '—';

  return (
    <View style={styles.body}>
      <StudentCard name={name} id={id} programme={filiere} qrToken={qrToken} />

      {/* Quick-action tiles */}
      <View style={styles.tilesRow}>
        <QuickTile
          icon="document-text-outline"
          label={t('profile.tile_documents')}
          onPress={() => router.push('/info-center')}
        />
        <QuickTile
          icon="checkmark-circle-outline"
          label={t('profile.tile_attendance')}
          onPress={onPresencePress}
        />
        <QuickTile
          icon="notifications-outline"
          label={t('profile.tile_alerts')}
          onPress={() => router.push('/notifications')}
        />
      </View>

      {/* Card 1: Informations académiques */}
      <Text style={styles.sectionHeader}>{t('profile.section_academic')}</Text>
      <View style={[styles.sectionCard, elevation.card]}>
        <InfoRow
          icon="school-outline"
          iconColor={colors.jade400}
          label={t('profile.row.filiere')}
          value={filiere}
          onPress={student?.programme ? onProgrammePress : undefined}
        />
        <InfoRow
          icon="business-outline"
          iconColor={colors.info}
          label={t('profile.info.faculty')}
          value={facultyName}
          onPress={student?.faculty ? onFacultyPress : undefined}
        />
        <InfoRow
          icon="checkmark-circle-outline"
          iconColor={colors.warning}
          label={t('profile.row.presence')}
          value={`${presence}%`}
          onPress={onPresencePress}
          isLast
        />
      </View>

      {/* Card 2: Contact & statut */}
      <Text style={styles.sectionHeader}>{t('profile.section_contact')}</Text>
      <View style={[styles.sectionCard, elevation.card]}>
        <InfoRow
          icon="mail-outline"
          iconColor={colors.textSecondary}
          label={t('profile.info.email')}
          value={email}
          onPress={student?.email ? onEmailPress : undefined}
        />
        <InfoRow
          icon="shield-checkmark-outline"
          iconColor={colors.jade400}
          label={t('profile.info.status')}
          value={statusValue}
          isLast
        />
      </View>

      {/* Card 3: Programme */}
      <Text style={styles.sectionHeader}>{t('profile.section_programme')}</Text>
      <View style={[styles.sectionCard, elevation.card]}>
        <InfoRow
          icon="book-outline"
          iconColor={colors.exam}
          label={t('profile.info.programme_info')}
          value={programmeInfoValue}
        />
        <InfoRow
          icon="calendar-outline"
          iconColor={colors.info}
          label={t('profile.info.current_semester')}
          value={currentSemesterValue}
          isLast
        />
      </View>

      {/* Logout — standalone, outside cards */}
      <View style={styles.logoutRow}>
        <InfoRow label={t('profile.row.logout')} isLogout onPress={onLogoutPress} isLast />
      </View>
    </View>
  );
}

// ─── Error body ───────────────────────────────────────────────────────────────

function ErrorBody({ onRetry, styles }: { onRetry: () => void; styles: ReturnType<typeof makeStyles> }) {
  const { t } = useTranslation();

  return (
    <View style={styles.centeredBody}>
      <View style={styles.errorIconCircle}>
        <Image
          source={require('../../assets/icons/calendar-error.png')}
          style={{ width: 48, height: 48 }}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.stateTitle}>{t('profile.error.title')}</Text>
      <Text style={styles.stateBody}>{t('profile.error.body')}</Text>

      <PressBox tier="button" style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('profile.error.retry')}</Text>
      </PressBox>

      <View style={styles.qrBanner}>
        <Text style={styles.qrBannerTitle}>{t('profile.error.qr_available')}</Text>
        <Text style={styles.qrBannerSubtitle}>{t('profile.error.qr_subtitle')}</Text>
      </View>
    </View>
  );
}

// ─── Incomplete body ──────────────────────────────────────────────────────────

function IncompleteBody({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  const { t } = useTranslation();

  return (
    <View style={styles.incompleteBody}>
      <Image
        source={require('../../assets/icons/Profile_inc.png')}
        style={styles.incompleteImage}
        resizeMode="contain"
      />
      <Text style={styles.stateTitle}>{t('profile.incomplete.title')}</Text>
      <Text style={styles.stateBody}>{t('profile.incomplete.body')}</Text>

      <View style={styles.validatedBanner}>
        <Text style={styles.validatedBannerText}>{t('profile.incomplete.validated')}</Text>
      </View>

      <View style={styles.pendingBanner}>
        <Image
          source={require('../../assets/icons/Hourglass.png')}
          style={{ width: 25, height: 25 }}
          resizeMode="contain"
        />
        <Text style={styles.pendingBannerText}>{t('profile.incomplete.pending_photo')}</Text>
      </View>

      <View style={styles.pendingBanner}>
        <Image
          source={require('../../assets/icons/Hourglass.png')}
          style={{ width: 25, height: 25 }}
          resizeMode="contain"
        />
        <Text style={styles.pendingBannerText}>{t('profile.incomplete.pending_qr')}</Text>
      </View>
    </View>
  );
}

// ─── DEV switcher ─────────────────────────────────────────────────────────────

const ALL_STATES: ProfileState[] = [
  'skeleton',
  'loaded',
  'offline',
  'incomplete',
  'error',
  'session',
];

const STATE_LABELS: Record<ProfileState, string> = {
  skeleton: 'loading',
  loaded: 'loaded',
  offline: 'offline',
  incomplete: 'incomplete',
  error: 'error',
  session: 'session',
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [devState, setDevState] = useState<ProfileState | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  const [qrToken, setQrToken] = useState<string | null>(null);
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleLogout = () => {
    Alert.alert(
      t('logout.confirm_title'),
      t('logout.confirm_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('logout.confirm_button'),
          style: 'destructive',
          onPress: async () => {
            Keyboard.dismiss();
            try {
              await logoutService();
            } finally {
              router.replace('/(auth)/login');
            }
          },
        },
      ],
    );
  };

  // ─── Offline query ──────────────────────────────────────────────────────────

  const hook = useOfflineQuery<StudentProfileCache>({
    cacheKey: 'profile',
    getCached: () => getStudentProfile(),
    fetchFresh: async () => {
      const me = await getStudentMe();
      useAuthStore.getState().setStudent(me);
      return mapProfileToCache(me);
    },
    updateCache: (data) => upsertProfile(data),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await hook.refetch();
    setRefreshing(false);
  }, [hook]);

  // ─── QR token refresh (independent of profile hook) ────────────────────────

  useEffect(() => {
    let cancelled = false;
    const fetchQr = () => {
      getQrToken()
        .then((res) => { if (!cancelled) setQrToken(res.token); })
        .catch(() => {});
    };
    // Only try to refresh QR when online
    fetchQr();
    qrIntervalRef.current = setInterval(fetchQr, 55000);
    return () => {
      cancelled = true;
      if (qrIntervalRef.current) clearInterval(qrIntervalRef.current);
    };
  }, []);

  // ─── Derive screen state ────────────────────────────────────────────────────

  const hookState: ProfileState = (() => {
    if (hook.isLoading && !hook.data) return 'skeleton';
    if (hook.isOffline && hook.data) return 'offline';
    if (hook.data) return 'loaded';
    if (hook.error) return 'error';
    return 'skeleton';
  })();

  const profileState = devState ?? hookState;

  const showBody =
    profileState === 'loaded' ||
    profileState === 'offline' ||
    profileState === 'session';

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ProfileHeader
        state={profileState}
        topInset={insets.top}
        isScrolled={isScrolled}
        onDotsPress={() => router.push('/settings')}
      />

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setIsScrolled(e.nativeEvent.contentOffset.y > 2)}
        scrollEventThrottle={16}
        refreshControl={
          profileState !== 'skeleton' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.jade400}
              colors={[colors.jade400]}
              progressBackgroundColor={colors.surface}
            />
          ) : undefined
        }
      >
        {profileState === 'skeleton' && <ProfileSkeleton />}
        {showBody && (
          <ProfileBody
            student={hook.data}
            qrToken={qrToken}
            onPresencePress={() => router.push('/attendance')}
            // Detail screens self-load from the store and treat `id` as an
            // optional guard, so navigate without it. The cache (hook.data)
            // carries no programme/faculty UUID — chevrons are gated on the
            // cached value below so a tap is never a silent no-op.
            onFacultyPress={() => router.push('/faculty-detail')}
            onProgrammePress={() => router.push('/programme-detail')}
            onEmailPress={() => {
              const email = hook.data?.email;
              if (email) Linking.openURL(`mailto:${email}`);
            }}
            onLogoutPress={handleLogout}
            styles={styles}
          />
        )}
        {profileState === 'error' && (
          <ErrorBody onRetry={() => hook.refetch()} styles={styles} />
        )}
        {profileState === 'incomplete' && <IncompleteBody styles={styles} />}

        <View style={{ height: 88 + insets.bottom }} />
      </ScrollView>

      <SessionExpiredModal
        visible={profileState === 'session'}
        onContinueOffline={() => setDevState('offline')}
      />

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={profileState}
        onChange={(s) => setDevState(s)}
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

  // ── Profile body (loaded / offline)
  body: {
    backgroundColor: colors.background,
    paddingTop: spacing.sp16,
    paddingBottom: spacing.sp8,
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
    overflow: 'hidden',
  },

  // ── Quick-action tiles
  tilesRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: spacing.sp16,
    marginTop: spacing.sp14,
  },

  // ── Logout standalone row
  logoutRow: {
    marginTop: spacing.sp8,
  },

  // ── Shared center layout (error)
  centeredBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp24,
    paddingBottom: 40,
  },
  stateTitle: {
    fontSize: fz(14),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp24,
  },
  stateBody: {
    fontSize: fz(14),
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    maxWidth: 218,
    lineHeight: fz(22),
    marginTop: spacing.sp16,
  },

  // ── Error state
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    width: 168,
    height: 56,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    alignSelf: 'center',
  },
  retryBtnText: {
    fontSize: fz(14),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
  qrBanner: {
    marginTop: spacing.sp24,
    marginHorizontal: spacing.sp16,
    borderRadius: radius.rMd,
    backgroundColor: colors.newsNotifBg,
    borderWidth: 1,
    borderColor: colors.jade400,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp12,
    alignItems: 'center',
    gap: spacing.sp4,
  },
  qrBannerTitle: {
    fontSize: fz(12),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.jade600,
    textAlign: 'center',
  },
  qrBannerSubtitle: {
    fontSize: fz(12),
    fontFamily: fonts.sans,
    color: colors.jade600,
    textAlign: 'center',
  },

  // ── Incomplete state
  incompleteBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sp24,
    paddingTop: spacing.sp32,
    paddingBottom: 40,
    gap: spacing.sp16,
  },
  incompleteImage: {
    width: 100,
    height: 100,
    marginTop: spacing.sp16,
  },
  validatedBanner: {
    marginHorizontal: spacing.sp16,
    height: 40,
    borderRadius: radius.rMd,
    backgroundColor: colors.newsNotifBg,
    borderWidth: 1,
    borderColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp16,
  },
  validatedBannerText: {
    fontSize: fz(12),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.jade600,
    textAlign: 'center',
  },
  pendingBanner: {
    marginHorizontal: spacing.sp16,
    minHeight: 56,
    borderRadius: radius.rMd,
    backgroundColor: colors.newsOfflineBg,
    borderWidth: 1,
    borderColor: colors.offline,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp8,
    gap: spacing.sp12,
  },
  pendingBannerText: {
    flex: 1,
    fontSize: fz(12),
    fontFamily: fonts.sans,
    color: colors.danger,
    lineHeight: fz(18),
  },
});

const makeTileStyles = (colors: Palette) => StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.rXl,
    padding: 14,
    alignItems: 'center',
    ...elevation.card,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.jadeFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLabel: {
    marginTop: spacing.sp8,
    fontSize: fz(12.5),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
  },
});
