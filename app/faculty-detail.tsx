import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, StatusBar, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { useAuthStore } from '@/stores/authStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface DetailRowProps {
  icon?: IoniconName;
  label: string;
  value: string;
  onPress?: () => void;
  isLast?: boolean;
  multiline?: boolean;
  rowStyles: ReturnType<typeof makeRowStyles>;
  colors: Palette;
}

function DetailRow({
  icon,
  label,
  value,
  onPress,
  isLast = false,
  multiline = false,
  rowStyles,
  colors,
}: DetailRowProps) {
  const content = (
    <>
      {icon ? (
        <Ionicons
          name={icon}
          size={20}
          color={colors.greyMedium}
          style={rowStyles.icon}
        />
      ) : null}
      <View style={rowStyles.textCol}>
        <Text style={rowStyles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text
          style={rowStyles.value}
          numberOfLines={multiline ? 4 : 2}
        >
          {value}
        </Text>
      </View>
      {onPress ? (
        <Ionicons name="chevron-forward" size={16} color={colors.greyMedium} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          rowStyles.row,
          !isLast && rowStyles.rowBorder,
          pressed && { backgroundColor: withAlpha(colors.textPrimary, 0.06) },
        ]}
        onPress={onPress}
        hitSlop={4}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[rowStyles.row, !isLast && rowStyles.rowBorder]}>{content}</View>
  );
}

const makeRowStyles = (colors: Palette) => StyleSheet.create({
  row: {
    minHeight: 64,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  icon: {
    marginEnd: spacing.sp12,
  },
  textCol: {
    flex: 1,
    gap: spacing.sp4,
  },
  label: {
    fontSize: fz(12),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  value: {
    fontSize: fz(14),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
});

export default function FacultyDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const rowStyles = useMemo(() => makeRowStyles(colors), [colors]);
  const params = useLocalSearchParams<{ id?: string }>();
  const student = useAuthStore((s) => s.student);

  const isAr = i18n.language === 'ar';
  const faculty = student?.faculty;

  const matches = !params.id || (faculty && faculty.id === params.id);
  const name = matches && faculty ? (isAr ? faculty.nameAr : faculty.nameFr) : '—';
  const code = matches && faculty ? faculty.code : '—';
  const email = matches && faculty?.email ? faculty.email : '';
  const phone = matches && faculty?.phone ? faculty.phone : '';
  const address = matches && faculty?.address ? faculty.address : '—';
  const hours = matches && faculty?.hours ? faculty.hours : '—';

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <SettingsHeader
        topInset={insets.top}
        onBack={() => router.back()}
        title={t('faculty_detail.title')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <DetailRow
            icon="business-outline"
            label={t('faculty_detail.row_name')}
            value={name}
            rowStyles={rowStyles}
            colors={colors}
          />
          <DetailRow
            icon="pricetag-outline"
            label={t('faculty_detail.row_code')}
            value={code}
            rowStyles={rowStyles}
            colors={colors}
          />
          <DetailRow
            icon="mail-outline"
            label={t('faculty_detail.row_email')}
            value={email || '—'}
            onPress={email ? () => Linking.openURL(`mailto:${email}`) : undefined}
            rowStyles={rowStyles}
            colors={colors}
          />
          <DetailRow
            icon="call-outline"
            label={t('faculty_detail.row_phone')}
            value={phone || '—'}
            onPress={phone ? () => Linking.openURL(`tel:${phone}`) : undefined}
            rowStyles={rowStyles}
            colors={colors}
          />
          <DetailRow
            icon="location-outline"
            label={t('faculty_detail.row_address')}
            value={address}
            multiline
            rowStyles={rowStyles}
            colors={colors}
          />
          <DetailRow
            icon="time-outline"
            label={t('faculty_detail.row_hours')}
            value={hours}
            multiline
            isLast
            rowStyles={rowStyles}
            colors={colors}
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
