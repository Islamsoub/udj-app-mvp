import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing, I18nManager } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenCapture from 'expo-screen-capture';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { fonts, fz, lightColors, radius, sizing, spacing, elevation, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

// White text/strokes sit on the jade gradient — must stay white in both themes.
const BRAND_FG = lightColors.surface;

// Diagonal jade gradient matching the Sagal spec — deeper end stop (≈150°) so
// the dark green pools toward the bottom and the slab reads with depth.
const GRADIENT_COLORS: [string, string] = ['#1D9E75', '#0A5C44'];
const GRADIENT_START = { x: 0.17, y: 0 };
const GRADIENT_END = { x: 0.83, y: 1 };

const COLLAPSED_HEIGHT = 202;
const EXPANDED_HEIGHT = 340;
const CYCLE_SECONDS = 55;

const QR_MINI_SIZE = 54;
const QR_FULL_SIZE = 160;
const QR_FULL_BOX_PADDING = 12;

const RING_SIZE = 18;
const RING_STROKE = 2;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_RADIUS;

interface StudentCardProps {
  name: string;
  id: string;
  programme: string;
  qrToken: string | null;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function StudentCard({ name, id, programme, qrToken }: StudentCardProps) {
  const { t } = useTranslation();
  const { colors } = useColors();

  const cardTextDim = withAlpha(colors.white, 0.7);
  const cardRingTrack = withAlpha(colors.white, 0.25);
  const chevronTint = withAlpha(colors.white, 0.8);

  const styles = useMemo(
    () => makeStyles(colors, cardTextDim),
    [colors, cardTextDim],
  );

  const [expanded, setExpanded] = useState(false);
  const heightAnim = useRef(new Animated.Value(COLLAPSED_HEIGHT)).current;
  const [secondsLeft, setSecondsLeft] = useState(CYCLE_SECONDS);

  useEffect(() => {
    setSecondsLeft(CYCLE_SECONDS);
  }, [qrToken]);

  useEffect(() => {
    const intv = setInterval(() => {
      setSecondsLeft((s) => (s <= 1 ? CYCLE_SECONDS : s - 1));
    }, 1000);
    return () => clearInterval(intv);
  }, []);

  useEffect(() => {
    if (expanded) {
      ScreenCapture.preventScreenCaptureAsync();
    } else {
      ScreenCapture.allowScreenCaptureAsync();
    }
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
    };
  }, [expanded]);

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    Animated.timing(heightAnim, {
      toValue: next ? EXPANDED_HEIGHT : COLLAPSED_HEIGHT,
      duration: 250,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  };

  const qrValue = qrToken ?? id;
  const dashOffset = RING_CIRC * (1 - secondsLeft / CYCLE_SECONDS);
  const countdownLabel = `00:${String(secondsLeft).padStart(2, '0')}`;
  const initials = getInitials(name);

  return (
    <Animated.View style={[styles.cardWrap, { height: heightAnim }]}>
      <Pressable
        onPress={toggle}
        style={styles.pressable}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={GRADIENT_START}
          end={GRADIENT_END}
          style={styles.gradient}
        >
          {/* Decorative depth circle — breaks the flat gradient slab */}
          <View pointerEvents="none" style={styles.depthCircle} />

          {expanded ? (
            // ── Expanded: large QR centered ──────────────────────────────────
            <View style={styles.expanded}>
              <View style={styles.qrBoxFull}>
                <QRCode value={qrValue} size={QR_FULL_SIZE} backgroundColor="#FFFFFF" />
              </View>

              <View style={styles.countdownRow}>
                <Svg width={RING_SIZE} height={RING_SIZE}>
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={cardRingTrack}
                    strokeWidth={RING_STROKE}
                    fill="none"
                  />
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RING_RADIUS}
                    stroke={BRAND_FG}
                    strokeWidth={RING_STROKE}
                    fill="none"
                    strokeDasharray={`${RING_CIRC} ${RING_CIRC}`}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                  />
                </Svg>
                <Text style={styles.countdownMono}>{countdownLabel}</Text>
              </View>

              <Text style={styles.collapseHint} numberOfLines={1}>
                {t('profile.card.collapse_hint')}
              </Text>
            </View>
          ) : (
            // ── Collapsed: identity row + inset access panel ────────────────
            <View style={styles.collapsed}>
              {/* Identity row: avatar + name/id/programme */}
              <View style={styles.identityRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
                <View style={styles.identityText}>
                  <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
                  <Text style={styles.cardStudentId} numberOfLines={1}>{id}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>{programme}</Text>
                </View>
              </View>

              {/* Access panel: inset QR + valid pill + tap hint */}
              <View style={styles.accessPanel}>
                <View style={styles.qrBoxMini}>
                  <QRCode value={qrValue} size={QR_MINI_SIZE} backgroundColor="#FFFFFF" />
                </View>
                <View style={styles.accessInfo}>
                  <View style={styles.validPill}>
                    <View style={styles.validDot} />
                    <Text style={styles.validPillText} numberOfLines={1}>
                      {t('profile.card.valid_expires', { seconds: secondsLeft })}
                    </Text>
                  </View>
                  <Text style={styles.tapHint} numberOfLines={1}>
                    {t('profile.card.tap_expand')}
                  </Text>
                </View>
                <Ionicons
                  name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={18}
                  color={chevronTint}
                />
              </View>
            </View>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (colors: Palette, cardTextDim: string) => StyleSheet.create({
  cardWrap: {
    marginHorizontal: spacing.sp16,
    marginTop: spacing.sp12,
    borderRadius: radius.rHero,
    overflow: 'hidden',
    ...elevation.cardLg,
  },
  pressable: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    borderRadius: radius.rHero,
    padding: 18,
  },
  depthCircle: {
    position: 'absolute',
    end: -40,
    bottom: -50,
    width: 150,
    height: 150,
    borderRadius: radius.rFull,
    backgroundColor: withAlpha(colors.white, 0.07),
  },

  // ── Collapsed layout ──────────────────────────────────────────────────────
  collapsed: {
    flex: 1,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.rFull,
    backgroundColor: withAlpha(colors.white, 0.18),
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    fontSize: fz(20),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.white,
    includeFontPadding: false,
  },
  identityText: {
    flex: 1,
    gap: spacing.sp2,
  },
  cardName: {
    fontSize: fz(18),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.white,
  },
  cardStudentId: {
    fontSize: fz(12.5),
    fontFamily: fonts.mono,
    color: withAlpha(colors.white, 0.85),
    includeFontPadding: false,
  },
  cardSubtitle: {
    fontSize: fz(12.5),
    fontFamily: fonts.sans,
    color: withAlpha(colors.white, 0.8),
  },
  accessPanel: {
    marginTop: spacing.sp16,
    minHeight: sizing.touchTarget,
    backgroundColor: withAlpha(colors.white, 0.12),
    borderRadius: radius.rBtn,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp12,
  },
  qrBoxMini: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    padding: 5,
    flexShrink: 0,
  },
  accessInfo: {
    flex: 1,
    gap: spacing.sp6,
  },
  validPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.sp6,
    backgroundColor: withAlpha(colors.white, 0.18),
    borderRadius: radius.rFull,
    paddingHorizontal: 10,
    paddingVertical: spacing.sp4,
  },
  validDot: {
    width: 6,
    height: 6,
    borderRadius: radius.rFull,
    backgroundColor: colors.jadeDM,
  },
  validPillText: {
    fontSize: fz(11),
    fontFamily: fonts.sans,
    color: colors.white,
  },
  tapHint: {
    fontSize: fz(12),
    fontFamily: fonts.sans,
    color: withAlpha(colors.white, 0.78),
  },

  // ── Expanded layout ───────────────────────────────────────────────────────
  expanded: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrBoxFull: {
    padding: QR_FULL_BOX_PADDING,
    borderRadius: radius.rBtn,
    backgroundColor: '#FFFFFF',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp8,
  },
  countdownMono: {
    fontSize: fz(14),
    fontFamily: fonts.mono,
    color: colors.white,
    includeFontPadding: false,
  },
  collapseHint: {
    fontSize: fz(12),
    fontFamily: fonts.sans,
    color: cardTextDim,
  },
});
