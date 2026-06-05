import React, { useMemo } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { radius, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_GAP = 8;

interface SettingsPopoverProps {
  visible: boolean;
  onClose: () => void;
  anchorY: number;
  anchorHeight: number;
  children: React.ReactNode;
}

export function SettingsPopover({
  visible,
  onClose,
  anchorY,
  anchorHeight,
  children,
}: SettingsPopoverProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isBelow = anchorY < SCREEN_HEIGHT * (2 / 3);
  const cardPositionStyle = isBelow
    ? { top: anchorY + anchorHeight + CARD_GAP }
    : { bottom: SCREEN_HEIGHT - anchorY + CARD_GAP };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.cardContainer, cardPositionStyle]}>
          {/* outer: shadow/elevation; inner: clip to rounded corners */}
          <View style={styles.cardShadow}>
            <View style={styles.cardClip}>{children}</View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: withAlpha(colors.black, 0.2),
    },
    cardContainer: {
      position: 'absolute',
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    cardShadow: {
      width: '85%',
      borderRadius: radius.rLg,
      backgroundColor: colors.surface,
      elevation: 8,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    cardClip: {
      borderRadius: radius.rLg,
      overflow: 'hidden',
    },
  });
