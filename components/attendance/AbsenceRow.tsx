import React, { useMemo } from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';
import { localName } from '@/utils/i18nName';
import { DateTile, type JustificationStatus } from './DateTile';
import { StatusBadge } from './StatusBadge';

export interface AbsenceRecord {
  id: string;
  status: 'ABSENT' | 'LATE';
  sessionDate: string; // ISO date
  subjectName: string;
  subjectNameAr?: string;
  justificationStatus: null | 'PENDING' | 'APPROVED' | 'REJECTED';
  justificationUrl?: string | null;
  justificationNote?: string | null;
}

/** Map the record's raw justification status to the DateTile/StatusBadge status. */
export function deriveStatus(justificationStatus: AbsenceRecord['justificationStatus']): JustificationStatus {
  switch (justificationStatus) {
    case 'PENDING':
      return 'pending';
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    case null:
    default:
      return 'unjustified';
  }
}

interface AbsenceRowProps {
  record: AbsenceRecord;
  onPress: (record: AbsenceRecord) => void;
}

export function AbsenceRow({ record, onPress }: AbsenceRowProps) {
  const { i18n } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const status = deriveStatus(record.justificationStatus);
  // Only actionable states (unjustified / rejected) reveal the chevron affordance
  const showChevron = status === 'unjustified' || status === 'rejected';
  const name = localName({ nameFr: record.subjectName, nameAr: record.subjectNameAr }, i18n.language);

  return (
    <PressBox tier="tint" style={styles.row} onPress={() => onPress(record)} accessibilityRole="button">
      <DateTile date={record.sessionDate} status={status} />

      <View style={styles.middle}>
        <Text style={styles.subject} numberOfLines={1}>
          {name}
        </Text>
        {!!record.justificationNote && (
          <View style={styles.noteRow}>
            <Ionicons name="document-text-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.note} numberOfLines={1}>
              {record.justificationNote}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.right}>
        <StatusBadge status={status} />
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textTertiary}
            style={I18nManager.isRTL ? styles.chevronRtl : undefined}
          />
        )}
      </View>
    </PressBox>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 13,
  },
  middle: {
    flex: 1,
  },
  subject: {
    fontSize: fz(14),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  note: {
    flex: 1,
    fontSize: fz(11.5),
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  chevronRtl: {
    transform: [{ scaleX: -1 }],
  },
});
