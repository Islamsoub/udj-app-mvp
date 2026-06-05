import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { radius, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface SettingsPopoverProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function SettingsPopover({ visible, onClose, children }: SettingsPopoverProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {/* outer: shadow/elevation; inner: clip to rounded corners */}
        <View style={styles.cardShadow}>
          <View style={styles.cardClip}>{children}</View>
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
      justifyContent: 'center',
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
