import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '@/constants/theme';

interface DevSwitcherProps<T extends string> {
  states: T[];
  labels?: Partial<Record<T, string>>;
  current: T;
  onChange: (state: T) => void;
  showModal?: boolean;
  onToggleModal?: () => void;
  modalLabel?: string;
}

export function DevSwitcher<T extends string>({
  states,
  labels,
  current,
  onChange,
  showModal,
  onToggleModal,
  modalLabel = 'modal',
}: DevSwitcherProps<T>) {
  if (!__DEV__) return null;
  return (
    <View style={styles.switcher}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {states.map((s) => (
          <Pressable
            key={s}
            style={[styles.btn, current === s && styles.btnActive]}
            onPress={() => onChange(s)}
          >
            <Text style={[styles.btnText, current === s && styles.btnTextActive]}>
              {labels?.[s] ?? s}
            </Text>
          </Pressable>
        ))}
        {onToggleModal && (
          <Pressable
            style={[styles.btn, showModal && styles.btnModal]}
            onPress={onToggleModal}
          >
            <Text style={[styles.btnText, showModal && styles.btnTextActive]}>
              {modalLabel}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  switcher: {
    position: 'absolute',
    bottom: 75,
    start: 0,
    end: 0,
  },
  scroll: {
    paddingHorizontal: spacing.sp8,
    gap: spacing.sp4,
  },
  btn: {
    paddingHorizontal: spacing.sp8,
    paddingVertical: spacing.sp4,
    borderRadius: radius.rSm,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  btnActive: {
    backgroundColor: colors.jade400,
  },
  btnModal: {
    backgroundColor: colors.exam,
  },
  btnText: {
    fontSize: 11,
    color: colors.surface,
    fontFamily: fonts.sans,
  },
  btnTextActive: {
    fontWeight: '700',
  },
});
