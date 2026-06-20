import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';

export type FAQData = {
  id: string;
  question: string;
  answer: string;
};

type Props = {
  item: FAQData;
  isExpanded: boolean;
  onToggle: () => void;
  isLast?: boolean;
};

export function FAQItem({ item, isExpanded, onToggle, isLast = false }: Props) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <PressBox
        tier="tint"
        onPress={onToggle}
        style={[styles.questionRow, isLast && !isExpanded && styles.borderless]}
      >
        <Text style={styles.question}>{item.question}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textTertiary}
        />
      </PressBox>

      {isExpanded && (
        <View style={[styles.answerContainer, isLast && styles.borderless]}>
          <Text style={styles.answer}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {},
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sp16,
    paddingHorizontal: spacing.sp16,
    minHeight: 56,
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
  },
  answerContainer: {
    paddingHorizontal: spacing.sp16,
    paddingBottom: spacing.sp16,
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
  },
  borderless: {
    borderBottomWidth: 0,
  },
  question: {
    flex: 1,
    fontSize: fz(15),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  answer: {
    fontSize: fz(14),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    lineHeight: fz(22),
  },
});
