import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { fonts, fz, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { useAuthStore } from '@/stores/authStore';

interface DetailRowProps {
  label: string;
  value: string;
  mono?: boolean;
  isLast?: boolean;
  rowStyles: ReturnType<typeof makeRowStyles>;
}

function DetailRow({ label, value, mono = false, isLast = false, rowStyles }: DetailRowProps) {
  return (
    <View style={[rowStyles.row, !isLast && rowStyles.rowBorder]}>
      <Text style={rowStyles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[rowStyles.value, mono && rowStyles.valueMono]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const makeRowStyles = (colors: Palette) => StyleSheet.create({
  row: {
    minHeight: 56,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  label: {
    flex: 1,
    fontSize: fz(14),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  value: {
    flex: 1,
    fontSize: fz(14),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    marginStart: spacing.sp8,
    textAlign: 'right',
  },
  valueMono: {
    fontFamily: fonts.mono,
  },
});

export default function ProgrammeDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rowStyles = useMemo(() => makeRowStyles(colors), [colors]);
  const params = useLocalSearchParams<{ id?: string }>();
  const student = useAuthStore((s) => s.student);

  const isAr = i18n.language === 'ar';
  const programme = student?.programme;
  const faculty = student?.faculty;

  const matches = !params.id || (programme && programme.id === params.id);
  const name = matches && programme
    ? (isAr ? programme.nameAr : programme.nameFr)
    : '—';
  const code = matches && programme ? programme.code : '—';
  const level = matches && programme ? programme.level : '—';
  const duration =
    matches && programme && programme.durationSemesters != null
      ? t('programme_detail.row_duration_value', { n: programme.durationSemesters })
      : '—';
  const totalCredits =
    matches && programme && programme.totalCredits != null
      ? String(programme.totalCredits)
      : '—';
  const facultyName = matches && faculty ? (isAr ? faculty.nameAr : faculty.nameFr) : '—';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <SettingsHeader
        topInset={insets.top}
        onBack={() => router.back()}
        title={t('programme_detail.title')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <DetailRow label={t('programme_detail.row_name')} value={name} rowStyles={rowStyles} />
          <DetailRow label={t('programme_detail.row_code')} value={code} mono rowStyles={rowStyles} />
          <DetailRow label={t('programme_detail.row_level')} value={level} rowStyles={rowStyles} />
          <DetailRow label={t('programme_detail.row_duration')} value={duration} rowStyles={rowStyles} />
          <DetailRow label={t('programme_detail.row_total_credits')} value={totalCredits} mono rowStyles={rowStyles} />
          <DetailRow
            label={t('programme_detail.row_faculty')}
            value={facultyName}
            isLast
            rowStyles={rowStyles}
          />
        </View>

        <View style={{ height: Math.max(spacing.sp32, insets.bottom + 16) }} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    marginTop: spacing.sp16,
  },
});
