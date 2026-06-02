import React, { useMemo } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, lightColors, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export type FilterKey = 'all' | 'events' | 'scolarite' | 'sport' | 'youth' | 'sponsors' | 'saved';

const FILTERS: FilterKey[] = ['all', 'events', 'scolarite', 'sport', 'youth', 'sponsors', 'saved'];

const FILTER_I18N: Record<FilterKey, string> = {
  all: 'news.filter.all',
  events: 'news.filter.events',
  scolarite: 'news.filter.scolarite',
  sport: 'news.filter.sport',
  youth: 'news.filter.youth',
  sponsors: 'news.filter.sponsors',
  saved: 'news.filter.saved',
};

interface FilterRowProps {
  activeFilter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
}

export function FilterRow({ activeFilter, onFilterChange }: FilterRowProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {FILTERS.map((f) => {
          const isActive = f === activeFilter;
          return (
            <Pressable
              key={f}
              style={({ pressed }) => [styles.pill, isActive && styles.pillActive, pressed && { backgroundColor: withAlpha(colors.jade400, 0.15) }]}
              onPress={() => onFilterChange(f)}
              hitSlop={8}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {t(FILTER_I18N[f])}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    height: 72,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.scheduleBorder,
    justifyContent: 'center',
  },
  content: {
    paddingStart: spacing.sp16,
    paddingEnd: spacing.sp16,
    gap: spacing.sp8,
    alignItems: 'center',
  },
  pill: {
    height: 41,
    borderRadius: 22,
    paddingHorizontal: spacing.sp16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.greyMedium,
  },
  pillActive: {
    backgroundColor: colors.jade400,
    borderColor: colors.jade400,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  pillTextActive: {
    color: lightColors.surface,
  },
});
