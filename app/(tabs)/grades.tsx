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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { GradesHeader } from '@/components/grades/GradesHeader';
import { SemesterTabs } from '@/components/grades/SemesterTabs';
import { SubjectCard, Subject } from '@/components/grades/SubjectCard';
import { GradesSkeleton } from '@/components/grades/GradesSkeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

type GradesState = 'skeleton' | 'loaded' | 'offline' | 'empty' | 'error' | 'session';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SUBJECTS: Subject[] = [
  {
    id: '1',
    name: 'Mathématiques générales',
    cc: 13,
    exam: 15,
    coef: 4,
    finale: 14.2,
  },
  {
    id: '2',
    name: 'Mathématiques générales',
    cc: 13,
    exam: 15,
    coef: 4,
    finale: 7.5,
  },
  {
    id: '3',
    name: 'Mathématiques générales',
    cc: 13,
    exam: 15,
    coef: 4,
    finale: 14.2,
  },
];

// ─── Offline banner ───────────────────────────────────────────────────────────

function GradesOfflineBanner({ topInset }: { topInset: number }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.offlineBanner, { paddingTop: topInset + spacing.sp12 }]}>
      <View style={styles.offlineDot} />
      <Text style={styles.offlineBannerText}>{t('grades.offline.banner')}</Text>
    </View>
  );
}

// ─── Session expired modal ────────────────────────────────────────────────────

interface SessionModalProps {
  onClose: () => void;
  onOffline: () => void;
}

function SessionExpiredModal({ onClose, onOffline }: SessionModalProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.dragHandle} />
        <View style={styles.modalIconCircle}>
          <Ionicons name="key-outline" size={36} color={colors.exam} />
        </View>
        <Text style={styles.modalTitle}>{t('grades.session.title')}</Text>
        <Text style={styles.modalBody}>{t('grades.session.body')}</Text>
        <Pressable
          style={styles.modalPrimaryBtn}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.modalPrimaryBtnText}>{t('grades.session.login')}</Text>
        </Pressable>
        <Pressable
          style={styles.modalOutlineBtn}
          onPress={() => { onClose(); onOffline(); }}
        >
          <Text style={styles.modalOutlineBtnText}>{t('grades.session.continue_offline')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Empty state body ─────────────────────────────────────────────────────────

interface EmptyStateProps {
  onRetry: () => void;
  onContact: () => void;
}

function EmptyStateBody({ onRetry, onContact }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.centerBody, { paddingTop: 40 }]}>
      <Text style={styles.hourglassEmoji}>⏳</Text>
      <Text style={styles.stateTitle}>{t('grades.empty.title')}</Text>
      <Text style={styles.stateBody}>{t('grades.empty.body')}</Text>
      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('grades.empty.retry')}</Text>
      </Pressable>
      <Pressable onPress={onContact} hitSlop={8} style={{ marginTop: spacing.sp16 }}>
        <Text style={styles.contactLink}>{t('grades.empty.contact')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Error state body ─────────────────────────────────────────────────────────

interface ErrorStateProps {
  onRetry: () => void;
}

function ErrorStateBody({ onRetry }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.centerBody, { paddingTop: 40 }]}>
      <View style={styles.errorIconCircle}>
        <Image
          source={require('../../assets/icons/calendar-error.png')}
          style={{ width: 48, height: 48 }}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.stateTitle}>{t('grades.error.title')}</Text>
      <Text style={styles.stateBody}>{t('grades.error.body')}</Text>

      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('grades.empty.retry')}</Text>
      </Pressable>

      {/* Notification banner */}
      <View style={styles.notifBanner}>
        <Text style={styles.notifTitle}>{t('grades.error.notification_title')}</Text>
        <Text style={styles.notifBody}>{t('grades.error.notification_body')}</Text>
      </View>
    </View>
  );
}

// ─── Loaded / Offline cards body ──────────────────────────────────────────────

function CardsBody() {
  return (
    <View style={styles.cardsBody}>
      {MOCK_SUBJECTS.map((subject) => (
        <SubjectCard key={subject.id} subject={subject} />
      ))}
    </View>
  );
}

// ─── DEV switcher ─────────────────────────────────────────────────────────────

const ALL_STATES: GradesState[] = ['skeleton', 'loaded', 'offline', 'empty', 'error', 'session'];
const STATE_LABELS: Record<GradesState, string> = {
  skeleton: 'loading',
  loaded:   'loaded',
  offline:  'offline',
  empty:    'empty',
  error:    'error',
  session:  'session',
};

interface DevSwitcherProps {
  current: GradesState;
  onChange: (s: GradesState) => void;
}

function DevSwitcher({ current, onChange }: DevSwitcherProps) {
  return (
    <View style={styles.devSwitcher}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.devScroll}>
        {ALL_STATES.map((s) => (
          <Pressable
            key={s}
            style={[styles.devBtn, current === s && styles.devBtnActive]}
            onPress={() => onChange(s)}
          >
            <Text style={[styles.devBtnText, current === s && styles.devBtnTextActive]}>
              {STATE_LABELS[s]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GradesScreen() {
  const [gradesState, setGradesState] = useState<GradesState>('loaded');
  const [activeSemester, setActiveSemester] = useState<1 | 2>(2);
  const insets = useSafeAreaInsets();

  const showOfflineBanner = gradesState === 'offline';
  // For offline state the green block sits below the 46px banner;
  // topInset is consumed by the banner so the header gets 0.
  const headerTopInset = showOfflineBanner ? 0 : insets.top;
  const headerGpa =
    gradesState === 'loaded' || gradesState === 'offline' || gradesState === 'session'
      ? 14.2
      : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Offline banner — appears above the green block */}
      {showOfflineBanner && <GradesOfflineBanner topInset={insets.top} />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Green top bar */}
        <GradesHeader
          state={gradesState === 'session' ? 'loaded' : gradesState}
          topInset={headerTopInset}
          gpa={headerGpa}
          activeSemester={activeSemester}
          onSemesterChange={setActiveSemester}
        />

        {/* Body content */}
        {gradesState === 'skeleton' && <GradesSkeleton />}

        {(gradesState === 'loaded' || gradesState === 'session') && <CardsBody />}

        {gradesState === 'offline' && <CardsBody />}

        {gradesState === 'empty' && (
          <EmptyStateBody
            onRetry={() => console.log('[GRADES] retry triggered')}
            onContact={() => console.log('[GRADES] contact triggered')}
          />
        )}

        {gradesState === 'error' && (
          <ErrorStateBody
            onRetry={() => console.log('[GRADES] retry triggered')}
          />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Session expired modal overlay */}
      {gradesState === 'session' && (
        <SessionExpiredModal
          onClose={() => setGradesState('loaded')}
          onOffline={() => setGradesState('offline')}
        />
      )}

      {__DEV__ && (
        <DevSwitcher current={gradesState} onChange={setGradesState} />
      )}
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

  // ── Offline banner
  offlineBanner: {
    backgroundColor: colors.offlineBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.offline,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
    paddingBottom: spacing.sp12,
    gap: spacing.sp8,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.offline,
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.offlineText,
    flex: 1,
  },

  // ── Cards body
  cardsBody: {
    paddingTop: spacing.sp16,
    gap: 24,
  },

  // ── Center states (empty / error)
  centerBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sp24,
  },
  hourglassEmoji: {
    fontSize: 76,
    textAlign: 'center',
  },
  stateTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp16,
  },
  stateBody: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 245,
    lineHeight: 22,
    marginTop: spacing.sp8,
  },

  // ── Shared retry button (empty + error)
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
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },

  // ── Empty contact link
  contactLink: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.jade600,
    textAlign: 'center',
  },

  // ── Error icon circle
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Error notification banner
  notifBanner: {
    marginTop: spacing.sp24,
    width: 328,
    minHeight: 64,
    borderRadius: radius.rMd,
    backgroundColor: colors.jade50,
    borderWidth: 1,
    borderColor: colors.jade400,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp12,
    alignItems: 'flex-start',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.jade600,
  },
  notifBody: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.jade600,
    marginTop: spacing.sp4,
  },

  // ── Session expired modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopStartRadius: radius.r2xl,
    borderTopEndRadius: radius.r2xl,
    padding: spacing.sp24,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 49,
    height: 9,
    borderRadius: spacing.sp8,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sp24,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp16,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sp8,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp24,
  },
  modalPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
  modalOutlineBtn: {
    width: '100%',
    height: 56,
    borderRadius: radius.rLg,
    borderWidth: 1,
    borderColor: colors.jade600,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp12,
  },
  modalOutlineBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.jade400,
  },

  // ── DEV switcher
  devSwitcher: {
    position: 'absolute',
    bottom: 67,
    start: 0,
    end: 0,
  },
  devScroll: {
    paddingHorizontal: spacing.sp8,
    gap: spacing.sp4,
  },
  devBtn: {
    paddingHorizontal: spacing.sp8,
    paddingVertical: spacing.sp4,
    borderRadius: radius.rSm,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  devBtnActive: {
    backgroundColor: colors.jade400,
  },
  devBtnText: {
    fontSize: 11,
    color: colors.surface,
    fontFamily: fonts.sans,
  },
  devBtnTextActive: {
    fontWeight: '700',
  },
});
