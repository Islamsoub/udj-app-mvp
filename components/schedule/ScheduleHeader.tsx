import React, { useMemo } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MenuSchIcon from '@/assets/icons/menu_sch_icon.svg';
import { fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { DayStrip } from './DayStrip';

interface ScheduleHeaderProps {
  topInset: number;
  selectedDayIndex: number;
  onDaySelect: (index: number) => void;
  weekOffset: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function ScheduleHeader({
  topInset,
  selectedDayIndex,
  onDaySelect,
  weekOffset,
  onPrevWeek,
  onNextWeek,
  onToday,
}: ScheduleHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  // Date of the currently-selected day in the currently-displayed week.
  const selectedDate = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + weekOffset * 7);
    const selected = new Date(startOfWeek);
    selected.setDate(startOfWeek.getDate() + selectedDayIndex);
    return selected;
  }, [selectedDayIndex, weekOffset]);

  const isToday = weekOffset === 0 && selectedDayIndex === new Date().getDay();
  const dateLabel = `${DAYS_FR[selectedDate.getDay()]} ${selectedDate.getDate()} ${MONTHS_FR[selectedDate.getMonth()]}`;
  const subtitle = isToday ? `${t('schedule.today')} – ${dateLabel}` : dateLabel;

  return (
    <View style={styles.header}>
      {/* Title row — Y=14 from content top per Figma */}
      <View style={[styles.titleRow, { paddingTop: topInset + 14 }]}>
        <Text style={styles.title}>{t('schedule.title')}</Text>
        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.iconCircle, pressed && { backgroundColor: colors.textSecondary + '26', borderRadius: 999 }]}
            onPress={() => Alert.alert('', 'Recherche bientôt disponible')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.iconCircle, pressed && { backgroundColor: colors.textSecondary + '26', borderRadius: 999 }]}
            onPress={() => router.push('/settings')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MenuSchIcon width={20} height={20} />
          </Pressable>
        </View>
      </View>

      {/* Day strip — has its own top/bottom border per Figma */}
      <DayStrip
        selectedIndex={selectedDayIndex}
        onSelect={onDaySelect}
        weekOffset={weekOffset}
        onPrevWeek={onPrevWeek}
        onNextWeek={onNextWeek}
        onToday={onToday}
      />

      {/* Selected-day subtitle — Y=120 from content top (16px gap after strip end at Y=104) */}
      <Text style={styles.subtitle}>{subtitle}</Text>

      {/* Header bottom border */}
      <View style={styles.divider} />
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
    paddingBottom: spacing.sp16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sp8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 30,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.scheduleBorder,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.jade400,
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp16,
    paddingBottom: 9,
  },
});
