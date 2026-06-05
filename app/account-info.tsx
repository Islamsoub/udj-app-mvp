import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { elevation, fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { useAuthStore } from '@/stores/authStore';
import { localName } from '@/utils/i18nName';

// ─── Info row ─────────────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
  isLast?: boolean;
  infoStyles: ReturnType<typeof makeInfoStyles>;
}

function InfoRow({
  label,
  value,
  mono = false,
  valueColor,
  isLast = false,
  infoStyles,
}: InfoRowProps) {
  return (
    <View style={[infoStyles.row, !isLast && infoStyles.rowBorder]}>
      <Text style={infoStyles.label} numberOfLines={1}>
        {label}
      </Text>
      <Text
        style={[
          infoStyles.value,
          mono && infoStyles.valueMono,
          valueColor ? { color: valueColor } : undefined,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

const makeInfoStyles = (colors: Palette) => StyleSheet.create({
  row: {
    minHeight: 52,
    paddingHorizontal: spacing.sp16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
  },
  label: {
    flex: 1,
    fontSize: 15.5,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  value: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    marginStart: spacing.sp8,
  },
  valueMono: {
    fontFamily: fonts.mono,
  },
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AccountInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const infoStyles = useMemo(() => makeInfoStyles(colors), [colors]);
  const student = useAuthStore((s) => s.student);

  const fullName = student ? `${student.firstName} ${student.lastName}` : '—';
  const studentId = student?.studentIdDisplay ?? '—';
  const email = student?.email ?? '—';
  const filiere = student?.programme ? localName(student.programme, lang) || '—' : '—';
  const niveau = student?.programme.level ?? '—';
  const status = student?.status ?? '—';

  const now = new Date();
  const startYear = now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();
  const academicYear = `${startYear}-${startYear + 1}`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SettingsHeader
        topInset={insets.top}
        onBack={() => router.back()}
        title={t('settings.account.title')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar section ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar} />
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.studentId}>{studentId}</Text>
        </View>

        {/* ── Personal info ── */}
        <Text style={styles.sectionHeader}>{t('settings.account.section_personal')}</Text>
        <View style={[styles.sectionCard, elevation.card]}>
          <InfoRow
            label={t('settings.account.row_name')}
            value={fullName}
            infoStyles={infoStyles}
          />
          <InfoRow
            label={t('settings.account.row_student_id')}
            value={studentId}
            mono
            infoStyles={infoStyles}
          />
          <InfoRow
            label={t('settings.account.row_email')}
            value={email}
            isLast
            infoStyles={infoStyles}
          />
        </View>

        {/* ── Academic info ── */}
        <Text style={styles.sectionHeader}>{t('settings.account.section_academic')}</Text>
        <View style={[styles.sectionCard, elevation.card]}>
          <InfoRow
            label={t('settings.account.row_filiere')}
            value={filiere}
            infoStyles={infoStyles}
          />
          <InfoRow
            label={t('settings.account.row_niveau')}
            value={niveau}
            infoStyles={infoStyles}
          />
          <InfoRow
            label={t('settings.account.row_academic_year')}
            value={academicYear}
            mono
            infoStyles={infoStyles}
          />
          <InfoRow
            label={t('settings.account.row_status')}
            value={status}
            valueColor={colors.jade600}
            isLast
            infoStyles={infoStyles}
          />
        </View>

        {/* ── Security ── */}
        <Text style={styles.sectionHeader}>{t('settings.account.section_security')}</Text>
        <View style={[styles.sectionCard, elevation.card]}>
          <InfoRow
            label={t('settings.account.row_last_login')}
            value={t('settings.account.value_last_login')}
            mono
            infoStyles={infoStyles}
          />
          <InfoRow
            label={t('settings.account.row_device')}
            value={t('settings.account.value_device')}
            isLast
            infoStyles={infoStyles}
          />
        </View>

        <View style={{ height: Math.max(spacing.sp32, insets.bottom + 16) }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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

  avatarSection: {
    alignItems: 'center',
    marginTop: spacing.sp24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.scheduleBorder,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp12,
  },
  studentId: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.mono,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sp4,
  },

  sectionHeader: {
    marginTop: 22,
    marginBottom: 9,
    marginHorizontal: spacing.sp20,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.rXl,
    marginHorizontal: spacing.sp16,
    marginBottom: spacing.sp8,
    overflow: 'hidden',
  },
});
