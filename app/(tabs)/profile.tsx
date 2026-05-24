import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Image,
  Alert,
  Keyboard,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import {
  ProfileHeader,
  ProfileHeaderStudent,
  ProfileHeaderState,
} from '@/components/profile/ProfileHeader';
import { StudentCard } from '@/components/profile/StudentCard';
import { InfoRow } from '@/components/profile/InfoRow';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
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

function cacheToHeaderStudent(c: StudentProfileCache): ProfileHeaderStudent {
  return {
    name: c.name,
    id: c.studentId,
    filiere: c.programmeName,
    gpa: c.gpa ?? 0,
    credits: c.creditsEarned,
    presence: c.attendancePercentage ?? 0,
  };
}

function statusKey(status: string): 'active' | 'suspended' | 'graduated' | null {
  const s = status.toUpperCase();
  if (s === 'ACTIVE') return 'active';
  if (s === 'SUSPENDED') return 'suspended';
  if (s === 'GRADUATED') return 'graduated';
  return null;
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
  const isAr = i18n.language === 'ar';

  const name = student?.name ?? '—';
  const id = student?.studentId ?? '—';
  const programme = student?.programme ?? '—';
  const filiere = student?.programmeName ?? '—';
  const facultyName = student?.facultyName ?? '—';
  const presence = student?.attendancePercentage ?? 0;
  const email = student?.email ?? '—';

  const sKey = statusKey(student?.status ?? '');
  const statusValue = sKey ? t(`profile.status.${sKey}`) : (student?.status ?? '—');

  const programmeLevel = student?.programmeLevel ?? '';
  const programmeDuration = student?.programmeDurationSemesters ?? 0;
  const programmeCredits = student?.programmeTotalCredits ?? 0;
  const semesterUnit = isAr ? 'فصل' : 'sem.';
  const creditsUnit = isAr ? 'وحدة' : 'crédits';
  const programmeInfoValue =
    programmeLevel || programmeDuration || programmeCredits
      ? `${programmeLevel} · ${programmeDuration} ${semesterUnit} · ${programmeCredits} ${creditsUnit}`
      : '—';

  const currentSem = student?.currentSemester ?? 0;
  const currentSemesterValue =
    currentSem > 0 ? t('profile.info.semester_value', { n: currentSem }) : '—';

  return (
    <View style={styles.body}>
      <StudentCard name={name} id={id} programme={programme} qrToken={qrToken} />

      <Text style={styles.sectionHeader}>{t('profile.section.academic')}</Text>
      <InfoRow
        label={t('profile.row.filiere')}
        value={filiere}
        onPress={onProgrammePress}
      />
      <InfoRow
        label={t('profile.info.faculty')}
        value={facultyName}
        onPress={onFacultyPress}
      />
      <InfoRow
        label={t('profile.row.presence')}
        value={`${presence}%`}
        onPress={onPresencePress}
      />

      <InfoRow
        icon="mail-outline"
        label={t('profile.info.email')}
        value={email}
        onPress={onEmailPress}
      />
      <InfoRow
        icon="checkmark-circle-outline"
        label={t('profile.info.status')}
        value={statusValue}
      />
      <InfoRow
        icon="book-outline"
        label={t('profile.info.programme_info')}
        value={programmeInfoValue}
      />
      <InfoRow
        icon="calendar-outline"
        label={t('profile.info.current_semester')}
        value={currentSemesterValue}
      />

      <InfoRow label={t('profile.row.logout')} isLogout onPress={onLogoutPress} />
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

      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('profile.error.retry')}</Text>
      </Pressable>

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
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [devState, setDevState] = useState<ProfileState | null>(null);
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

  const headerStudent: ProfileHeaderStudent =
    hook.data != null
      ? cacheToHeaderStudent(hook.data)
      : { name: '—', id: '—', filiere: '—', gpa: 0, credits: 0, presence: 0 };

  const showBody =
    profileState === 'loaded' ||
    profileState === 'offline' ||
    profileState === 'session';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <ProfileHeader
        state={profileState}
        topInset={insets.top}
        student={headerStudent}
        onDotsPress={() => router.push('/settings')}
      />

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {profileState === 'skeleton' && <ProfileSkeleton />}
        {showBody && (
          <ProfileBody
            student={hook.data}
            qrToken={qrToken}
            onPresencePress={() => router.push('/attendance')}
            onFacultyPress={() => {
              const facultyId = useAuthStore.getState().student?.faculty.id;
              if (facultyId) {
                router.push({ pathname: '/faculty-detail', params: { id: facultyId } });
              }
            }}
            onProgrammePress={() => {
              const programmeId = useAuthStore.getState().student?.programme.id;
              if (programmeId) {
                router.push({ pathname: '/programme-detail', params: { id: programmeId } });
              }
            }}
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

        <View style={{ height: 120 }} />
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

  // ── Shared center layout (error)
  centeredBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp24,
    paddingBottom: 40,
  },
  stateTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp24,
  },
  stateBody: {
    fontSize: 14,
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    maxWidth: 218,
    lineHeight: 22,
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
    fontSize: 14,
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
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.jade600,
    textAlign: 'center',
  },
  qrBannerSubtitle: {
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.danger,
    lineHeight: 18,
  },
});
