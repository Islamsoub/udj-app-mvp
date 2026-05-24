import React, { useState, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  imageUri: string;
  subjectName: string;
  absenceDate: string;
}

export function JustificationConfirmSheet({
  visible,
  onClose,
  onConfirm,
  imageUri,
  subjectName,
  absenceDate,
}: Props) {
  const { t, i18n } = useTranslation();
  const { colors } = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [uploading, setUploading] = useState(false);

  const formattedDate = useMemo(() => {
    if (!absenceDate) return '';
    const locale = i18n.language === 'ar' ? 'ar' : 'fr-FR';
    return new Date(absenceDate).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
    });
  }, [absenceDate, i18n.language]);

  const handleClose = useCallback(() => {
    if (!uploading) onClose();
  }, [uploading, onClose]);

  const handleSend = useCallback(async () => {
    setUploading(true);
    try {
      await onConfirm();
    } catch {
      Alert.alert(t('attendance.upload_error'));
    } finally {
      setUploading(false);
    }
  }, [onConfirm, t]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={styles.sheet}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Image preview */}
          {imageUri !== '' && (
            <Image
              source={{ uri: imageUri }}
              style={styles.preview}
              resizeMode="cover"
            />
          )}

          {/* Info row */}
          <Text style={styles.infoText}>
            {subjectName} — {formattedDate}
          </Text>

          {/* Send button */}
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              pressed && !uploading && { backgroundColor: colors.jade600 },
            ]}
            onPress={handleSend}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text style={styles.sendBtnText}>
                {t('attendance.confirm_send')}
              </Text>
            )}
          </Pressable>

          {/* Cancel button */}
          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && { backgroundColor: colors.jade400 + '14' },
            ]}
            onPress={handleClose}
            disabled={uploading}
          >
            <Text style={styles.cancelBtnText}>{t('common.cancel')}</Text>
          </Pressable>

          {/* Safe area bottom padding */}
          <View style={{ height: insets.bottom }} />
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopStartRadius: radius.r2xl,
      borderTopEndRadius: radius.r2xl,
      paddingHorizontal: spacing.sp16,
      paddingBottom: spacing.sp16,
    },
    handle: {
      alignSelf: 'center',
      width: 49,
      height: 9,
      borderRadius: 8,
      backgroundColor: colors.border,
      marginTop: spacing.sp12,
      marginBottom: spacing.sp16,
    },
    preview: {
      width: '100%',
      height: 200,
      borderRadius: radius.rLg,
    },
    infoText: {
      fontSize: 14,
      fontFamily: fonts.sans,
      fontWeight: '400',
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.sp12,
      marginBottom: spacing.sp16,
    },
    sendBtn: {
      height: 56,
      borderRadius: radius.rLg,
      backgroundColor: colors.jade400,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendBtnText: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.surface,
    },
    cancelBtn: {
      height: 56,
      borderRadius: radius.rLg,
      borderWidth: 1,
      borderColor: colors.jade400,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sp8,
    },
    cancelBtnText: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.jade400,
    },
  });
