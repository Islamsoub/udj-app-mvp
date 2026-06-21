import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, fz, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';

interface NoteFieldProps {
  value: string;
  onChange: (text: string) => void;
  /** Max characters — default 80 */
  maxLength?: number;
}

/** The optional "Motif" free-text field with quick-fill preset chips. */
export function NoteField({ value, onChange, maxLength = 80 }: NoteFieldProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [focused, setFocused] = useState(false);

  const chips = useMemo(
    () => [
      t('presence.chip_medical'),
      t('presence.chip_admin'),
      t('presence.chip_family'),
    ],
    [t],
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {t('presence.note_label')}{' '}
          <Text style={styles.labelOptional}>{t('presence.note_optional')}</Text>
        </Text>
        <Text style={styles.counter}>
          {value.length}/{maxLength}
        </Text>
      </View>

      <TextInput
        style={[styles.input, focused && styles.inputFocused]}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={t('presence.note_placeholder')}
        placeholderTextColor={colors.textTertiary}
        multiline
        textAlignVertical="top"
        maxLength={maxLength}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chipsRow}
      >
        {chips.map((chip) => {
          const active = value === chip;
          return (
            <PressBox
              key={chip}
              tier="tint"
              radius={radius.rFull}
              onPress={() => onChange(chip)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip}</Text>
            </PressBox>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: {
      marginTop: 18,
      marginHorizontal: spacing.sp20,
    },
    labelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sp8,
    },
    label: {
      fontSize: fz(12.5),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
    labelOptional: {
      fontSize: fz(11),
      fontWeight: '400',
      fontFamily: fonts.sans,
      color: colors.textTertiary,
    },
    counter: {
      fontSize: fz(11),
      fontFamily: fonts.mono,
      color: colors.textTertiary,
    },
    input: {
      backgroundColor: colors.surface2,
      borderRadius: radius.rMd,
      borderWidth: 1.5,
      borderColor: 'transparent',
      paddingVertical: 11,
      paddingHorizontal: 13,
      height: 62,
      fontSize: fz(13),
      lineHeight: fz(13) * 1.45,
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
    inputFocused: {
      borderColor: colors.jade400,
    },
    chipsRow: {
      gap: 7,
      paddingTop: 10,
    },
    chip: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: radius.rFull,
      backgroundColor: colors.surface2,
    },
    chipActive: {
      backgroundColor: colors.jadeFaint,
    },
    chipText: {
      fontSize: fz(11.5),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.textSecondary,
    },
    chipTextActive: {
      color: colors.jadeText,
    },
  });
