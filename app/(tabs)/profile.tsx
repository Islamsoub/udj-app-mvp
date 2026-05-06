import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileState = ProfileHeaderState;

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_STUDENT: ProfileHeaderStudent = {
  name: 'Ahmed Omar Said',
  id: 'UDJ-2024-0432',
  filiere: 'Licence Sciences Exactes . L2',
  gpa: 14.2,
  credits: 18,
  presence: 87,
};

const MOCK_CARD = {
  programme: 'Sc. Exactes L2',
  annee: '2024-2025',
  statut: 'ACTIF',
};

// ─── Loaded / Offline body ────────────────────────────────────────────────────

function ProfileBody() {
  const { t } = useTranslation();

  return (
    <View style={styles.body}>
      <StudentCard
        name={MOCK_STUDENT.name}
        id={MOCK_STUDENT.id}
        programme={MOCK_CARD.programme}
        annee={MOCK_CARD.annee}
        statut={MOCK_CARD.statut}
      />

      <Text style={styles.sectionHeader}>{t('profile.section.academic')}</Text>
      <InfoRow label={t('profile.row.filiere')} value="Informatique" />
      <InfoRow label={t('profile.row.niveau')} value="Licence 2" />

      <Text style={styles.sectionHeader}>{t('profile.section.settings')}</Text>
      <InfoRow label={t('profile.row.langue')} value="Français" />
      <InfoRow label={t('profile.row.annee')} value="2024-2025" />
      <InfoRow
        label={t('profile.row.notifications')}
        value={t('profile.row.notifications_value')}
      />
      <InfoRow
        label={t('profile.row.documents')}
        value={t('profile.row.documents_value')}
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
      <Text style={styles.incompleteEmoji}>👤</Text>
      <Text style={styles.stateTitle}>{t('profile.incomplete.title')}</Text>
      <Text style={styles.stateBody}>{t('profile.incomplete.body')}</Text>

      {/* Green validated banner */}
      <View style={styles.validatedBanner}>
        <Text style={styles.validatedBannerText}>{t('profile.incomplete.validated')}</Text>
      </View>

      {/* Orange pending banner 1 */}
      <View style={styles.pendingBanner}>
        <Image
          source={require('../../assets/icons/Hourglass.png')}
          style={{ width: 25, height: 25 }}
          resizeMode="contain"
        />
        <Text style={styles.pendingBannerText}>{t('profile.incomplete.pending_photo')}</Text>
      </View>

      {/* Orange pending banner 2 */}
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
  const [profileState, setProfileState] = useState<ProfileState>('loaded');
  const insets = useSafeAreaInsets();

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
        {/* Header — handles topInset and all state variations internally */}
        <ProfileHeader
          state={profileState}
          topInset={insets.top}
          student={MOCK_STUDENT}
        />

        {/* Body per state */}
        {profileState === 'skeleton' && <ProfileSkeleton />}
        {showBody && <ProfileBody />}
        {profileState === 'error' && (
          <ErrorBody onRetry={() => console.log('[PROFILE] retry')} />
        )}
        {profileState === 'incomplete' && <IncompleteBody />}

        <View style={{ height: 120 }} />
      </ScrollView>

      <SessionExpiredModal
        visible={profileState === 'session'}
        onContinueOffline={() => setProfileState('offline')}
      />

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={profileState}
        onChange={setProfileState}
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
    width: 328,
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
  incompleteEmoji: {
    fontSize: 64,
    lineHeight: 76,
  },
  validatedBanner: {
    width: 328,
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
    width: 328,
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
