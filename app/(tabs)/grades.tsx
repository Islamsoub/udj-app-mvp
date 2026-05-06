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
import { GradesHeader } from '@/components/grades/GradesHeader';
import { SemesterTabs } from '@/components/grades/SemesterTabs';
import { SubjectCard, Subject } from '@/components/grades/SubjectCard';
import { GradesSkeleton } from '@/components/grades/GradesSkeleton';
import { DevSwitcher } from '@/components/ui/DevSwitcher';

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

// ─── Empty state body ─────────────────────────────────────────────────────────

interface EmptyStateProps {
  onRetry: () => void;
  onContact: () => void;
}

function EmptyStateBody({ onRetry, onContact }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.centerBody, { paddingTop: 40 }]}>
      <Image
        source={require('../../assets/icons/Hourglass.png')}
        style={{ width: 76, height: 76 }}
        resizeMode="contain"
      />
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GradesScreen() {
  const [gradesState, setGradesState] = useState<GradesState>('loaded');
  const [activeSemester, setActiveSemester] = useState<1 | 2>(2);
  const insets = useSafeAreaInsets();

  const headerGpa =
    gradesState === 'loaded' || gradesState === 'offline' || gradesState === 'session'
      ? 14.2
      : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Green top bar */}
        <GradesHeader
          state={gradesState === 'session' ? 'loaded' : gradesState}
          topInset={insets.top}
          gpa={headerGpa}
          activeSemester={activeSemester}
          onSemesterChange={setActiveSemester}
          credits={{ earned: 18, total: 30 }}
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

      <SessionExpiredModal
        visible={gradesState === 'session'}
        onContinueOffline={() => setGradesState('offline')}
      />

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={gradesState}
        onChange={setGradesState}
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

});
