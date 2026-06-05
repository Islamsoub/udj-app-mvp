import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import ScrollPicker from 'react-native-wheel-scrollview-picker';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SettingsSheet } from './SettingsSheet';

interface QuietHoursPickerProps {
  visible: boolean;
  onClose: () => void;
  startHour: number;
  endHour: number;
  onSave: (start: number, end: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, '0')}:00`
);

export function QuietHoursPicker({
  visible,
  onClose,
  startHour,
  endHour,
  onSave,
}: QuietHoursPickerProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedStart, setSelectedStart] = useState(startHour);
  const [selectedEnd, setSelectedEnd] = useState(endHour);

  useEffect(() => {
    if (visible) {
      setSelectedStart(startHour);
      setSelectedEnd(endHour);
    }
  }, [visible, startHour, endHour]);

  return (
    <SettingsSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.picker.quiet_hours')}
      subtitle={t('settings.picker.quiet_hours_desc')}
      height={440}
    >
      <View style={styles.labelsRow}>
        <Text style={styles.columnLabel}>{t('settings.picker.quiet_start')}</Text>
        <View style={styles.separatorSpacer} />
        <Text style={styles.columnLabel}>{t('settings.picker.quiet_end')}</Text>
      </View>

      <View style={styles.wheelsRow}>
        <View style={styles.wheelWrap}>
          <ScrollPicker
            dataSource={HOURS}
            selectedIndex={selectedStart}
            onValueChange={(_data: string | undefined, index: number) => setSelectedStart(index)}
            wrapperHeight={180}
            wrapperBackground="transparent"
            itemHeight={44}
            highlightColor={colors.hair}
            highlightBorderWidth={1}
            renderItem={(data: string, _index: number, isSelected: boolean) => (
              <Text
                style={[
                  styles.wheelItem,
                  isSelected ? styles.wheelItemSelected : styles.wheelItemUnselected,
                ]}
              >
                {data}
              </Text>
            )}
          />
        </View>

        <View style={styles.separatorWrap}>
          <Text style={styles.separator}>–</Text>
        </View>

        <View style={styles.wheelWrap}>
          <ScrollPicker
            dataSource={HOURS}
            selectedIndex={selectedEnd}
            onValueChange={(_data: string | undefined, index: number) => setSelectedEnd(index)}
            wrapperHeight={180}
            wrapperBackground="transparent"
            itemHeight={44}
            highlightColor={colors.hair}
            highlightBorderWidth={1}
            renderItem={(data: string, _index: number, isSelected: boolean) => (
              <Text
                style={[
                  styles.wheelItem,
                  isSelected ? styles.wheelItemSelected : styles.wheelItemUnselected,
                ]}
              >
                {data}
              </Text>
            )}
          />
        </View>
      </View>

      <View style={styles.buttons}>
        <Pressable style={[styles.btn, styles.btnOutline]} onPress={onClose}>
          <Text style={styles.btnOutlineText}>{t('settings.picker.cancel')}</Text>
        </Pressable>
        <Pressable
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => {
            onSave(selectedStart, selectedEnd);
            onClose();
          }}
        >
          <Text style={styles.btnPrimaryText}>{t('settings.picker.save')}</Text>
        </Pressable>
      </View>
    </SettingsSheet>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  labelsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sp20,
    marginTop: spacing.sp16,
    marginBottom: spacing.sp12,
  },
  columnLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  separatorSpacer: {
    width: 40,
  },

  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp20,
  },
  wheelWrap: {
    flex: 1,
    height: 180,
    overflow: 'hidden',
  },
  separatorWrap: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    fontSize: 24,
    fontFamily: fonts.mono,
    color: colors.greyMedium,
  },

  wheelItem: {
    fontFamily: fonts.mono,
    textAlign: 'center',
  },
  wheelItemSelected: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    opacity: 1,
  },
  wheelItemUnselected: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.greyMedium,
    opacity: 0.4,
  },

  buttons: {
    flexDirection: 'row',
    gap: spacing.sp8,
    paddingHorizontal: spacing.sp20,
    marginTop: spacing.sp20,
  },
  btn: {
    flex: 1,
    height: 50,
    borderRadius: radius.rBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  btnPrimary: {
    backgroundColor: colors.jade400,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
