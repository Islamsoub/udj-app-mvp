import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { DevSwitcher } from '@/components/ui/DevSwitcher';


type HomeState = 'loaded' | 'error' | 'empty' | 'skeleton' | 'offline';

// ─── Skeleton pulse ───────────────────────────────────────────────────────────
function SkeletonBox({ style }: { style: object }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return <Animated.View style={[style, { opacity }]} />;
}

// ─── Agenda card ─────────────────────────────────────────────────────────────
interface AgendaCardProps {
  accentColor: string;
  time: string;
  course: string;
  teacher: string;
  location: string;
  statusLabel?: string;
  statusBg?: string;
  statusColor?: string;
  statusBorder?: string;
  isOffline?: boolean;
}

function AgendaCard({
  accentColor,
  time,
  course,
  teacher,
  location,
  statusLabel,
  statusBg,
  statusColor,
  statusBorder,
  isOffline,
}: AgendaCardProps) {
  return (
    <View style={styles.agendaCard}>
      <View style={[styles.agendaAccent, { backgroundColor: accentColor }]} />
      <View style={styles.agendaContent}>
        <Text style={styles.agendaTime}>{time}</Text>
        <Text style={styles.agendaCourse}>{course}</Text>
        <Text style={styles.agendaTeacher}>{teacher}</Text>
        {isOffline && (
          <View style={styles.offlineWarningRow}>
            <Ionicons name="warning-outline" size={12} color={colors.warning} />
            <Text style={styles.offlineWarningText}>données locales</Text>
          </View>
        )}
        <View style={styles.pillRow}>
          <View style={styles.locationPill}>
            <Text style={styles.locationPillText}>{location}</Text>
          </View>
          {statusLabel != null && (
            <View
              style={[
                styles.statusPill,
                { backgroundColor: statusBg },
                statusBorder != null && { borderWidth: 1, borderColor: statusBorder },
              ]}
            >
              <Text style={[styles.statusPillText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── News card ────────────────────────────────────────────────────────────────
interface NewsCardProps {
  title: string;
  category: string;
}

function NewsCard({ title, category }: NewsCardProps) {
  return (
    <View style={styles.newsCard}>
      <View style={styles.newsThumbnail} />
      <View style={styles.newsText}>
        <Text style={styles.newsTitle} numberOfLines={2}>{title}</Text>
        <View style={styles.newsCategoryPill}>
          <Text style={styles.newsCategoryText}>{category}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Skeleton header ──────────────────────────────────────────────────────────
function SkeletonHeader() {
  return (
    <View style={styles.headerSection}>
      <SkeletonBox style={styles.skelBar180} />
      <SkeletonBox style={[styles.skelBar, { width: 240, marginTop: 8 }]} />
      <SkeletonBox style={[styles.skelBar, { width: 160, marginTop: 8 }]} />
      <View style={styles.divider} />
      <View style={styles.statRow}>
        {[0, 1, 2].map((i) => (
          <SkeletonBox key={i} style={styles.skelStatCard} />
        ))}
      </View>
    </View>
  );
}

// ─── Skeleton body ────────────────────────────────────────────────────────────
function SkeletonBody() {
  return (
    <View style={styles.bodySection}>
      <View style={styles.sectionHeadingRow}>
        <SkeletonBox style={{ width: 169, height: 15, borderRadius: radius.rFull, backgroundColor: 'rgba(217,217,217,0.6)' }} />
        <SkeletonBox style={{ width: 44, height: 15, borderRadius: radius.rFull, backgroundColor: 'rgba(217,217,217,0.6)' }} />
      </View>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.skelAgendaCard]}>
          <SkeletonBox style={styles.skelAccent} />
          <View style={styles.skelAgendaInner}>
            <SkeletonBox style={[styles.skelBar, { width: 100 }]} />
            <SkeletonBox style={[styles.skelBar, { width: 200, marginTop: 6 }]} />
            <SkeletonBox style={[styles.skelBar, { width: 140, marginTop: 6 }]} />
            <SkeletonBox style={[styles.skelBar, { width: 80, marginTop: 6 }]} />
          </View>
        </View>
      ))}
      <View style={[styles.sectionHeadingRow, { marginTop: 24 }]}>
        <SkeletonBox style={{ width: 169, height: 15, borderRadius: radius.rFull, backgroundColor: 'rgba(217,217,217,0.6)' }} />
        <SkeletonBox style={{ width: 44, height: 15, borderRadius: radius.rFull, backgroundColor: 'rgba(217,217,217,0.6)' }} />
      </View>
      {[0, 1].map((i) => (
        <SkeletonBox key={i} style={styles.skelNewsCard} />
      ))}
    </View>
  );
}

// ─── Loaded header ────────────────────────────────────────────────────────────
function LoadedHeader({ isOffline, topInset, lastSyncTime }: { isOffline: boolean; topInset: number; lastSyncTime?: string }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.headerSection, { paddingTop: topInset + 16 }]}>
      <Text style={styles.dateLabel}>LUNDI 23 MARS 2025</Text>
      <Text style={styles.greeting}>
        <Text style={styles.greetingBase}>Bonjour, </Text>
        <Text style={styles.greetingName}>Ahmed</Text>
      </Text>
      {isOffline ? (
        <Text style={styles.subtitleOffline}>
          <Text style={styles.subtitleOfflineNormal}>Données locales – </Text>
          <Text style={styles.subtitleOfflineTime}>{t('common.last_sync_short', { time: lastSyncTime ?? 'hier 14h30' })}</Text>
        </Text>
      ) : (
        <Text style={styles.subtitle}>3 cours aujourd'hui – Prochain dans 12 min</Text>
      )}
      <View style={styles.divider} />
      <View style={styles.statRow}>
        <StatCard label="GPA" value="14.2" sub="↑ +0.8 vs S1" />
        <StatCard label="PRÉSENCE" value="87%" sub="Limite: 75%" />
        <StatCard label="CRÉDITS" value="18" sub="/ 30 ce sem." />
      </View>
    </View>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

// ─── Simple header (error / empty / loading) ──────────────────────────────────
function SimpleHeader({ topInset }: { topInset: number }) {
  return (
    <View style={[styles.simpleHeader, { paddingTop: topInset + 0 }]}>
      <Text style={styles.simpleHeaderTitle}>Accueil</Text>
      <View style={styles.divider} />
    </View>
  );
}

// ─── Session expired modal ────────────────────────────────────────────────────
interface SessionModalProps {
  onClose: () => void;
}

function SessionExpiredModal({ onClose }: SessionModalProps) {
  const router = useRouter();
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.dragHandle} />
        <View style={styles.modalIconCircle}>
          <Ionicons name="key-outline" size={36} color={colors.warning} />
        </View>
        <Text style={styles.modalTitle}>Session expirée</Text>
        <Text style={styles.modalBody}>
          Votre session a expiré pour des raisons de sécurité. Reconnectez-vous pour continuer à accéder à vos données.
        </Text>
        <Pressable
          style={styles.modalPrimaryBtn}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.modalPrimaryBtnText}>Se connecter</Text>
        </Pressable>
        <Pressable style={styles.modalOutlineBtn} onPress={onClose}>
          <Text style={styles.modalOutlineBtnText}>Continuer en hors-ligne</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── DEV switcher ─────────────────────────────────────────────────────────────
const ALL_STATES: HomeState[] = ['loaded', 'error', 'empty', 'skeleton', 'offline'];
const STATE_LABELS: Record<HomeState, string> = {
  loaded:   'loaded',
  error:    'error',
  empty:    'empty',
  skeleton: 'loading/skeleton',
  offline:  'offline',
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [homeState, setHomeState] = useState<HomeState>('loaded');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const isLoaded = homeState === 'loaded';
  const isOffline = homeState === 'offline';
  const showLoadedHeader = isLoaded || isOffline || homeState === 'skeleton';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        {homeState === 'skeleton' ? (
          <View style={{ paddingTop: insets.top }}><SkeletonHeader /></View>
        ) : showLoadedHeader ? (
          <LoadedHeader isOffline={isOffline} topInset={insets.top} />
        ) : (
          <SimpleHeader topInset={insets.top} />
        )}

        {/* Body */}
        {homeState === 'skeleton' && <SkeletonBody />}

        {(isLoaded || isOffline) && (
          <View style={styles.bodySection}>
            {/* Agenda section */}
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeading}>Agenda du jour</Text>
              <Text style={styles.sectionLink}>Voir tout</Text>
            </View>

            {isLoaded ? (
              <>
                <AgendaCard
                  accentColor="#1D9E75"
                  time="08:00 - 10:00"
                  course="Mathématiques Générales L2"
                  teacher="Pr. Abdi Hassan"
                  location="Amphi A1"
                  statusLabel="Présent"
                  statusBg="rgba(29,158,117,0.15)"
                  statusColor="#1D9E75"
                />
                <AgendaCard
                  accentColor="#8B5CF6"
                  time="10:30 - 12:30"
                  course="Algorithmique et Structures"
                  teacher="Dr. Fadumo Ali"
                  location="Labo 3"
                  statusLabel="Examen"
                  statusBg="rgba(139,92,246,0.15)"
                  statusColor="#8B5CF6"
                  statusBorder="#8B5CF6"
                />
                <AgendaCard
                  accentColor="#3B82F6"
                  time="14:00 - 16:00"
                  course="Physique Quantique L2"
                  teacher="Pr. Mohamed Wais"
                  location="Salle 204"
                />
              </>
            ) : (
              <AgendaCard
                accentColor="#1D9E75"
                time="08:00 - 10:00"
                course="Mathématiques Générales L2"
                teacher="Pr. Abdi Hassan"
                location="Amphi A1"
                statusLabel="Confirmé (hors-ligne)"
                statusBg="#F5F7F6"
                statusColor="#6B7B74"
                isOffline
              />
            )}

            {/* News section */}
            <View style={[styles.sectionHeadingRow, { marginTop: 24 }]}>
              <Text style={styles.sectionHeading}>Actualité du jour</Text>
              <Text style={styles.sectionLink}>Voir tout</Text>
            </View>

            {isLoaded ? (
              <>
                <NewsCard
                  title="Calendrier des examens du semestre 2 disponible"
                  category="Examens"
                />
                <NewsCard
                  title="Nouvelle bibliothèque numérique ouverte aux étudiants"
                  category="Campus"
                />
              </>
            ) : (
              <View style={styles.newsOfflineCard}>
                <View style={styles.newsOfflineIcon}>
                  <Ionicons name="globe-outline" size={18} color={colors.surface} />
                </View>
                <Text style={styles.newsOfflineText}>
                  Actualités et mises à jour indisponibles hors-ligne. Reconnectez-vous pour synchroniser.
                </Text>
              </View>
            )}
          </View>
        )}

        {homeState === 'error' && (
          <View style={styles.centerState}>
            <View style={styles.errorIconCircle}>
              <Ionicons name="wifi-outline" size={42} color={colors.textPrimary} />
            </View>
            <Text style={styles.stateTitle}>Impossible de charger votre agenda</Text>
            <Text style={styles.stateBody}>
              Vérifiez votre connexion internet et réessayez.
            </Text>
            <Pressable style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </Pressable>
            <Text style={styles.syncLabel}>DERNIÈRE SYNCHRONISATION</Text>
            <Text style={styles.syncValue}>{t('common.sync_value', { time: '14:30' })}</Text>
            <Text style={styles.offlineLink}>Afficher les données hors-ligne →</Text>
          </View>
        )}

        {homeState === 'empty' && (
          <View style={styles.centerState}>
            <Text style={styles.palmEmoji}>🌴</Text>
            <Text style={styles.stateTitle}>Aucun cours aujourd'hui</Text>
            <Text style={styles.stateBody}>
              Profitez de votre dimanche — pas de cours programmé. Bon repos !
            </Text>
            <View style={styles.nextCourseCard}>
              {/* TODO: replace with real API data in Phase 2 */}
              <Text style={styles.nextCourseTitle}>Prochain cours : lundi 08h00</Text>
              <Text style={styles.nextCourseSub}>Mathématiques Générales L2</Text>
            </View>
          </View>
        )}


        <View style={{ height: spacing.sp64 }} />
      </ScrollView>

      {showSessionModal && (
        <SessionExpiredModal onClose={() => setShowSessionModal(false)} />
      )}

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={homeState}
        onChange={setHomeState}
        showModal={showSessionModal}
        onToggleModal={() => setShowSessionModal((v) => !v)}
        modalLabel="modal"
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

  // ── Header
  headerSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp16,
    paddingBottom: 0,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textTertiary,
    fontFamily: fonts.sans,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  greeting: {
    marginTop: spacing.sp4,
  },
  greetingBase: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: fonts.sans,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.jade400,
    fontFamily: fonts.sans,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fonts.sans,
    marginTop: spacing.sp4,
  },
  subtitleOffline: {
    fontSize: 13,
    marginTop: spacing.sp4,
  },
  subtitleOfflineNormal: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fonts.sans,
  },
  subtitleOfflineTime: {
    fontSize: 13,
    color: colors.warning,
    fontFamily: fonts.sans,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.sp12,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sp8,
    marginTop: spacing.sp12,
    marginBottom: spacing.sp16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.rLg,
    padding: spacing.sp12,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    fontFamily: fonts.sans,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.jade400,
    fontFamily: fonts.sans,
    marginTop: spacing.sp2,
  },
  statSub: {
    fontSize: 11,
    color: colors.textTertiary,
    fontFamily: fonts.sans,
    marginTop: spacing.sp2,
  },

  // ── Simple header
  simpleHeader: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp16,
  },
  simpleHeaderTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    paddingTop: spacing.sp16,
    paddingBottom: spacing.sp16,
  },

  // ── Body
  bodySection: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sp16,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sp24,
    marginBottom: spacing.sp12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fonts.sans,
  },
  sectionLink: {
    fontSize: 13,
    color: colors.jade400,
    fontFamily: fonts.sans,
  },

  // ── Agenda card
  agendaCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.rLg,
    marginBottom: 23,
    minHeight: 91,
    overflow: 'hidden',
  },
  agendaAccent: {
    width: 9,
    borderTopStartRadius: radius.rLg,
    borderBottomStartRadius: radius.rLg,
  },
  agendaContent: {
    flex: 1,
    paddingStart: spacing.sp12,
    paddingEnd: spacing.sp16,
    paddingTop: 11,
    paddingBottom: 11,
    justifyContent: 'center',
  },
  agendaTime: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.mono,
  },
  agendaCourse: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fonts.sans,
    marginTop: 1,
  },
  agendaTeacher: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: fonts.sans,
  },
  offlineWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  offlineWarningText: {
    fontSize: 11,
    color: colors.warning,
    fontFamily: fonts.sans,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sp8,
    marginTop: spacing.sp8,
    alignItems: 'center',
  },
  locationPill: {
    backgroundColor: colors.background,
    borderRadius: radius.rFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  locationPillText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
  statusPill: {
    borderRadius: radius.rFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fonts.sans,
  },

  // ── News card
  newsCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.rLg,
    marginBottom: 14,
    minHeight: 64,
    alignItems: 'center',
    paddingHorizontal: spacing.sp12,
    paddingVertical: 10,
    gap: spacing.sp12,
  },
  newsThumbnail: {
    width: 38,
    height: 37,
    borderRadius: radius.rMd,
    backgroundColor: colors.background,
  },
  newsText: {
    flex: 1,
    alignItems: 'flex-start',
  },
  newsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    fontFamily: fonts.sans,
  },
  newsCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background,
    borderRadius: radius.rFull,
    paddingHorizontal: spacing.sp8,
    paddingVertical: 2,
    marginTop: 4,
  },
  newsCategoryText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: fonts.sans,
  },

  // ── News offline card
  newsOfflineCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: radius.rLg,
    padding: spacing.sp16,
    gap: spacing.sp12,
    alignItems: 'center',
  },
  newsOfflineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsOfflineText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning,
    fontFamily: fonts.sans,
  },

  // ── Empty / error center states
  centerState: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sp24,
    paddingTop: 144,
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: 'rgba(245,180,180,1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp16,
    fontFamily: fonts.sans,
  },
  stateBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sp8,
    fontFamily: fonts.sans,
  },
  retryBtn: {
    width: 168,
    height: 56,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp24,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.surface,
    fontFamily: fonts.sans,
  },
  syncLabel: {
    fontSize: 10,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.sp24,
    textAlign: 'center',
    fontFamily: fonts.sans,
  },
  syncValue: {
    fontSize: 14,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp4,
    fontFamily: fonts.sans,
  },
  offlineLink: {
    fontSize: 14,
    color: colors.jade400,
    textAlign: 'center',
    marginTop: spacing.sp16,
    fontFamily: fonts.sans,
  },
  palmEmoji: {
    fontSize: 80,
    textAlign: 'center',
  },
  nextCourseCard: {
    width: '100%',
    borderRadius: radius.rLg,
    backgroundColor: 'rgba(29,158,117,0.08)',
    borderWidth: 1,
    borderColor: colors.jade400,
    padding: spacing.sp16,
    marginTop: spacing.sp24,
  },
  nextCourseTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.jade400,
    textAlign: 'center',
    fontFamily: fonts.sans,
  },
  nextCourseSub: {
    fontSize: 13,
    color: colors.jade400,
    textAlign: 'center',
    marginTop: spacing.sp4,
    fontFamily: fonts.sans,
  },

  // ── Skeleton pieces
  skelBar180: {
    width: 180,
    height: 15,
    borderRadius: radius.rFull,
    backgroundColor: 'rgba(217,217,217,0.6)',
  },
  skelBar: {
    height: 15,
    borderRadius: radius.rFull,
    backgroundColor: 'rgba(217,217,217,0.6)',
  },
  skelStatCard: {
    flex: 1,
    height: 72,
    borderRadius: radius.rLg,
    backgroundColor: 'rgba(217,217,217,0.6)',
  },
  skelAgendaCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.rLg,
    marginBottom: 23,
    height: 91,
    overflow: 'hidden',
  },
  skelAccent: {
    width: 9,
    height: 91,
    backgroundColor: 'rgba(217,217,217,0.6)',
    borderTopStartRadius: radius.rLg,
    borderBottomStartRadius: radius.rLg,
  },
  skelAgendaInner: {
    flex: 1,
    paddingStart: spacing.sp12,
    paddingEnd: spacing.sp16,
    paddingTop: 11,
    gap: 0,
    justifyContent: 'center',
  },
  skelNewsCard: {
    width: '100%',
    height: 64,
    borderRadius: radius.rLg,
    backgroundColor: 'rgba(217,217,217,0.6)',
    marginBottom: 14,
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
    backgroundColor: '#D9D9D9',
    alignSelf: 'center',
    marginBottom: spacing.sp24,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: 'rgba(224,211,254,1)',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp16,
    fontFamily: fonts.sans,
  },
  modalBody: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sp8,
    fontFamily: fonts.sans,
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
    color: colors.surface,
    fontFamily: fonts.sans,
  },
  modalOutlineBtn: {
    width: '100%',
    height: 56,
    borderRadius: radius.rLg,
    borderWidth: 1,
    borderColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp12,
  },
  modalOutlineBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.jade400,
    fontFamily: fonts.sans,
  },

});
