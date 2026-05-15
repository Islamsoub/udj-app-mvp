import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '@/constants/theme';

export type FAQData = {
  id: string;
  question: string;
  answer: string;
};

type Props = {
  item: FAQData;
  isExpanded: boolean;
  onToggle: () => void;
};

export function FAQItem({ item, isExpanded, onToggle }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onToggle}
        android_ripple={{ color: colors.jade50 }}
        style={styles.questionRow}
      >
        <Text style={styles.question}>{item.question}</Text>
        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textTertiary}
        />
      </Pressable>

      {isExpanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answer}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sp16,
    paddingHorizontal: spacing.sp16,
    minHeight: 54,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  answerContainer: {
    paddingHorizontal: spacing.sp16,
    paddingBottom: spacing.sp16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  answer: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
