import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Polyline, Polygon, Circle, Line } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { fonts, fz, radius, spacing, scrimColor, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { gpaChartLayout, publishedRuns, type GPADataPoint } from '@/utils/gpaHistory';

export type { GPADataPoint };

interface Props {
  visible: boolean;
  onClose: () => void;
  gpaData: GPADataPoint[];
}

// Chart geometry constants (Y-axis only — width is measured at runtime)
const CHART_H = 160;
const Y_MIN   = 0;
const Y_MAX   = 20;
/** Gutter on the reading-start side, for the y-axis labels. */
const PAD_START = 28;
/** Gutter on the reading-end side. */
const PAD_END   = 12;
const PAD_T   = 20;
const PAD_B   = 24;
const INNER_H = CHART_H - PAD_T - PAD_B;
/**
 * A semester label's box, centred on its point: as wide as the sheet's two
 * side margins, so a label at either end of the plot stays on the sheet.
 */
const X_LABEL_W = spacing.sp20 * 2;

const Y_TICKS      = [20, 15, 10, 5, 0];
const ADMISSION_Y  = PAD_T + INNER_H - ((10 - Y_MIN) / (Y_MAX - Y_MIN)) * INNER_H;

function toY(val: number) {
  return PAD_T + INNER_H - ((val - Y_MIN) / (Y_MAX - Y_MIN)) * INNER_H;
}

export function GPAHistorySheet({ visible, onClose, gpaData }: Props) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [chartWidth, setChartWidth] = useState(0);

  /*
   * RTL. The direction the rest of the screen is laid out in (forceRTL in
   * app/_layout.tsx), so the chart mirrors with it. Semesters then run right
   * to left for the points, the line AND the labels: all of them take their x
   * from gpaChartLayout, in physical pixels, and every overlay below sits in a
   * `direction: 'ltr'` box, so none of them is flipped automatically while the
   * SVG is not.
   */
  const rtl = I18nManager.isRTL;

  /*
   * Every semester in order; `value` is the server's published average, or
   * null where it is not published. Nothing here is estimated: a null gets no
   * point, and the line (with its area) is drawn per run of consecutive
   * published semesters, so it breaks at a gap instead of bridging it. The
   * screen opens this sheet only from two published averages
   * (utils/gpaHistory showsGpaHistory).
   */
  const data = gpaData;
  const runs = publishedRuns(data);
  const published = data
    .map((d, i) => ({ i, value: d.value }))
    .filter((d): d is { i: number; value: number } => d.value !== null);

  const layout = gpaChartLayout(
    data.length,
    { width: chartWidth, padStart: PAD_START, padEnd: PAD_END, rtl },
    X_LABEL_W
  );
  const toX = (index: number) => layout.slots[index].x;
  // Physical side of each overlay: the y-axis on the reading start, the
  // admission label and the latest-average tooltip on the reading end.
  const startSide = rtl ? 'right' : 'left';
  const endSide   = rtl ? 'left' : 'right';

  const point = (i: number) => `${toX(i)},${toY(data[i].value as number)}`;
  const lineRuns = runs.filter((run) => run.length >= 2);

  // The latest published average, and the one before it, for the stats.
  const latest   = published[published.length - 1];
  const previous = published[published.length - 2];
  const currentGpa = latest?.value ?? null;
  const diff       = latest && previous ? latest.value - previous.value : null;

  const trendPositive = (diff ?? 0) >= 0;
  const trendColor    = trendPositive ? colors.jade400 : colors.danger;
  const trendKey      = trendPositive ? 'gpa_history.trend_up' : 'gpa_history.trend_down';
  const diffStr       = Math.abs(diff ?? 0).toFixed(1).replace('.', ',');

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
            <Text style={styles.title}>{t('grades.history_title')}</Text>
            <Text style={styles.subtitle}>{t('grades.history_subtitle')}</Text>

            {/* Chart area — width measured via onLayout */}
            <View
              style={styles.chartWrapper}
              onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}
            >
              {chartWidth > 0 && (
                <Svg
                  width="100%"
                  height={CHART_H}
                  viewBox={`0 0 ${chartWidth} ${CHART_H}`}
                >
                  {/* Horizontal dashed grid lines */}
                  {Y_TICKS.map((tick) => (
                    <Line
                      key={tick}
                      x1={layout.plotLeft}
                      y1={toY(tick)}
                      x2={layout.plotRight}
                      y2={toY(tick)}
                      stroke={colors.hair}
                      strokeWidth={1}
                      strokeDasharray="4,4"
                    />
                  ))}

                  {/* Admission threshold at 10 */}
                  <Line
                    x1={layout.plotLeft}
                    y1={ADMISSION_Y}
                    x2={layout.plotRight}
                    y2={ADMISSION_Y}
                    stroke={withAlpha(colors.jade400, 0.35)}
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />

                  {/* Area and line, one per run of published semesters */}
                  {lineRuns.map((run) => (
                    <React.Fragment key={`run-${run[0]}`}>
                      <Polygon
                        points={[
                          ...run.map(point),
                          `${toX(run[run.length - 1])},${PAD_T + INNER_H}`,
                          `${toX(run[0])},${PAD_T + INNER_H}`,
                        ].join(' ')}
                        fill={colors.jadeFaint}
                      />
                      <Polyline
                        points={run.map(point).join(' ')}
                        fill="none"
                        stroke={colors.jade400}
                        strokeWidth={2.5}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </React.Fragment>
                  ))}

                  {/* A point for each published average; none for a gap */}
                  {published.map(({ i, value }) => (
                    <Circle
                      key={`${data[i].label}-${i}`}
                      cx={toX(i)}
                      cy={toY(value)}
                      r={6}
                      fill={colors.jade400}
                    />
                  ))}
                </Svg>
              )}

              {/* Y-axis labels (overlay, reading-start gutter) */}
              <View style={[StyleSheet.absoluteFill, styles.physical]} pointerEvents="none">
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
                          [startSide]: 0,
                          // Flush against the plot, whichever side it is on.
                          textAlign: endSide,
                          transform: [{ translateY: -7 }],
                        },
                      ]}
                    >
                      {tick}
                    </Text>
                  );
                })}
              </View>

              {/* Admission label (reading-end side, at 10) */}
              <View style={[StyleSheet.absoluteFill, styles.physical]} pointerEvents="none">
                <Text style={[styles.admissionLabel, { position: 'absolute', top: '50%' as unknown as number, [endSide]: 0 }]}>
                  {t('gpa_history.admission')}
                </Text>
              </View>

              {/* Current semester tooltip */}
              {currentGpa !== null && (
                <View style={[StyleSheet.absoluteFill, styles.physical]} pointerEvents="none">
                  <View style={[styles.tooltip, { position: 'absolute', [endSide]: spacing.sp4, top: spacing.sp4 }]}>
                    <Text style={styles.tooltipText}>
                      {currentGpa.toFixed(1)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* X-axis labels: each centred under its own point */}
            <View style={[styles.xAxis, styles.physical]}>
              {chartWidth > 0 && data.map((d, i) => (
                <Text
                  key={`${d.label}-${i}`}
                  numberOfLines={1}
                  style={[
                    styles.xLabel,
                    { left: layout.slots[i].labelLeft },
                    i === latest?.i && styles.xLabelActive,
                  ]}
                >
                  {d.label}
                </Text>
              ))}
            </View>

            {/* Stats below chart */}
            {currentGpa !== null && (
              <View style={styles.statsBlock}>
                <Text style={styles.currentLabel}>{t('grades.history_current')}</Text>
                <View style={styles.statsRow}>
                  {/* GPA number */}
                  <View style={styles.gpaLeft}>
                    <Text style={styles.gpaNumber}>{currentGpa.toFixed(2)}</Text>
                    <Text style={styles.gpaSuffix}>/20</Text>
                  </View>
                  {/* Trend */}
                  {diff !== null && (
                    <Text style={[styles.trendText, { color: trendColor }]}>
                      {t(trendKey, { diff: diffStr })}
                    </Text>
                  )}
                </View>
              </View>
            )}

            <View style={{ height: Math.max(28, insets.bottom + 12) }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: scrimColor,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.r2xl,
    borderTopRightRadius: radius.r2xl,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: radius.rFull,
    backgroundColor: colors.hair,
    marginTop: spacing.sp12,
    marginBottom: spacing.sp16,
  },

  // ── Header
  title: {
    fontSize: fz(17),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sp20,
  },
  subtitle: {
    fontSize: fz(13),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    marginTop: spacing.sp4,
    paddingHorizontal: spacing.sp20,
  },

  // ── Chart
  chartWrapper: {
    height: CHART_H,
    marginTop: spacing.sp20,
    marginHorizontal: spacing.sp20,
  },

  // ── Axis labels
  /*
   * The overlays are positioned in physical pixels (gpaChartLayout): inside
   * this box, left and right are the screen's left and right in French and in
   * Arabic, so they line up with the SVG, which never mirrors.
   */
  physical: {
    direction: 'ltr',
  },
  yLabel: {
    fontSize: fz(11),
    fontFamily: fonts.mono,
    color: colors.textTertiary,
    width: 22,
  },
  admissionLabel: {
    fontSize: fz(11),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
  },
  // Same horizontal frame as chartWrapper, so a label's x is its point's x.
  xAxis: {
    height: spacing.sp20,
    marginHorizontal: spacing.sp20,
    marginTop: spacing.sp8,
    overflow: 'visible',
  },
  xLabel: {
    position: 'absolute',
    top: 0,
    width: X_LABEL_W,
    fontSize: fz(12),
    fontFamily: fonts.mono,
    color: colors.textTertiary,
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
    fontSize: fz(12),
    fontWeight: '700',
    fontFamily: fonts.mono,
    // On the jade400 tooltip fill — see FilterRow.
    color: colors.surface,
  },

  // ── Stats block
  statsBlock: {
    paddingHorizontal: spacing.sp20,
    marginTop: spacing.sp16,
  },
  currentLabel: {
    fontSize: fz(12.5),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
    letterSpacing: 0.4,
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
    fontSize: fz(36),
    fontWeight: '800',
    fontFamily: fonts.sans,
    color: colors.jade400,
  },
  gpaSuffix: {
    fontSize: fz(14),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
  },
  trendText: {
    fontSize: fz(13),
    fontWeight: '400',
    fontFamily: fonts.sans,
  },
});
