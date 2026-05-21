import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { colors, fonts, radius, spacing } from '@/constants/theme';
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

function deriveAcademicYear(year?: number): string {
  const startYear = year ?? (new Date().getMonth() < 7 ? new Date().getFullYear() - 1 : new Date().getFullYear());
  return `${startYear}-${startYear + 1}`;
}

// ─── Loaded / Offline body ────────────────────────────────────────────────────

interface ProfileBodyProps {
  student: StudentProfileCache | null;
  onPresencePress: () => void;
  onDocumentsPress: () => void;
}

function ProfileBody({ student, onPresencePress, onDocumentsPress }: ProfileBodyProps) {
  const { t } = useTranslation();

  const name = student?.name ?? '—';
  const id = student?.studentId ?? '—';
  const programme = student?.programme ?? '—';
  const annee = deriveAcademicYear(student?.year);
  const statut = student?.status ?? 'ACTIF';
  const filiere = student?.programmeName ?? '—';
  const niveau = student?.level ?? '—';
  const presence = student?.attendancePercentage ?? 0;

  return (
    <View style={styles.body}>
      <StudentCard
        name={name}
        id={id}
        programme={programme}
        annee={annee}
        statut={statut}
      />

      <Text style={styles.sectionHeader}>{t('profile.section.academic')}</Text>
      <InfoRow label={t('profile.row.filiere')} value={filiere} />
      <InfoRow label={t('profile.row.niveau')} value={niveau} />
      <InfoRow
        label={t('profile.row.presence')}
        value={`${presence}%`}
        onPress={onPresencePress}
      />

      <Text style={styles.sectionHeader}>{t('profile.section.settings')}</Text>
      <InfoRow label={t('profile.row.langue')} value="Français" />
      <InfoRow label={t('profile.row.annee')} value={annee} />
      <InfoRow
        label={t('profile.row.notifications')}
        value={t('profile.row.notifications_value')}
      />
      <InfoRow
        label={t('profile.row.documents')}
        value={t('profile.row.documents_value')}
        onPress={onDocumentsPress}
      />

      <InfoRow label={t('profile.row.logout')} isLogout />
    </View>
  );
}

// ─── Error body ───────────────────────────────────────────────────────────────

function ErrorBody({ onRetry }: { onRetry: () => void }) {
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

function IncompleteBody() {
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
  const [devState, setDevState] = useState<ProfileState | null>(null);
  const insets = useSafeAreaInsets();

  const [, setQrToken] = useState<string | null>(null);
  const qrIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          state={profileState}
          topInset={insets.top}
          student={headerStudent}
          onDotsPress={() => router.push('/settings')}
        />

        {profileState === 'skeleton' && <ProfileSkeleton />}
        {showBody && (
          <ProfileBody
            student={hook.data}
            onPresencePress={() => router.push('/attendance')}
            onDocumentsPress={() => router.push('/info-center')}
          />
        )}
        {profileState === 'error' && (
          <ErrorBody onRetry={() => hook.refetch()} />
        )}
        {profileState === 'incomplete' && <IncompleteBody />}

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
    minHeight: 54,
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
