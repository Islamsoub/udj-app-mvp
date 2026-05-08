import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ListRenderItemInfo,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { SettingsSheet } from './SettingsSheet';

// ─── Constants ────────────────────────────────────────────────────────────────

const REPS = 5;
const ITEM_H = 44;
const VISIBLE_ITEMS = 5;
const VISIBLE_H = VISIBLE_ITEMS * ITEM_H; // 220
const MID_REP = 2;
const SEPARATOR_W = 40;

// ─── Data ─────────────────────────────────────────────────────────────────────

type WheelItem = { hour: number; flatIndex: number };

const WHEEL_DATA: WheelItem[] = Array.from({ length: REPS * 24 }, (_, i) => ({
  hour: i % 24,
  flatIndex: i,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatHour(h: number): string {
  return `${String(h).padStart(2, '0')}:00`;
}

// Scroll offset that centers the given hour in the middle repetition.
// With paddingTop = 2*ITEM_H, scrollY = flatIndex * ITEM_H centers that item.
function centerOffset(hour: number): number {
  return (MID_REP * 24 + hour) * ITEM_H;
}

// ─── TimeWheel ────────────────────────────────────────────────────────────────

interface TimeWheelProps {
  selectedHour: number;
  onHourChange: (h: number) => void;
  visible: boolean;
}

function TimeWheel({ selectedHour, onHourChange, visible }: TimeWheelProps) {
  const listRef = useRef<FlatList<WheelItem>>(null);
  const [centerIdx, setCenterIdx] = useState(MID_REP * 24 + selectedHour);

  // Ref trick: always captures the latest selectedHour after parent re-renders.
  // Needed because TimeWheel's effect runs before the parent's effect that resets
  // selectedHour to the prop value, so we read from ref inside the setTimeout.
  const selectedHourRef = useRef(selectedHour);
  selectedHourRef.current = selectedHour;

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      const hour = selectedHourRef.current;
      setCenterIdx(MID_REP * 24 + hour);
      listRef.current?.scrollToOffset({ offset: centerOffset(hour), animated: false });
    }, 150);
    return () => clearTimeout(t);
  }, [visible]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_H);
    setCenterIdx(idx);
  }, []);

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_H);
    const hour = ((idx % 24) + 24) % 24;
    setCenterIdx(idx);
    onHourChange(hour);
  }

  function handleItemPress(flatIndex: number) {
    setCenterIdx(flatIndex);
    onHourChange(flatIndex % 24);
    listRef.current?.scrollToOffset({ offset: flatIndex * ITEM_H, animated: true });
  }

  function renderItem({ item }: ListRenderItemInfo<WheelItem>) {
    const d = Math.abs(item.flatIndex - centerIdx);
    const dynStyle =
      d === 0 ? styles.itemCenter : d === 1 ? styles.itemNear : styles.itemFar;
    return (
      <Pressable style={styles.item} onPress={() => handleItemPress(item.flatIndex)}>
        <Text style={[styles.itemBase, dynStyle]}>{formatHour(item.hour)}</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.wheelOuter}>
      <View style={styles.highlightBar} pointerEvents="none" />
      <FlatList
        ref={listRef}
        data={WHEEL_DATA}
        keyExtractor={(item) => item.flatIndex.toString()}
        renderItem={renderItem}
        extraData={centerIdx}
        getItemLayout={(_, index) => ({
          length: ITEM_H,
          offset: ITEM_H * 2 + index * ITEM_H,
          index,
        })}
        snapToInterval={ITEM_H}
        snapToAlignment="center"
        decelerationRate={0.92}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        contentOffset={{ x: 0, y: centerOffset(selectedHour) }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleScrollEnd}
      />
    </View>
  );
}

// ─── QuietHoursPicker ─────────────────────────────────────────────────────────

interface QuietHoursPickerProps {
  visible: boolean;
  onClose: () => void;
  startHour: number;
  endHour: number;
  onSave: (start: number, end: number) => void;
}

export function QuietHoursPicker({
  visible,
  onClose,
  startHour,
  endHour,
  onSave,
}: QuietHoursPickerProps) {
  const { t } = useTranslation();
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
        <TimeWheel
          selectedHour={selectedStart}
          onHourChange={setSelectedStart}
          visible={visible}
        />
        <View style={styles.separatorContainer}>
          <Text style={styles.separator}>–</Text>
        </View>
        <TimeWheel
          selectedHour={selectedEnd}
          onHourChange={setSelectedEnd}
          visible={visible}
        />
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Labels above each wheel
  labelsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sp20,
    marginTop: spacing.sp16,
    marginBottom: spacing.sp8,
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
    width: SEPARATOR_W,
  },

  // Row containing both wheels and the separator
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp20,
  },

  // Wheel outer container — hosts the absolute highlight bar + FlatList
  wheelOuter: {
    flex: 1,
    height: VISIBLE_H,
  },
  highlightBar: {
    position: 'absolute',
    top: VISIBLE_H / 2 - ITEM_H / 2, // 88 — vertically centered in the 220px window
    left: 0,
    right: 0,
    height: ITEM_H,
    borderRadius: radius.rMd,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  list: {
    flex: 1,
  },
  // paddingTop/Bottom = 2×ITEM_H so the first and last hours can scroll to center
  listContent: {
    paddingTop: ITEM_H * 2,
    paddingBottom: ITEM_H * 2,
  },
  item: {
    height: ITEM_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBase: {
    fontFamily: fonts.mono,
  },
  itemCenter: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    opacity: 1,
  },
  itemNear: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSecondary,
    opacity: 0.5,
  },
  itemFar: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
    opacity: 0.25,
  },

  // Separator between the two wheels
  separatorContainer: {
    width: SEPARATOR_W,
    height: VISIBLE_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    fontSize: 24,
    fontFamily: fonts.mono,
    color: colors.greyMedium,
  },

  // Action buttons
  buttons: {
    flexDirection: 'row',
    gap: spacing.sp8,
    paddingHorizontal: spacing.sp20,
    marginTop: spacing.sp20,
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: radius.rLg,
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
