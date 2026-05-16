import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import Svg, { Polyline, Polygon, Circle, Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Mock GPA data per semester
const GPA_DATA = [
  { label: 'S1', value: 12.4 },
  { label: 'S2', value: 13.1 },
  { label: 'S3', value: 13.4 },
  { label: 'S4', value: 14.2 },
];

const CURRENT_GPA = 14.2;
const PREV_GPA    = 13.4;
const DIFF        = CURRENT_GPA - PREV_GPA;

// Chart geometry constants
const CHART_W  = 300;  // approximate — SVG will stretch via viewBox
const CHART_H  = 160;
const Y_MIN    = 0;
const Y_MAX    = 20;
const PAD_L    = 28;  // space for Y labels
const PAD_R    = 12;
const PAD_T    = 20;
const PAD_B    = 24;

const INNER_W  = CHART_W - PAD_L - PAD_R;
const INNER_H  = CHART_H - PAD_T - PAD_B;

// Convert a GPA value to SVG y coordinate (0 = top)
function toY(val: number) {
  return PAD_T + INNER_H - ((val - Y_MIN) / (Y_MAX - Y_MIN)) * INNER_H;
}

// Convert index to SVG x coordinate
function toX(index: number) {
  return PAD_L + (index / (GPA_DATA.length - 1)) * INNER_W;
}

const Y_TICKS = [20, 15, 10, 5, 0];
const ADMISSION_Y = toY(10);

// Build polyline points string
const linePoints = GPA_DATA.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ');

// Build polygon points (area fill — line + baseline corners)
const areaPoints = [
  ...GPA_DATA.map((d, i) => `${toX(i)},${toY(d.value)}`),
  `${toX(GPA_DATA.length - 1)},${PAD_T + INNER_H}`,
  `${toX(0)},${PAD_T + INNER_H}`,
].join(' ');

export function GPAHistorySheet({ visible, onClose }: Props) {
  const { t } = useTranslation();

  const trendPositive = DIFF >= 0;
  const trendColor    = trendPositive ? colors.jade400 : colors.danger;
  const trendKey      = trendPositive ? 'gpa_history.trend_up' : 'gpa_history.trend_down';
  const diffStr       = Math.abs(DIFF).toFixed(1).replace('.', ',');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          >
            {/* Header */}
            <Text style={styles.title}>{t('gpa_history.title')}</Text>
            <Text style={styles.subtitle}>{t('gpa_history.subtitle')}</Text>

            {/* Chart area */}
            <View style={styles.chartWrapper}>
              <Svg
                width="100%"
                height={CHART_H}
                viewBox={`0 0 ${CHART_W} ${CHART_H}`}
                preserveAspectRatio="none"
              >
                {/* Horizontal dashed grid lines */}
                {Y_TICKS.map((tick) => (
                  <Line
                    key={tick}
                    x1={PAD_L}
                    y1={toY(tick)}
                    x2={CHART_W - PAD_R}
                    y2={toY(tick)}
                    stroke={colors.border}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                ))}

                {/* "admission" label line at 10 */}
                <Line
                  x1={PAD_L}
                  y1={ADMISSION_Y}
                  x2={CHART_W - PAD_R}
                  y2={ADMISSION_Y}
                  stroke={colors.textTertiary}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />

                {/* Area fill */}
                <Polygon
                  points={areaPoints}
                  fill="rgba(29,158,117,0.10)"
                />

                {/* Line */}
                <Polyline
                  points={linePoints}
                  fill="none"
                  stroke={colors.jade400}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Data points */}
                {GPA_DATA.map((d, i) => {
                  const cx = toX(i);
                  const cy = toY(d.value);
                  const isCurrent = i === GPA_DATA.length - 1;
                  return (
                    <Circle
                      key={d.label}
                      cx={cx}
                      cy={cy}
                      r={isCurrent ? 7 : 5}
                      fill={colors.jade400}
                    />
                  );
                })}
              </Svg>

              {/* Y-axis labels (overlay, left side) */}
              <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {Y_TICKS.map((tick) => {
                  const pct = ((Y_MAX - tick) / Y_MAX) * 100;
                  return (
                    <Text
                      key={tick}
                      style={[
                        styles.yLabel,
                        {
                          position: 'absolute',
                          top: `${pct}%` as unknown as number,
                          start: 0,
                          transform: [{ translateY: -7 }],
                        },
                      ]}
                    >
                      {tick}
                    </Text>
                  );
                })}
              </View>

              {/* Admission label (right side at 10) */}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { justifyContent: 'center', alignItems: 'flex-end' },
                ]}
                pointerEvents="none"
              >
                <Text style={[styles.admissionLabel, { position: 'absolute', top: '50%' as unknown as number, end: 0 }]}>
                  {t('gpa_history.admission')}
                </Text>
              </View>

              {/* Current semester tooltip above S4 */}
              <View
                style={[styles.tooltip, { position: 'absolute', end: 4, top: 4 }]}
              >
                <Text style={styles.tooltipText}>
                  {CURRENT_GPA.toFixed(1)}
                </Text>
              </View>
            </View>

            {/* X-axis labels */}
            <View style={styles.xAxis}>
              {GPA_DATA.map((d, i) => (
                <Text
                  key={d.label}
                  style={[styles.xLabel, i === GPA_DATA.length - 1 && styles.xLabelActive]}
                >
                  {d.label}
                </Text>
              ))}
            </View>

            {/* Stats below chart */}
            <View style={styles.statsBlock}>
              <Text style={styles.currentLabel}>{t('gpa_history.current_label')}</Text>
              <View style={styles.statsRow}>
                {/* GPA number */}
                <View style={styles.gpaLeft}>
                  <Text style={styles.gpaNumber}>{CURRENT_GPA.toFixed(2)}</Text>
                  <Text style={styles.gpaSuffix}>/20</Text>
                </View>
                {/* Trend */}
                <Text style={[styles.trendText, { color: trendColor }]}>
                  {t(trendKey, { diff: diffStr })}
                </Text>
              </View>
            </View>

            <View style={{ height: 28 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.r2xl,
    borderTopRightRadius: radius.r2xl,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.rFull,
    backgroundColor: '#E5E5E5',
    marginTop: 12,
    marginBottom: 16,
  },

  // ── Header
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sp20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
    marginTop: spacing.sp4,
    paddingHorizontal: spacing.sp20,
  },

  // ── Chart
  chartWrapper: {
    height: CHART_H,
    marginTop: spacing.sp20,
    paddingHorizontal: spacing.sp20,
  },

  // ── Axis labels
  yLabel: {
    fontSize: 11,
    fontFamily: fonts.mono,
    color: colors.greyMedium,
    width: 22,
    textAlign: 'right',
  },
  admissionLabel: {
    fontSize: 11,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp20,
    marginTop: spacing.sp8,
  },
  xLabel: {
    fontSize: 12,
    fontFamily: fonts.mono,
    color: colors.greyMedium,
    flex: 1,
    textAlign: 'center',
  },
  xLabelActive: {
    fontWeight: '700',
    color: colors.textPrimary,
  },

  // ── Tooltip
  tooltip: {
    backgroundColor: colors.jade400,
    borderRadius: radius.rSm,
    paddingHorizontal: spacing.sp8,
    paddingVertical: spacing.sp4,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.mono,
    color: colors.surface,
  },

  // ── Stats block
  statsBlock: {
    paddingHorizontal: spacing.sp20,
    marginTop: spacing.sp16,
  },
  currentLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.sp8,
  },
  gpaLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sp4,
  },
  gpaNumber: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: fonts.mono,
    color: colors.jade600,
  },
  gpaSuffix: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
  },
  trendText: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: fonts.sans,
  },
});
