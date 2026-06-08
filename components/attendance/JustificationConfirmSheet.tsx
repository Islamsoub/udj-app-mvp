import React, { useState, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { fonts, radius, spacing, scrimColor, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSend: (imageUri: string, mimeType: string) => Promise<void>;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function JustificationConfirmSheet({ visible, onClose, onSend }: Props) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState('image/jpeg');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [uploading, setUploading] = useState(false);

  const resetFile = useCallback(() => {
    setFileUri(null);
    setFileName('');
    setFileSize(0);
    setFileMime('image/jpeg');
  }, []);

  const handleClose = useCallback(() => {
    if (!uploading) {
      resetFile();
      onClose();
    }
  }, [uploading, resetFile, onClose]);

  const handleChooseFile = useCallback(() => {
    Alert.alert(
      t('attendance.section_justification'),
      undefined,
      [
        {
          text: t('attendance.upload_camera'),
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert(t('attendance.camera_denied'));
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: 'images',
              quality: 0.7,
              allowsEditing: true,
            });
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              setFileUri(asset.uri);
              setFileMime(asset.mimeType ?? 'image/jpeg');
              setFileName(asset.fileName ?? 'photo.jpg');
              setFileSize(asset.fileSize ?? 0);
            }
          },
        },
        {
          text: t('attendance.upload_gallery'),
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: 'images',
              quality: 0.7,
              allowsEditing: true,
            });
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              setFileUri(asset.uri);
              setFileMime(asset.mimeType ?? 'image/jpeg');
              setFileName(asset.fileName ?? 'image.jpg');
              setFileSize(asset.fileSize ?? 0);
            }
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ],
    );
  }, [t]);

  const handleSend = useCallback(async () => {
    if (!fileUri) return;
    setUploading(true);
    try {
      await onSend(fileUri, fileMime);
      resetFile();
    } catch {
      Alert.alert(t('attendance.upload_error'));
    } finally {
      setUploading(false);
    }
  }, [fileUri, fileMime, onSend, resetFile, t]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(26, insets.bottom + 10) }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <Text style={styles.title}>{t('presence.sheet_title')}</Text>
          <Text style={styles.subtitle}>{t('presence.sheet_subtitle')}</Text>

          {/* Drop zone or file chip */}
          {fileUri == null ? (
            <View style={styles.dropZone}>
              <View style={styles.dropIconRing}>
                <Ionicons name="cloud-upload-outline" size={22} color={colors.jadeText} />
              </View>
              <Text style={styles.dropHint}>{t('presence.drop_hint')}</Text>
            </View>
          ) : (
            <View style={styles.fileChip}>
              <Ionicons name="document-outline" size={20} color={colors.textSecondary} />
              <Text style={styles.fileName} numberOfLines={1}>{fileName}</Text>
              {fileSize > 0 && (
                <Text style={styles.fileSize}>{formatFileSize(fileSize)}</Text>
              )}
              <Pressable onPress={resetFile} hitSlop={8} disabled={uploading}>
                <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
              </Pressable>
            </View>
          )}

          {/* Primary button */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && !uploading && { backgroundColor: colors.jade600 },
            ]}
            onPress={fileUri == null ? handleChooseFile : handleSend}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text style={styles.primaryBtnText}>
                {fileUri == null ? t('presence.btn_choose') : t('presence.btn_send')}
              </Text>
            )}
          </Pressable>

          {/* Cancel / close button */}
          <Pressable
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleClose}
            disabled={uploading}
          >
            <Text style={styles.cancelBtnText}>{t('presence.btn_cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    scrim: {
      flex: 1,
      backgroundColor: scrimColor,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopStartRadius: radius.r2xl,
      borderTopEndRadius: radius.r2xl,
      paddingHorizontal: spacing.sp16,
    },
    handle: {
      alignSelf: 'center',
      width: 38,
      height: 5,
      borderRadius: radius.rFull,
      backgroundColor: colors.hair,
      marginTop: spacing.sp12,
      marginBottom: spacing.sp20,
    },
    title: {
      fontSize: 17,
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: '400',
      fontFamily: fonts.sans,
      color: colors.textSecondary,
      marginTop: 4,
    },
    dropZone: {
      marginTop: 20,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: colors.hair,
      borderRadius: radius.rXl,
      backgroundColor: colors.surface2,
      paddingVertical: 26,
      paddingHorizontal: spacing.sp16,
      alignItems: 'center',
      gap: 10,
    },
    dropIconRing: {
      width: 48,
      height: 48,
      borderRadius: radius.rFull,
      backgroundColor: colors.jadeFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dropHint: {
      fontSize: 13,
      fontWeight: '400',
      fontFamily: fonts.sans,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    fileChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface2,
      borderRadius: radius.rMd,
      padding: 10,
      marginTop: 20,
    },
    fileName: {
      flex: 1,
      fontSize: 13,
      fontWeight: '500',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
    fileSize: {
      fontSize: 12,
      fontWeight: '400',
      fontFamily: fonts.sans,
      color: colors.textTertiary,
    },
    primaryBtn: {
      height: 50,
      borderRadius: radius.rBtn,
      backgroundColor: colors.jade400,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    primaryBtnText: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.surface,
    },
    cancelBtn: {
      height: 50,
      borderRadius: radius.rBtn,
      borderWidth: 1,
      borderColor: colors.hair,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 10,
    },
    cancelBtnText: {
      fontSize: 15,
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
  });
