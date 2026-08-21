import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  StatusBar,
  Linking,
} from 'react-native';
import { PressBox } from '@/components/PressBox';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { elevation, fonts, fz, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { ContactRow, ContactData } from '@/components/info-center/ContactRow';
import { FAQItem, FAQData } from '@/components/info-center/FAQItem';
import { PDFRow, PDFData } from '@/components/info-center/PDFRow';
import { InfoCenterSkeleton } from '@/components/info-center/InfoCenterSkeleton';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { useAuthStore } from '@/stores/authStore';
import { useNetworkStore } from '@/stores/networkStore';

// ─── Types ─────────────────────────────────────────────────────────────────────

type InfoCenterState = 'loaded' | 'skeleton' | 'error' | 'offline' | 'session';

// The campus directory is built at render time from the signed-in student's
// faculty record (see LoadedContent). The previous hardcoded list carried
// placeholder numbers — "05 00 00 00" for Scolarité and "05 00 11 22" for
// Infirmerie — which students could and would actually dial.

// ─── DEV switcher ──────────────────────────────────────────────────────────────

const ALL_STATES: InfoCenterState[] = ['loaded', 'skeleton', 'error', 'offline', 'session'];

const STATE_LABELS: Record<InfoCenterState, string> = {
  loaded:   'Loaded',
  skeleton: 'Skeleton',
  error:    'Error',
  offline:  'Offline',
  session:  'Session',
};

// ─── Offline banner ────────────────────────────────────────────────────────────

function InfoCenterOfflineBanner() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const lastSyncAt = useNetworkStore((s) => s.lastSyncAt);
  return (
    <View style={styles.offlineBanner}>
      <View style={styles.offlineDot} />
      <Text style={styles.offlineBannerText}>
        {/* Real last-sync time, formatted like components/ui/OfflineBanner. */}
        {t('common.offlineBanner', {
          time: lastSyncAt
            ? new Date(lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--',
        })}
      </Text>
    </View>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ labelKey }: { labelKey: string }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  return <Text style={styles.sectionLabel}>{t(labelKey)}</Text>;
}

// ─── Search bar ────────────────────────────────────────────────────────────────

function SearchBar() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search" size={20} color={colors.textTertiary} />
      <TextInput
        style={styles.searchInput}
        value={query}
        onChangeText={setQuery}
        placeholder={t('infoCenter.searchPlaceholder')}
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}

// ─── Loaded content ────────────────────────────────────────────────────────────

function LoadedContent() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string>('f1');

  const faqs: FAQData[] = [
    { id: 'f1', question: t('infoCenter.faq_q1'), answer: t('infoCenter.faq_a1') },
    { id: 'f2', question: t('infoCenter.faq_q2'), answer: t('infoCenter.faq_a2') },
    { id: 'f3', question: t('infoCenter.faq_q3'), answer: t('infoCenter.faq_a3') },
  ];

  // Real contacts from the signed-in student's faculty record. Entries with no
  // value on file are omitted rather than shown as a placeholder — a fake
  // number is worse than no number, because students dial it.
  const faculty = useAuthStore((s) => s.student?.faculty);
  const contacts: ContactData[] = useMemo(() => {
    const rows: ContactData[] = [];
    if (faculty?.phone) {
      rows.push({ id: 'c-phone', type: 'phone', name: t('infoCenter.contact_scolarite'), detail: faculty.phone });
    }
    if (faculty?.email) {
      rows.push({ id: 'c-email', type: 'email', name: t('infoCenter.contact_email'), detail: faculty.email });
    }
    if (faculty?.address) {
      rows.push({ id: 'c-address', type: 'location', name: t('infoCenter.contact_address'), detail: faculty.address });
    }
    if (faculty?.hours) {
      rows.push({ id: 'c-hours', type: 'location', name: t('infoCenter.contact_hours'), detail: faculty.hours });
    }
    return rows;
  }, [faculty, t]);

  // Only rows with a real download target. Both seeded entries carry an empty
  // url, which rendered a download button that silently did nothing.
  const pdfs: PDFData[] = [
    { id: 'p1', name: t('infoCenter.pdf1'), url: '' },
    { id: 'p2', name: t('infoCenter.pdf2'), url: '' },
  ].filter((p) => p.url !== '');

  function handleContactPress(item: ContactData) {
    if (item.type === 'phone') {
      Linking.openURL('tel:' + item.detail.replace(/\s/g, ''));
    } else if (item.type === 'email') {
      Linking.openURL('mailto:' + item.detail);
    }
  }

  function handleFAQToggle(id: string) {
    setExpandedId(prev => (prev === id ? '' : id));
  }

  return (
    <KeyboardAwareScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <SearchBar />

      <SectionHeader labelKey="infoCenter.campusDirectory" />
      <View style={[styles.sectionCard, elevation.card]}>
        {contacts.length > 0 ? (
          contacts.map((item, i) => (
            <ContactRow
              key={item.id}
              item={item}
              onPress={() => handleContactPress(item)}
              isLast={i === contacts.length - 1}
            />
          ))
        ) : (
          <Text style={styles.emptyDirectory}>{t('infoCenter.contacts_unavailable')}</Text>
        )}
      </View>

      <SectionHeader labelKey="infoCenter.faq" />
      <View style={[styles.sectionCard, elevation.card]}>
        {faqs.map((item, i) => (
          <FAQItem
            key={item.id}
            item={item}
            isExpanded={expandedId === item.id}
            onToggle={() => handleFAQToggle(item.id)}
            isLast={i === faqs.length - 1}
          />
        ))}
      </View>

      {/* Hidden entirely while there are no downloadable forms — an empty card
          under a section header reads as a loading failure. */}
      {pdfs.length > 0 && (
        <>
          <SectionHeader labelKey="infoCenter.pdfForms" />
          <View style={[styles.sectionCard, elevation.card]}>
            {pdfs.map((item, i) => (
              <PDFRow
                key={item.id}
                item={item}
                onDownload={() => Linking.openURL(item.url)}
                isLast={i === pdfs.length - 1}
              />
            ))}
          </View>
        </>
      )}

      <View style={{ height: spacing.sp64 }} />
    </KeyboardAwareScrollView>
  );
}

// ─── Error body ────────────────────────────────────────────────────────────────

function ErrorBody({ onRetry }: { onRetry: () => void }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  return (
    <View style={styles.centerBody}>
      <View style={styles.errorIconCircle}>
        <Ionicons name="warning" size={48} color={colors.danger} />
      </View>
      <Text style={styles.stateTitle}>{t('infoCenter.errorTitle')}</Text>
      <Text style={styles.stateBody}>{t('infoCenter.errorBody')}</Text>
      <PressBox tier="button" style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('infoCenter.retry')}</Text>
      </PressBox>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function InfoCenterScreen() {
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [screenState, setScreenState] = useState<InfoCenterState>('loaded');

  const showContent =
    screenState === 'loaded' ||
    screenState === 'offline' ||
    screenState === 'session';

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SettingsHeader topInset={insets.top} onBack={() => router.back()} title={t('infoCenter.title')} />

      <View style={styles.content}>
        {screenState === 'offline' && <InfoCenterOfflineBanner />}

        {screenState === 'skeleton' && <InfoCenterSkeleton />}
        {showContent && <LoadedContent />}
        {screenState === 'error' && (
          <ErrorBody onRetry={() => {}} />
        )}
      </View>

      <SessionExpiredModal
        visible={screenState === 'session'}
        onContinueOffline={() => setScreenState('offline')}
      />

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={screenState}
        onChange={setScreenState}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (colors: Palette) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },

  // ── Offline banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.offlineBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.warningBorder,
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.offline,
    marginEnd: spacing.sp8,
  },
  offlineBannerText: {
    fontSize: fz(12),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.offlineText,
    flex: 1,
  },

  // ── Section header
  sectionBand: {},
  sectionLabel: {
    marginTop: 22,
    marginBottom: spacing.sp8,
    marginHorizontal: spacing.sp20,
    fontSize: fz(13),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },

  // ── Section card
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.rXl,
    marginHorizontal: spacing.sp16,
    marginBottom: spacing.sp8,
    overflow: 'hidden',
  },

  // Shown in place of the directory rows when the faculty record carries no
  // contact details — matches ContactRow's vertical rhythm.
  emptyDirectory: {
    fontFamily: fonts.sans,
    fontSize: fz(14),
    color: colors.textSecondary,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp20,
    textAlign: 'center',
  },

  // ── Search bar
  searchBar: {
    marginHorizontal: spacing.sp16,
    marginTop: spacing.sp12,
    marginBottom: spacing.sp4,
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: radius.rLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp12,
  },
  searchInput: {
    flex: 1,
    marginStart: spacing.sp8,
    fontSize: fz(15),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },

  // ── Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },

  // ── Center states
  centerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp32,
  },
  errorIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 216,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: fz(16),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp16,
  },
  stateBody: {
    fontSize: fz(14),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fz(22),
    marginTop: spacing.sp8,
  },
  retryBtn: {
    width: 200,
    height: 56,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp24,
  },
  retryBtnText: {
    fontSize: fz(16),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
