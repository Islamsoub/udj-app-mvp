import React, { useState, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { PressBox } from '@/components/PressBox';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { fonts, fz, radius, spacing, scrimColor, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import type { Subject } from './SubjectCard';

interface Props {
  visible: boolean;
  onClose: () => void;
  subjects: Subject[];
}

export function GradeCalculatorSheet({ visible, onClose, subjects }: Props) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [targetGrade, setTargetGrade] = useState('');
  const [result, setResult] = useState<number | null>(null);
  const [calculated, setCalculated] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const scrollRef = useRef<React.ElementRef<typeof KeyboardAwareScrollView>>(null);

  const subject = subjects.length > 0 ? subjects[selectedIndex % subjects.length] : null;

  function prevSubject() {
    setSelectedIndex((prev) => (prev - 1 + subjects.length) % subjects.length);
    setResult(null);
    setCalculated(false);
  }

  function nextSubject() {
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

  const isImpossible = result !== null && result > 20;
  const isAchieved   = result !== null && result <= 0;
  const isWarning    = result !== null && result > 18 && result <= 20;
  const resultColor  = isImpossible
    ? colors.danger
    : isWarning
    ? colors.warning
    : colors.jade600;

  const canNavigate = subjects.length > 1;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(26, insets.bottom + 10) }]}>
          {/* Drag handle */}
          <View style={styles.handle} />

          <KeyboardAwareScrollView
            ref={scrollRef}
            bottomOffset={20}
            disableScrollOnKeyboardHide
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Text style={styles.title}>{t('grades.calc_title')}</Text>
            <Text style={styles.subtitle}>{t('grades.calc_subtitle')}</Text>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Content */}
            <View style={styles.content}>
              {/* Subject section */}
              <Text style={styles.sectionLabel}>{t('grades.calc_subject')}</Text>

              {/* Subject picker — bidirectional */}
              <View style={styles.pickerRow}>
                <PressBox
                  tier="icon"
                  style={styles.chevronBtn}
                  onPress={prevSubject}
                  hitSlop={8}
                  disabled={!canNavigate}
                >
                  <Ionicons
                    name="chevron-back"
                    size={18}
                    color={canNavigate ? colors.textSecondary : colors.textTertiary}
                  />
                </PressBox>
                <Text style={styles.pickerName} numberOfLines={1}>
                  {subject?.name ?? '—'}
                </Text>
                <PressBox
                  tier="icon"
                  style={styles.chevronBtn}
                  onPress={nextSubject}
                  hitSlop={8}
                  disabled={!canNavigate}
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={canNavigate ? colors.textSecondary : colors.textTertiary}
                  />
                </PressBox>
              </View>

              {/* CC display */}
              <View style={styles.ccRow}>
                <Text style={styles.ccLabel}>{t('grades.calc_current_cc')}</Text>
                <View style={styles.ccRight}>
                  <Text style={styles.ccValue}>
                    {subject !== null ? subject.cc.toFixed(2) : '—'}
                  </Text>
                  <Text style={styles.ccSuffix}>/20</Text>
                </View>
              </View>

              {/* Target grade section */}
              <Text style={[styles.sectionLabel, { marginTop: spacing.sp16 }]}>
                {t('grades.calc_target')}
              </Text>

              <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
                <TextInput
                  style={styles.input}
                  value={targetGrade}
                  onChangeText={(v) => {
                    setTargetGrade(v);
                    setCalculated(false);
                    setResult(null);
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={t('calculator.target_placeholder')}
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="numeric"
                />
                <Text style={styles.inputSuffix}>/20</Text>
              </View>

              {/* Calculate button */}
              <PressBox
                tier="button"
                style={styles.calcBtn}
                onPress={() => { Keyboard.dismiss(); calculate(); }}
              >
                <Text style={styles.calcBtnText}>{t('grades.calc_calculate')}</Text>
              </PressBox>

              {/* Result card */}
              {calculated && result !== null && (
                <View style={styles.resultCard}>
                  {!isAchieved && (
                    <>
                      <Text style={styles.resultLabel}>{t('calculator.result_label')}</Text>
                      <View style={styles.resultRow}>
                        <Text style={[styles.resultNumber, { color: resultColor }]}>
                          {result.toFixed(2)}
                        </Text>
                        <Text style={styles.resultSuffix}>/20</Text>
                      </View>
                    </>
                  )}
                  <Text style={[styles.resultVerdict, { color: resultColor }]}>
                    {isAchieved
                      ? t('grades.calc_result_achieved')
                      : isImpossible
                      ? t('grades.calc_result_impossible')
                      : t('grades.calc_result_need', { score: result.toFixed(2) })}
                  </Text>
                </View>
              )}

              <View style={{ height: spacing.sp16 }} />
            </View>
          </KeyboardAwareScrollView>
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
    fontSize: fz(12.5),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: spacing.sp8,
  },

  // ── Subject picker (bidirectional)
  pickerRow: {
    height: 50,
    backgroundColor: colors.surface2,
    borderRadius: radius.rMd,
    borderWidth: 1,
    borderColor: colors.hair,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
  },
  chevronBtn: {
    padding: spacing.sp4,
  },
  pickerName: {
    flex: 1,
    textAlign: 'center',
    fontSize: fz(15),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },

  // ── CC display row
  ccRow: {
    backgroundColor: colors.surface2,
    borderRadius: radius.rMd,
    paddingVertical: spacing.sp14,
    paddingHorizontal: spacing.sp16,
    marginTop: spacing.sp12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ccLabel: {
    fontSize: fz(14),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  ccRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sp2,
  },
  ccValue: {
    fontSize: fz(17),
    fontWeight: '600',
    fontFamily: fonts.mono,
    color: colors.jade400,
  },
  ccSuffix: {
    fontSize: fz(13),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
  },

  // ── Target grade input
  inputRow: {
    backgroundColor: colors.surface2,
    borderRadius: radius.rMd,
    borderWidth: 1,
    borderColor: colors.hair,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputRowFocused: {
    borderColor: colors.jade400,
  },
  input: {
    flex: 1,
    fontSize: fz(17),
    fontWeight: '500',
    fontFamily: fonts.mono,
    color: colors.textPrimary,
  },
  inputSuffix: {
    fontSize: fz(13),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
  },

  // ── Calculate button
  calcBtn: {
    marginTop: spacing.sp16,
    height: 50,
    borderRadius: radius.rBtn,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcBtnPressed: {
    backgroundColor: colors.jade600,
  },
  calcBtnText: {
    fontSize: fz(15),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.white,
  },

  // ── Result card
  resultCard: {
    marginTop: spacing.sp16,
    borderRadius: radius.rLg,
    backgroundColor: colors.background,
    padding: spacing.sp16,
  },
  resultLabel: {
    fontSize: fz(12),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sp4,
    marginTop: spacing.sp4,
    marginBottom: spacing.sp8,
  },
  resultNumber: {
    fontSize: fz(36),
    fontWeight: '800',
    fontFamily: fonts.sans,
  },
  resultSuffix: {
    fontSize: fz(14),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
  },
  resultVerdict: {
    fontSize: fz(13),
    fontWeight: '500',
    fontFamily: fonts.sans,
  },
});
