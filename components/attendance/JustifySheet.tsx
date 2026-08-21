import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
  Keyboard,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { fonts, fz, radius, spacing, scrimColor, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';
import { localName } from '@/utils/i18nName';
import { formatLocalDate } from '@/utils/dateFormat';
import { DateTile } from './DateTile';
import { NoteField } from './NoteField';
import { deriveStatus, type AbsenceRecord } from './AbsenceRow';

interface JustifySheetProps {
  visible: boolean;
  record: AbsenceRecord | null;
  onClose: () => void;
  onSubmit: (recordId: string, imageUri: string, mimeType: string, note?: string) => Promise<void>;
}

/** Basename of a URL, used as a friendly filename in view mode. */
function urlFileName(url: string): string {
  const last = url.split('?')[0].split('/').pop();
  return last || 'justificatif';
}

export function JustifySheet({ visible, record, onClose, onSubmit }: JustifySheetProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [note, setNote] = useState('');
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileMime, setFileMime] = useState('image/jpeg');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const status = record?.justificationStatus ?? null;
  // Edit by default for unjustified / rejected; view for pending / approved.
  const baseEdit = status == null || status === 'REJECTED';

  // Reset per-record state whenever the sheet (re)opens or the record changes.
  useEffect(() => {
    if (visible && record) {
      setNote(record.justificationNote ?? '');
      setFileUri(null);
      setFileName('');
      setFileSize(0);
      setFileMime('image/jpeg');
      setUploading(false);
      setEditMode(status == null || status === 'REJECTED');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, record?.id]);

  const handleClose = useCallback(() => {
    if (!uploading) onClose();
  }, [uploading, onClose]);

  const applyAsset = useCallback((asset: ImagePicker.ImagePickerAsset, fallback: string) => {
    setFileUri(asset.uri);
    setFileMime(asset.mimeType ?? 'image/jpeg');
    setFileName(asset.fileName ?? fallback);
    setFileSize(asset.fileSize ?? 0);
  }, []);

  const handleCamera = useCallback(async () => {
    const { status: perm } = await ImagePicker.requestCameraPermissionsAsync();
    if (perm !== 'granted') {
      Alert.alert(t('attendance.camera_denied'));
      return;
    }
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.7,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        applyAsset(result.assets[0], 'photo.jpg');
      }
    } catch {
      // Camera unavailable / already in use — leave the sheet as it was so the
      // user can simply tap again or pick from the gallery instead.
    }
  }, [t, applyAsset]);

  const handleGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        quality: 0.7,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        applyAsset(result.assets[0], 'image.jpg');
      }
    } catch {
      // Picker failed to open — non-fatal, the user can retry.
    }
  }, [applyAsset]);

  const removeFile = useCallback(() => {
    setFileUri(null);
    setFileName('');
    setFileSize(0);
    setFileMime('image/jpeg');
  }, []);

  const handleSubmit = useCallback(async () => {
    Keyboard.dismiss();
    if (!record || !fileUri) return;
    setUploading(true);
    try {
      await onSubmit(record.id, fileUri, fileMime, note.trim() || undefined);
      onClose();
    } catch (err) {
      Alert.alert(t('attendance.upload_error'), err instanceof Error ? err.message : undefined);
    } finally {
      setUploading(false);
    }
  }, [record, fileUri, fileMime, note, onSubmit, onClose, t]);

  const openDocument = useCallback(() => {
    if (record?.justificationUrl) Linking.openURL(record.justificationUrl);
  }, [record?.justificationUrl]);

  if (!record) return null;

  const tileStatus = deriveStatus(record.justificationStatus);
  const subjectName = localName(
    { nameFr: record.subjectName, nameAr: record.subjectNameAr },
    i18n.language,
  );
  const metaDate = formatLocalDate(new Date(record.sessionDate));
  const showRejectBanner = editMode && status === 'REJECTED';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
          {/* Grab handle */}
          <View style={styles.handle} />

          <Text style={styles.title}>
            {editMode ? t('presence.justify_title') : t('presence.justify_view_title')}
          </Text>

          {/* Context card */}
          <View style={styles.contextCard}>
            <DateTile date={record.sessionDate} status={tileStatus} size={42} />
            <View style={styles.contextText}>
              <Text style={styles.contextSubject} numberOfLines={1}>
                {subjectName}
              </Text>
              <Text style={styles.contextMeta} numberOfLines={1}>
                {metaDate}
              </Text>
            </View>
          </View>

          {/* Reject banner */}
          {showRejectBanner && (
            <View style={styles.rejectBanner}>
              <Ionicons name="warning" size={13} color={colors.danger} />
              <Text style={styles.rejectTitle}>{t('presence.justify_rejected')}</Text>
            </View>
          )}

          {editMode ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.scrollBody}
            >
              <NoteField value={note} onChange={setNote} />

              <Text style={styles.fileLabel}>{t('presence.justify_file_label')}</Text>

              {fileUri == null ? (
                <View style={styles.tilesRow}>
                  <PressBox
                    tier="tint"
                    radius={radius.rMd}
                    onPress={handleCamera}
                    style={styles.pickTile}
                    accessibilityRole="button"
                  >
                    <View style={styles.pickIcon}>
                      <Ionicons name="camera-outline" size={20} color={colors.jadeText} />
                    </View>
                    <Text style={styles.pickLabel}>{t('presence.justify_camera')}</Text>
                  </PressBox>

                  <PressBox
                    tier="tint"
                    radius={radius.rMd}
                    onPress={handleGallery}
                    style={styles.pickTile}
                    accessibilityRole="button"
                  >
                    <View style={styles.pickIcon}>
                      <Ionicons name="images-outline" size={20} color={colors.jadeText} />
                    </View>
                    <Text style={styles.pickLabel}>{t('presence.justify_gallery')}</Text>
                  </PressBox>
                </View>
              ) : (
                <View style={styles.preview}>
                  <View style={styles.previewThumb}>
                    <Ionicons name="document-text-outline" size={20} color={colors.jadeText} />
                  </View>
                  <View style={styles.previewText}>
                    <Text style={styles.previewName} numberOfLines={1}>
                      {fileName}
                    </Text>
                    <Text style={styles.previewSub} numberOfLines={1}>
                      {t('presence.justify_added')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={removeFile}
                    hitSlop={9}
                    disabled={uploading}
                    style={styles.removeBtn}
                    accessibilityRole="button"
                  >
                    <Ionicons name="close" size={15} color={colors.jadeText} />
                  </Pressable>
                </View>
              )}
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
              {!!record.justificationNote && (
                <View style={styles.noteReadonly}>
                  <Text style={styles.noteCaption}>{t('presence.justify_note_sent')}</Text>
                  <Text style={styles.noteBody}>{record.justificationNote}</Text>
                </View>
              )}

              {!!record.justificationUrl && (
                <View style={styles.docView}>
                  <View style={styles.docThumb}>
                    <Ionicons name="document-text-outline" size={19} color={colors.jadeText} />
                  </View>
                  <View style={styles.previewText}>
                    <Text style={styles.docName} numberOfLines={1}>
                      {urlFileName(record.justificationUrl)}
                    </Text>
                    <Text style={styles.previewSub} numberOfLines={1}>
                      {t('presence.justify_sent')}
                    </Text>
                  </View>
                  <Pressable onPress={openDocument} hitSlop={8} accessibilityRole="link">
                    <Text style={styles.docLink}>{t('presence.justify_view_doc')}</Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            {editMode ? (
              <PressBox
                tier="button"
                radius={radius.rBtn}
                onPress={handleSubmit}
                disabled={uploading || fileUri == null}
                style={[styles.primaryBtn, fileUri == null && styles.btnDisabled]}
                accessibilityRole="button"
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {status === 'REJECTED' || status === 'PENDING'
                      ? t('presence.justify_resend')
                      : t('presence.justify_send')}
                  </Text>
                )}
              </PressBox>
            ) : (
              <>
                {status === 'PENDING' && (
                  <PressBox
                    tier="button"
                    radius={radius.rBtn}
                    onPress={() => setEditMode(true)}
                    style={styles.outlineBtn}
                    accessibilityRole="button"
                  >
                    <Text style={styles.outlineBtnText}>{t('presence.justify_replace')}</Text>
                  </PressBox>
                )}
                <PressBox
                  tier="button"
                  radius={radius.rBtn}
                  onPress={handleClose}
                  style={styles.outlineBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.outlineBtnText}>{t('presence.justify_close')}</Text>
                </PressBox>
              </>
            )}
          </View>
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
      maxHeight: '88%',
    },
    handle: {
      alignSelf: 'center',
      width: 38,
      height: 5,
      borderRadius: radius.rFull,
      backgroundColor: colors.surface2,
      marginTop: 10,
    },
    title: {
      fontSize: fz(17),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
      marginTop: 14,
      marginHorizontal: spacing.sp20,
    },
    contextCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      backgroundColor: colors.surface2,
      borderRadius: radius.rMd,
      paddingVertical: 11,
      paddingHorizontal: 12,
      marginHorizontal: spacing.sp20,
      marginTop: 14,
    },
    contextText: {
      flex: 1,
    },
    contextSubject: {
      fontSize: fz(13.5),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
    contextMeta: {
      fontSize: fz(11.5),
      fontFamily: fonts.sans,
      color: colors.textSecondary,
      marginTop: 2,
    },
    rejectBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      backgroundColor: colors.dangerBg,
      borderRadius: 11,
      paddingVertical: 11,
      paddingHorizontal: 12,
      marginTop: 12,
      marginHorizontal: spacing.sp20,
    },
    rejectTitle: {
      fontSize: fz(12),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.danger,
    },
    scrollBody: {
      flexGrow: 0,
    },
    fileLabel: {
      fontSize: fz(12.5),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
      marginTop: 18,
      marginHorizontal: spacing.sp20,
    },
    tilesRow: {
      flexDirection: 'row',
      gap: 10,
      marginHorizontal: spacing.sp20,
      marginTop: spacing.sp8,
    },
    pickTile: {
      flex: 1,
      alignItems: 'center',
      gap: 7,
      backgroundColor: colors.surface,
      borderRadius: radius.rMd,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingVertical: 14,
      paddingHorizontal: spacing.sp8,
    },
    pickIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.rSm,
      backgroundColor: colors.jadeFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickLabel: {
      fontSize: fz(12.5),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
    preview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.jadeFaint,
      borderRadius: radius.rMd,
      borderWidth: 1,
      borderColor: colors.jade400,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginHorizontal: spacing.sp20,
      marginTop: spacing.sp8,
    },
    previewThumb: {
      width: 42,
      height: 42,
      borderRadius: radius.rSm,
      backgroundColor: withAlpha(colors.jade400, 0.12),
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewText: {
      flex: 1,
    },
    previewName: {
      fontSize: fz(12.5),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
    previewSub: {
      fontSize: fz(11),
      fontFamily: fonts.sans,
      color: colors.textSecondary,
      marginTop: 2,
    },
    removeBtn: {
      width: 26,
      height: 26,
      borderRadius: radius.rFull,
      backgroundColor: colors.jadeFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    noteReadonly: {
      backgroundColor: colors.background,
      borderRadius: radius.rMd,
      paddingVertical: 12,
      paddingHorizontal: 13,
      marginTop: spacing.sp8,
      marginHorizontal: spacing.sp20,
    },
    noteCaption: {
      fontSize: fz(10.5),
      fontWeight: '700',
      fontFamily: fonts.sans,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: colors.textTertiary,
    },
    noteBody: {
      fontSize: fz(13),
      fontFamily: fonts.sans,
      color: colors.textPrimary,
      marginTop: 5,
    },
    docView: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.surface2,
      borderRadius: radius.rMd,
      paddingVertical: 11,
      paddingHorizontal: 12,
      marginHorizontal: spacing.sp20,
      marginTop: 10,
    },
    docThumb: {
      width: 40,
      height: 40,
      borderRadius: radius.rSm,
      backgroundColor: colors.jadeFaint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    docName: {
      fontSize: fz(12.5),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
    docLink: {
      fontSize: fz(12),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.jade400,
    },
    footer: {
      flexDirection: 'row',
      gap: 10,
      padding: spacing.sp20,
    },
    primaryBtn: {
      flex: 1,
      height: 50,
      borderRadius: radius.rBtn,
      backgroundColor: colors.jade400,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnDisabled: {
      opacity: 0.5,
    },
    primaryBtnText: {
      fontSize: fz(15),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.surface,
    },
    outlineBtn: {
      flex: 1,
      height: 50,
      borderRadius: radius.rBtn,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: colors.jade400,
      alignItems: 'center',
      justifyContent: 'center',
    },
    outlineBtnText: {
      fontSize: fz(15),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.jade400,
    },
  });
