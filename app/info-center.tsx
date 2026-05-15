import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  StyleSheet,
  StatusBar,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { ContactRow, ContactData } from '@/components/info-center/ContactRow';
import { FAQItem, FAQData } from '@/components/info-center/FAQItem';
import { PDFRow, PDFData } from '@/components/info-center/PDFRow';
import { InfoCenterSkeleton } from '@/components/info-center/InfoCenterSkeleton';

// ─── Types ─────────────────────────────────────────────────────────────────────

type InfoCenterState = 'loaded' | 'skeleton' | 'error' | 'offline' | 'session';

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CONTACTS: ContactData[] = [
  { id: 'c1', type: 'phone',    name: 'Scolarité',               detail: '05 00 00 00' },
  { id: 'c2', type: 'location', name: 'Bibliothèque',            detail: 'Bât. C, RDC' },
  { id: 'c3', type: 'email',    name: 'DSI (Support technique)', detail: 'support@udj.dj' },
  { id: 'c4', type: 'phone',    name: 'Infirmerie',              detail: '05 00 11 22' },
];

const MOCK_FAQS: FAQData[] = [
  {
    id: 'f1',
    question: 'Comment réinitialiser mon mot de passe ?',
    answer: "Rendez-vous sur l'écran de connexion et touchez « Mot de passe oublié ». Un lien de réinitialisation sera envoyé à votre email étudiant.",
  },
  {
    id: 'f2',
    question: 'Où trouver mon relevé de notes ?',
    answer: "Allez dans l'onglet Notes, puis appuyez sur « Relevé complet ». Vous pouvez aussi le télécharger en PDF depuis le Centre d'information.",
  },
  {
    id: 'f3',
    question: 'Comment justifier une absence ?',
    answer: "Allez dans Présence, sélectionnez la matière concernée, puis appuyez sur « Justifier ». Joignez un document et envoyez.",
  },
];

const MOCK_PDFS: PDFData[] = [
  { id: 'p1', name: "Formulaire d'inscription", url: '' },
  { id: 'p2', name: 'Demande de bourse',        url: '' },
];

// ─── DEV switcher ──────────────────────────────────────────────────────────────

const ALL_STATES: InfoCenterState[] = ['loaded', 'skeleton', 'error', 'offline', 'session'];

const STATE_LABELS: Record<InfoCenterState, string> = {
  loaded:   'Loaded',
  skeleton: 'Skeleton',
  error:    'Error',
  offline:  'Offline',
  session:  'Session',
};

// ─── Header ────────────────────────────────────────────────────────────────────

function Header({ topInset, onBack }: { topInset: number; onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.headerContainer, { paddingTop: topInset }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('infoCenter.title')}
        </Text>
      </View>
    </View>
  );
}

// ─── Offline banner ────────────────────────────────────────────────────────────

function InfoCenterOfflineBanner() {
  const { t } = useTranslation();
  return (
    <View style={styles.offlineBanner}>
      <View style={styles.offlineDot} />
      <Text style={styles.offlineBannerText}>
        {t('common.offlineBanner', { time: 'hier 14:30' })}
      </Text>
    </View>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ labelKey }: { labelKey: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionBand}>
      <Text style={styles.sectionLabel}>{t(labelKey)}</Text>
    </View>
  );
}

// ─── Search bar ────────────────────────────────────────────────────────────────

function SearchBar() {
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
  const [expandedId, setExpandedId] = useState<string>('f1');

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
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <SearchBar />

      <SectionHeader labelKey="infoCenter.campusDirectory" />
      {MOCK_CONTACTS.map(item => (
        <ContactRow
          key={item.id}
          item={item}
          onPress={() => handleContactPress(item)}
        />
      ))}

      <SectionHeader labelKey="infoCenter.faq" />
      {MOCK_FAQS.map(item => (
        <FAQItem
          key={item.id}
          item={item}
          isExpanded={expandedId === item.id}
          onToggle={() => handleFAQToggle(item.id)}
        />
      ))}

      <SectionHeader labelKey="infoCenter.pdfForms" />
      {MOCK_PDFS.map(item => (
        <PDFRow
          key={item.id}
          item={item}
          onDownload={() => console.log('[INFO_CENTER] download', item.id)}
        />
      ))}

      <View style={{ height: spacing.sp64 }} />
    </ScrollView>
  );
}

// ─── Error body ────────────────────────────────────────────────────────────────

function ErrorBody({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.centerBody}>
      <View style={styles.errorIconCircle}>
        <Ionicons name="warning" size={48} color={colors.danger} />
      </View>
      <Text style={styles.stateTitle}>{t('infoCenter.errorTitle')}</Text>
      <Text style={styles.stateBody}>{t('infoCenter.errorBody')}</Text>
      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('infoCenter.retry')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function InfoCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [screenState, setScreenState] = useState<InfoCenterState>('loaded');

  const showContent =
    screenState === 'loaded' ||
    screenState === 'offline' ||
    screenState === 'session';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <Header topInset={insets.top} onBack={() => router.back()} />

      <View style={styles.content}>
        {screenState === 'offline' && <InfoCenterOfflineBanner />}

        {screenState === 'skeleton' && <InfoCenterSkeleton />}
        {showContent && <LoadedContent />}
        {screenState === 'error' && (
          <ErrorBody onRetry={() => console.log('[INFO_CENTER] retry')} />
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },

  // ── Header
  headerContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
    height: 56,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },

  // ── Offline banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    borderBottomWidth: 1,
    borderBottomColor: '#FBD38D',
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
    marginEnd: spacing.sp8,
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: '#9A3412',
    flex: 1,
  },

  // ── Section band
  sectionBand: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
    fontSize: 15,
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
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 16,
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
    lineHeight: 22,
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
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
