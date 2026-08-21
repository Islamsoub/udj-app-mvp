import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, fz, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';

// A filter chip value: the two special sentinels 'all' / 'saved', or a category
// slug supplied dynamically by the parent (fetched from GET /news/categories).
export type FilterKey = 'all' | 'saved' | (string & {});

// A dynamic category chip. `label` is already resolved to the active language by
// the parent, so FilterRow renders it verbatim.
export interface FilterCategory {
  slug: string;
  label: string;
}

interface FilterRowProps {
  categories: FilterCategory[];
  activeFilter: FilterKey;
  onFilterChange: (f: FilterKey) => void;
}

export function FilterRow({ categories, activeFilter, onFilterChange }: FilterRowProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();

  // "Tout" first, one chip per dynamic category, "Enregistrés" last.
  const chips = useMemo(
    () => [
      { key: 'all', label: t('news.filter.all') },
      ...categories.map((c) => ({ key: c.slug, label: c.label })),
      { key: 'saved', label: t('news.filter.saved') },
    ],
    [categories, t],
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {chips.map((chip) => {
          const isActive = chip.key === activeFilter;
          return (
            <PressBox
              key={chip.key}
              tier="tint"
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => onFilterChange(chip.key)}
              hitSlop={8}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {chip.label}
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
    // surface, not white: jade400 brightens to #2ECC96 in dark mode, where
    // white text drops to ~1.9:1. surface inverts with the theme and stays legible.
    color: colors.surface,
    fontWeight: '700',
  },
});
