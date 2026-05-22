import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

const CARD_TEXT_DIM = 'rgba(255,255,255,0.7)';
const CARD_PILL_BG = 'rgba(255,255,255,0.15)';
const CARD_RING_TRACK = 'rgba(255,255,255,0.25)';

const COLLAPSED_HEIGHT = 120;
const EXPANDED_HEIGHT = 320;
const CYCLE_SECONDS = 55;

const QR_SIZE = 160;
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

export function StudentCard({ name, id, programme, qrToken }: StudentCardProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

  return (
    <Animated.View style={[styles.cardWrap, { height: heightAnim }]}>
      <Pressable
        onPress={toggle}
        style={styles.card}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        {expanded ? (
          <View style={styles.expanded}>
            <View style={styles.qrBox}>
              <QRCode value={qrValue} size={QR_SIZE} backgroundColor="#FFFFFF" />
            </View>

            <View style={styles.countdownRow}>
              <Svg width={RING_SIZE} height={RING_SIZE}>
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={CARD_RING_TRACK}
                  strokeWidth={RING_STROKE}
                  fill="none"
                />
                <Circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  stroke={colors.surface}
                  strokeWidth={RING_STROKE}
                  fill="none"
                  strokeDasharray={`${RING_CIRC} ${RING_CIRC}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
                />
              </Svg>
              <Text style={styles.countdownText}>{countdownLabel}</Text>
            </View>

            <Text style={styles.collapseHint} numberOfLines={1}>
              {t('profile.card.collapse_hint')}
            </Text>
          </View>
        ) : (
          <View style={styles.collapsed}>
            <View style={styles.collapsedInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {t('profile.card.title')}
              </Text>
              <Text style={styles.cardName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.cardStudentId} numberOfLines={1}>
                {id}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {programme}
              </Text>
            </View>
            <View style={styles.showBtn}>
              <Text style={styles.showBtnText} numberOfLines={1}>
                {t('profile.card.show_qr')}
              </Text>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  cardWrap: {
    marginHorizontal: spacing.sp16,
    borderRadius: 18,
    backgroundColor: colors.jade600,
    overflow: 'hidden',
  },
  card: {
    flex: 1,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp16,
  },

  // Collapsed layout
  collapsed: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  collapsedInfo: {
    flex: 1,
    marginEnd: spacing.sp12,
  },
  showBtn: {
    height: 44,
    borderRadius: radius.rMd,
    backgroundColor: CARD_PILL_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp16,
  },
  showBtnText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Expanded layout
  expanded: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qrBox: {
    padding: spacing.sp8,
    borderRadius: radius.rMd,
    backgroundColor: '#FFFFFF',
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp8,
  },
  countdownText: {
    fontSize: 14,
    fontFamily: fonts.mono,
    color: colors.surface,
    includeFontPadding: false,
  },
  collapseHint: {
    fontSize: 11,
    fontFamily: fonts.sans,
    color: CARD_TEXT_DIM,
  },

  // Shared text
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: CARD_TEXT_DIM,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
    marginTop: spacing.sp4,
  },
  cardStudentId: {
    fontSize: 12,
    fontFamily: fonts.mono,
    color: CARD_TEXT_DIM,
  },
});
