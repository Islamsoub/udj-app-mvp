import React from 'react';
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
import { colors, fonts, spacing } from '@/constants/theme';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { useAuthStore } from '@/stores/authStore';

// ─── Info row ─────────────────────────────────────────────────────────────────

interface InfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
  isLast?: boolean;
}

function InfoRow({
  label,
  value,
  mono = false,
  valueColor,
  isLast = false,
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

const infoStyles = StyleSheet.create({
  row: {
    height: 54,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp16,
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
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  value: {
    fontSize: 14,
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
  const { t } = useTranslation();
  const student = useAuthStore((s) => s.student);

  const fullName = student ? `${student.firstName} ${student.lastName}` : '—';
  const studentId = student?.studentIdDisplay ?? '—';
  const email = student?.email ?? '—';
  const filiere = student?.programme.nameFr ?? '—';
  const niveau = student?.programme.level ?? '—';
  const status = student?.status ?? '—';

  const now = new Date();
  const startYear = now.getMonth() < 7 ? now.getFullYear() - 1 : now.getFullYear();
  const academicYear = `${startYear}-${startYear + 1}`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />
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
        <InfoRow
          label={t('settings.account.row_name')}
          value={fullName}
        />
        <InfoRow
          label={t('settings.account.row_student_id')}
          value={studentId}
          mono
        />
        <InfoRow
          label={t('settings.account.row_email')}
          value={email}
          isLast
        />

        {/* ── Academic info ── */}
        <Text style={styles.sectionHeader}>{t('settings.account.section_academic')}</Text>
        <InfoRow
          label={t('settings.account.row_filiere')}
          value={filiere}
        />
        <InfoRow
          label={t('settings.account.row_niveau')}
          value={niveau}
        />
        <InfoRow
          label={t('settings.account.row_academic_year')}
          value={academicYear}
          mono
        />
        <InfoRow
          label={t('settings.account.row_status')}
          value={status}
          valueColor={colors.jade600}
          isLast
        />

        {/* ── Security ── */}
        <Text style={styles.sectionHeader}>{t('settings.account.section_security')}</Text>
        <InfoRow
          label={t('settings.account.row_last_login')}
          value={t('settings.account.value_last_login')}
          mono
        />
        <InfoRow
          label={t('settings.account.row_device')}
          value={t('settings.account.value_device')}
          isLast
        />

        <View style={{ height: spacing.sp32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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

  // Avatar
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

  // Section header (mirrors settings.tsx pattern)
  sectionHeader: {
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
    backgroundColor: colors.background,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
