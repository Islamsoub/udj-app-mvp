import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, ScrollView, Image, Linking, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { elevation, fonts, fz, radius, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { PressBox } from '@/components/PressBox';
import { verifyCardCode, type CardVerdict } from '@/services/api';
import { localName } from '@/utils/i18nName';

// Vérifier une carte — scans another student's card QR with the camera and
// asks the server (POST /verify/card, backend utils/studentCard.ts) whether it
// is genuine: valid, expired, not recognised, or no longer enrolled, with the
// photo to compare. The same check as the public page and the admin scanner.
//
// The camera runs only while this screen shows the viewfinder: once a code is
// read the CameraView unmounts (the camera is released) until "Scanner une
// autre carte". Nothing is stored.

type Phase =
  | { kind: 'scanning' }
  | { kind: 'checking' }
  | { kind: 'result'; verdict: CardVerdict }
  | { kind: 'foreign' }
  | { kind: 'error' };

// A card QR is a link with the token after "#t=", or a bare JWT (older builds).
const looksLikeCard = (data: string) =>
  /[#?&]t=[A-Za-z0-9_\-.]+/.test(data) || /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data.trim());

export default function VerifyCardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<Phase>({ kind: 'scanning' });
  // onBarcodeScanned can fire several times for one frame burst; only the
  // first read of a scan counts.
  const busy = useRef(false);

  const onScanned = useCallback(async ({ data }: BarcodeScanningResult) => {
    if (busy.current) return;
    busy.current = true;
    if (!looksLikeCard(data)) {
      setPhase({ kind: 'foreign' });
      return;
    }
    setPhase({ kind: 'checking' });
    try {
      setPhase({ kind: 'result', verdict: await verifyCardCode(data) });
    } catch {
      setPhase({ kind: 'error' });
    }
  }, []);

  const scanAgain = () => {
    busy.current = false;
    setPhase({ kind: 'scanning' });
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SettingsHeader topInset={insets.top} onBack={() => router.back()} title={t('verifyCard.title')} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(spacing.sp32, insets.bottom + spacing.sp16) }]}
        showsVerticalScrollIndicator={false}
      >
        {!permission ? (
          <ActivityIndicator color={colors.jade400} style={styles.loader} />
        ) : !permission.granted ? (
          <View style={[styles.panel, elevation.card]}>
            <Ionicons name="camera-outline" size={32} color={colors.jade400} />
            <Text style={styles.panelTitle}>{t('verifyCard.permission_title')}</Text>
            <Text style={styles.panelBody}>
              {permission.canAskAgain ? t('verifyCard.permission_body') : t('verifyCard.permission_denied')}
            </Text>
            <PressBox
              style={styles.primaryBtn}
              accessibilityRole="button"
              onPress={() => (permission.canAskAgain ? void requestPermission() : void Linking.openSettings())}
            >
              <Text style={styles.primaryBtnText}>
                {permission.canAskAgain ? t('verifyCard.permission_allow') : t('verifyCard.open_settings')}
              </Text>
            </PressBox>
          </View>
        ) : phase.kind === 'scanning' ? (
          <>
            <Text style={styles.subtitle}>{t('verifyCard.subtitle')}</Text>
            <View style={styles.viewfinder}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={onScanned}
              />
              <View pointerEvents="none" style={styles.target} />
            </View>
            <Text style={styles.aim}>{t('verifyCard.aim')}</Text>
          </>
        ) : phase.kind === 'checking' ? (
          <View style={[styles.panel, elevation.card]}>
            <ActivityIndicator color={colors.jade400} />
            <Text style={styles.panelBody}>{t('verifyCard.checking')}</Text>
          </View>
        ) : (
          <>
            {phase.kind === 'result' ? (
              <VerdictView verdict={phase.verdict} styles={styles} colors={colors} />
            ) : (
              <View style={[styles.verdict, { backgroundColor: colors.dangerLight }]}>
                <Ionicons name="close-circle-outline" size={44} color={colors.danger} />
                <Text style={[styles.verdictTitle, { color: colors.danger }]}>
                  {phase.kind === 'foreign' ? t('verifyCard.invalid') : t('verifyCard.error')}
                </Text>
                {phase.kind === 'foreign' && (
                  <Text style={[styles.verdictHint, { color: colors.danger }]}>{t('verifyCard.not_unipocket')}</Text>
                )}
              </View>
            )}
            <PressBox style={styles.primaryBtn} accessibilityRole="button" onPress={scanAgain}>
              <Text style={styles.primaryBtnText}>{t('verifyCard.scan_again')}</Text>
            </PressBox>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Result ───────────────────────────────────────────────────────────────────

function VerdictView({
  verdict,
  styles,
  colors,
}: {
  verdict: CardVerdict;
  styles: ReturnType<typeof makeStyles>;
  colors: Palette;
}) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [photoFailed, setPhotoFailed] = useState(false);
  const s = verdict.student;

  const tone = verdict.valid
    ? { bg: colors.jade50, fg: colors.jade600, icon: 'checkmark-circle-outline' as const }
    : verdict.reason === 'expired'
      ? { bg: colors.warningLight, fg: colors.warningDeep, icon: 'alert-circle-outline' as const }
      : { bg: colors.dangerLight, fg: colors.danger, icon: 'close-circle-outline' as const };
  const key = verdict.valid ? 'valid' : (verdict.reason ?? 'invalid');
  const status =
    s?.status === 'SUSPENDED'
      ? t('verifyCard.status_suspended')
      : s?.status === 'GRADUATED'
        ? t('verifyCard.status_graduated')
        : null;

  const locale = lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR';
  const when = verdict.issuedAt ? new Date(verdict.issuedAt) : null;
  const issued = when
    ? t('verifyCard.issued_at', {
        date: when.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        time: when.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }),
      })
    : null;

  return (
    <>
      <View style={[styles.verdict, { backgroundColor: tone.bg }]} accessibilityRole="summary">
        <Ionicons name={tone.icon} size={44} color={tone.fg} />
        <Text style={[styles.verdictTitle, { color: tone.fg }]}>{t(`verifyCard.${key}`)}</Text>
        {!verdict.valid && (
          <Text style={[styles.verdictHint, { color: tone.fg }]}>{t(`verifyCard.${key}_hint`)}</Text>
        )}
        {status && <Text style={[styles.status, { color: tone.fg }]}>{status}</Text>}
      </View>

      {s && (
        <View style={[styles.holder, elevation.card]}>
          {s.photoUrl && !photoFailed ? (
            <Image source={{ uri: s.photoUrl }} style={styles.photo} onError={() => setPhotoFailed(true)} />
          ) : (
            <View style={[styles.photo, styles.initialsBox]}>
              <Text style={styles.initials}>{`${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`}</Text>
            </View>
          )}
          <Text style={styles.name}>
            {s.firstName} {s.lastName}
          </Text>
          <Fact label={t('verifyCard.matricule')} value={s.studentIdDisplay} mono styles={styles} />
          <Fact
            label={t('verifyCard.programme')}
            value={`${localName(s.programme, lang)} · ${t('verifyCard.semester', { n: s.currentSemester })}`}
            styles={styles}
          />
          <Fact label={t('verifyCard.faculty')} value={localName(s.faculty, lang)} styles={styles} />
        </View>
      )}

      {s && verdict.kind && issued && (
        <View
          style={[
            styles.kindNote,
            { backgroundColor: verdict.kind === 'offline' ? colors.warningLight : colors.surface2 },
          ]}
        >
          <Text style={[styles.kindText, verdict.kind === 'offline' && { color: colors.warningDeep }]}>
            {verdict.kind === 'offline' ? t('verifyCard.kind_offline') : t('verifyCard.kind_live')} · {issued}
          </Text>
          {verdict.kind === 'offline' && (
            <Text style={[styles.kindText, { color: colors.warningDeep }]}>{t('verifyCard.offline_hint')}</Text>
          )}
        </View>
      )}
    </>
  );
}

function Fact({
  label,
  value,
  mono = false,
  styles,
}: {
  label: string;
  value: string;
  mono?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.factRow}>
      <Text style={styles.factLabel}>{label}</Text>
      {/* Numbers and IDs stay in Plus Jakarta Sans / mono in both languages. */}
      <Text style={[styles.factValue, mono && styles.factMono]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const VIEWFINDER_SIZE = 300;

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingHorizontal: spacing.sp16, paddingTop: spacing.sp16, gap: spacing.sp16 },
    loader: { marginTop: spacing.sp48 },
    subtitle: {
      fontSize: fz(14),
      fontFamily: fonts.sans,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    viewfinder: {
      alignSelf: 'center',
      width: VIEWFINDER_SIZE,
      height: VIEWFINDER_SIZE,
      borderRadius: radius.r2xl,
      overflow: 'hidden',
      backgroundColor: colors.black,
    },
    target: {
      position: 'absolute',
      top: spacing.sp48,
      bottom: spacing.sp48,
      start: spacing.sp48,
      end: spacing.sp48,
      borderRadius: radius.rXl,
      borderWidth: 2,
      borderColor: withAlpha(colors.white, 0.85),
    },
    aim: {
      fontSize: fz(13),
      fontFamily: fonts.sans,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    panel: {
      alignItems: 'center',
      gap: spacing.sp12,
      padding: spacing.sp24,
      borderRadius: radius.rXl,
      backgroundColor: colors.surface,
    },
    panelTitle: {
      fontSize: fz(17),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    panelBody: {
      fontSize: fz(14),
      fontFamily: fonts.sans,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: fz(20),
    },
    primaryBtn: {
      alignSelf: 'stretch',
      minHeight: spacing.sp48,
      borderRadius: radius.rBtn,
      backgroundColor: colors.jade400,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sp20,
    },
    primaryBtnText: {
      fontSize: fz(15),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.white,
    },
    verdict: {
      alignItems: 'center',
      gap: spacing.sp6,
      paddingVertical: spacing.sp24,
      paddingHorizontal: spacing.sp16,
      borderRadius: radius.rXl,
    },
    verdictTitle: {
      fontSize: fz(20),
      fontWeight: '800',
      fontFamily: fonts.sans,
      textAlign: 'center',
    },
    verdictHint: {
      fontSize: fz(13),
      fontFamily: fonts.sans,
      textAlign: 'center',
      lineHeight: fz(19),
    },
    status: {
      fontSize: fz(12),
      fontWeight: '700',
      fontFamily: fonts.sans,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    holder: {
      alignItems: 'center',
      gap: spacing.sp8,
      padding: spacing.sp20,
      borderRadius: radius.rXl,
      backgroundColor: colors.surface,
    },
    photo: { width: 112, height: 112, borderRadius: radius.rXl },
    initialsBox: { backgroundColor: colors.sunken, alignItems: 'center', justifyContent: 'center' },
    initials: { fontSize: fz(32), fontWeight: '700', fontFamily: fonts.sans, color: colors.textSecondary },
    name: {
      fontSize: fz(18),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.sp4,
    },
    factRow: { flexDirection: 'row', alignSelf: 'stretch', gap: spacing.sp12 },
    factLabel: { width: 96, fontSize: fz(13), fontFamily: fonts.sans, color: colors.textSecondary },
    factValue: { flex: 1, fontSize: fz(13), fontWeight: '600', fontFamily: fonts.sans, color: colors.textPrimary },
    factMono: { fontFamily: fonts.mono, fontWeight: '400' },
    kindNote: { padding: spacing.sp12, borderRadius: radius.rMd, gap: spacing.sp4 },
    kindText: { fontSize: fz(12), fontFamily: fonts.sans, color: colors.textSecondary, lineHeight: fz(18) },
  });
