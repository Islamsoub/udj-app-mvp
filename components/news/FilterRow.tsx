import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, fz, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';

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
            <PressBox
              key={f}
              tier="tint"
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onFilterChange(f)}
              hitSlop={8}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {t(FILTER_I18N[f])}
              </Text>
            </PressBox>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    height: 52,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  content: {
    paddingStart: spacing.sp16,
    paddingEnd: spacing.sp16,
    gap: spacing.sp8,
    alignItems: 'center',
  },
  pill: {
    height: 36,
    borderRadius: radius.rFull,
    paddingHorizontal: spacing.sp16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hair,
  },
  pillActive: {
    backgroundColor: colors.jade400,
    borderColor: colors.jade400,
  },
  pillText: {
    fontSize: fz(14),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  pillTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
});
