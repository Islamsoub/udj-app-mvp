import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';

// Overlay colors specific to the dark-green card background
const CARD_TEXT_DIM = 'rgba(255,255,255,0.7)';
const CARD_PILL_BG = 'rgba(255,255,255,0.15)';

interface StudentCardProps {
  name: string;
  id: string;
  programme: string;
  annee: string;
  statut: string;
}

export function StudentCard({ name, id, programme, annee, statut }: StudentCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      {/* Top row: title+subtitle column left, QR box right */}
      <View style={styles.topRow}>
        <View style={styles.topLeft}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {t('profile.card.title')}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {t('profile.card.subtitle')}
          </Text>
        </View>
        <View style={styles.qrBox} />
      </View>

      {/* Middle: student name & ID */}
      <View style={styles.middleSection}>
        <Text style={styles.cardName} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.cardStudentId} numberOfLines={1}>
          {id}
        </Text>
      </View>

      {/* Bottom: info pills row */}
      <View style={styles.pillsRow}>
        <View style={[styles.pill, styles.pillLg]}>
          <Text style={styles.pillLabel}>{t('profile.card.programme')}</Text>
          <Text style={styles.pillValue} numberOfLines={1}>
            {programme}
          </Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>{t('profile.card.annee')}</Text>
          <Text style={styles.pillValue} numberOfLines={1}>
            {annee}
          </Text>
        </View>
        <View style={[styles.pill, styles.pillSm]}>
          <Text style={styles.pillLabel}>{t('profile.card.statut')}</Text>
          <Text style={styles.pillValue} numberOfLines={1}>
            {statut}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.sp16,
    height: 214,
    borderRadius: 18,
    backgroundColor: colors.jade600,
    overflow: 'hidden',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp16,
    paddingBottom: spacing.sp24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topLeft: {
    flex: 1,
    marginEnd: spacing.sp8,
  },
  qrBox: {
    width: 77,
    height: 77,
    borderRadius: radius.rMd,
    backgroundColor: colors.scheduleBorder,
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: CARD_TEXT_DIM,
  },
  middleSection: {},
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
  cardStudentId: {
    fontSize: 12,
    fontFamily: fonts.mono,
    color: CARD_TEXT_DIM,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: spacing.sp8,
  },
  pill: {
    width: 94,
    height: 32,
    borderRadius: 16,
    backgroundColor: CARD_PILL_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp8,
  },
  pillLg: {
    width: 110,
  },
  pillSm: {
    width: 84,
  },
  pillLabel: {
    fontSize: 8,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: CARD_TEXT_DIM,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    includeFontPadding: false,
  },
  pillValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
    includeFontPadding: false,
  },
});
