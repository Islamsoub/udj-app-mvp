import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ScreenCapture from 'expo-screen-capture';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { fonts, lightColors, radius, sizing, spacing, elevation, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

// White text/strokes sit on the jade gradient — must stay white in both themes.
const BRAND_FG = lightColors.surface;

// Diagonal jade gradient matching the Sagal spec
const GRADIENT_COLORS: [string, string] = ['#1D9E75', '#0F6E56'];
const GRADIENT_START = { x: 0, y: 0 };
const GRADIENT_END = { x: 1, y: 1 };

const COLLAPSED_HEIGHT = 160;
const EXPANDED_HEIGHT = 340;
const CYCLE_SECONDS = 55;

const QR_MINI_SIZE = 52;
const QR_MINI_BOX = 64;
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
  const cardTextMid = withAlpha(colors.white, 0.8);
  const cardRingTrack = withAlpha(colors.white, 0.25);
  const countdownDot = withAlpha(colors.white, 0.6);

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
            // ── Collapsed: avatar + info left, mini QR + countdown right ────
            <View style={styles.collapsed}>
              {/* Top row: avatar + name/id/programme */}
              <View style={styles.topRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
                <View style={styles.nameBlock}>
                  <Text style={styles.cardName} numberOfLines={1}>{name}</Text>
                  <Text style={styles.cardStudentId} numberOfLines={1}>{id}</Text>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>{programme}</Text>
                </View>
              </View>

              {/* Bottom row: mini QR + countdown chip */}
              <View style={styles.bottomRow}>
                <View style={styles.qrBoxMini}>
                  <QRCode value={qrValue} size={QR_MINI_SIZE} backgroundColor="#FFFFFF" />
                </View>
                <View style={styles.countdownChip}>
                  <View style={[styles.countdownDot, { backgroundColor: countdownDot }]} />
                  <Text style={[styles.countdownChipText, { color: cardTextMid }]} numberOfLines={2}>
                    {t('profile.card.valid_expires', { seconds: secondsLeft })}
                  </Text>
                  <Text style={[styles.expandHint, { color: cardTextDim }]} numberOfLines={1}>
                    {t('profile.card.tap_expand')}
                  </Text>
                </View>
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
    padding: spacing.sp20,
  },

  // ── Collapsed layout ──────────────────────────────────────────────────────
  collapsed: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sp12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.rFull,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.jade400,
    includeFontPadding: false,
  },
  nameBlock: {
    flex: 1,
    gap: spacing.sp2,
    paddingTop: spacing.sp4,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.white,
  },
  cardStudentId: {
    fontSize: 12,
    fontFamily: fonts.mono,
    color: cardTextDim,
    includeFontPadding: false,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: cardTextDim,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp12,
    marginTop: spacing.sp16,
  },
  qrBoxMini: {
    width: QR_MINI_BOX,
    height: QR_MINI_BOX,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  countdownChip: {
    flex: 1,
    gap: spacing.sp4,
  },
  countdownDot: {
    width: 8,
    height: 8,
    borderRadius: radius.rFull,
  },
  countdownChipText: {
    fontSize: 11,
    fontFamily: fonts.sans,
    lineHeight: 15,
  },
  expandHint: {
    fontSize: 10,
    fontFamily: fonts.sans,
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
    fontSize: 14,
    fontFamily: fonts.mono,
    color: colors.white,
    includeFontPadding: false,
  },
  collapseHint: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: cardTextDim,
  },
});
