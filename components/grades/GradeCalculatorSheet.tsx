import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import type { Subject } from './SubjectCard';

interface Props {
  visible: boolean;
  onClose: () => void;
  subjects: Subject[];
}

export function GradeCalculatorSheet({ visible, onClose, subjects }: Props) {
  const { t } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [targetGrade, setTargetGrade] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [calculated, setCalculated] = useState(false);

  const subject = subjects.length > 0 ? subjects[selectedIndex % subjects.length] : null;

  function cycleSubject() {
    setSelectedIndex((prev) => (prev + 1) % subjects.length);
    setResult(null);
    setCalculated(false);
  }

  function calculate() {
    if (!subject) return;
    const target = parseFloat(targetGrade);
    if (isNaN(target)) return;
    const required = (target - subject.cc * 0.4) / 0.6;
    setResult(required);
    setCalculated(true);
  }

  // Result state thresholds
  const isImpossible = result !== null && result > 20;
  const isWarning    = result !== null && result > 18 && result <= 20;
  const resultColor  = isImpossible
    ? colors.danger
    : isWarning
    ? colors.warning
    : colors.jade600;

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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Text style={styles.title}>{t('calculator.title')}</Text>
            <Text style={styles.subtitle}>{t('calculator.subtitle')}</Text>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Content */}
            <View style={styles.content}>
              {/* Subject section */}
              <Text style={styles.sectionLabel}>{t('calculator.subject_label')}</Text>

              {/* Subject selector */}
              <Pressable style={styles.selector} onPress={cycleSubject}>
                <Text style={styles.selectorText} numberOfLines={1}>
                  {subject?.name ?? '—'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.greyMedium} />
              </Pressable>

              {/* CC display */}
              <View style={styles.ccRow}>
                <Text style={styles.ccLabel}>{t('calculator.cc_label')}</Text>
                <View style={styles.ccRight}>
                  <Text style={styles.ccValue}>
                    {subject !== null ? subject.cc.toFixed(2) : '—'}
                  </Text>
                  <Text style={styles.ccSuffix}>/20</Text>
                </View>
              </View>

              {/* Target grade section */}
              <Text style={[styles.sectionLabel, { marginTop: spacing.sp16 }]}>
                {t('calculator.target_label')}
              </Text>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={targetGrade}
                  onChangeText={(v) => {
                    setTargetGrade(v);
                    setCalculated(false);
                    setResult(null);
                  }}
                  placeholder={t('calculator.target_placeholder')}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
                <Text style={styles.inputSuffix}>/20</Text>
              </View>

              {/* Calculate button */}
              <Pressable
                style={({ pressed }) => [
                  styles.calcBtn,
                  pressed && styles.calcBtnPressed,
                ]}
                onPress={calculate}
              >
                <Text style={styles.calcBtnText}>{t('calculator.calculate')}</Text>
              </Pressable>

              {/* Result card */}
              {calculated && result !== null && (
                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>{t('calculator.result_label')}</Text>
                  <View style={styles.resultRow}>
                    <Text style={[styles.resultNumber, { color: resultColor }]}>
                      {isImpossible
                        ? result.toFixed(2)
                        : result.toFixed(2)}
                    </Text>
                    <Text style={styles.resultSuffix}>/20</Text>
                  </View>
                  {isImpossible && (
                    <Text style={[styles.resultNote, { color: colors.danger }]}>
                      {t('calculator.impossible')}
                    </Text>
                  )}
                  {isWarning && !isImpossible && (
                    <Text style={[styles.resultNote, { color: colors.warning }]}>
                      {t('calculator.warning')}
                    </Text>
                  )}
                </View>
              )}

              <View style={{ height: 28 }} />
            </View>
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sp16,
  },

  // ── Content
  content: {
    paddingHorizontal: spacing.sp20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.sp8,
  },

  // ── Subject selector
  selector: {
    height: 54,
    borderRadius: radius.rLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    marginEnd: spacing.sp8,
  },

  // ── CC display row
  ccRow: {
    height: 54,
    borderRadius: radius.rLg,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sp16,
    marginTop: spacing.sp12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ccLabel: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  ccRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  ccValue: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.mono,
    color: colors.jade600,
  },
  ccSuffix: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
  },

  // ── Target grade input
  inputRow: {
    height: 54,
    borderRadius: radius.rLg,
    borderWidth: 1,
    borderColor: colors.jade600,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.mono,
    color: colors.textPrimary,
  },
  inputSuffix: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
  },

  // ── Calculate button
  calcBtn: {
    marginTop: spacing.sp16,
    height: 52,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcBtnPressed: {
    backgroundColor: colors.jade600,
  },
  calcBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },

  // ── Result card
  resultCard: {
    marginTop: spacing.sp16,
    borderRadius: radius.rLg,
    backgroundColor: colors.background,
    padding: spacing.sp16,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sp4,
    marginTop: spacing.sp4,
  },
  resultNumber: {
    fontSize: 36,
    fontWeight: '700',
    fontFamily: fonts.mono,
  },
  resultSuffix: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
  },
  resultNote: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: fonts.sans,
    marginTop: spacing.sp4,
  },
});
