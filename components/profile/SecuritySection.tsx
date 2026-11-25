import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { elevation, fonts, fz, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';
import { useNetworkStore } from '@/stores/networkStore';
import { changePassword } from '@/services/auth';
import {
  checkPasswordForm,
  failureMessage,
  fieldErrorKey,
  hasErrors,
  WRONG_CURRENT_KEY,
  type PasswordErrors,
  type PasswordForm,
} from '@/utils/passwordChecks';

/**
 * "Sécurité" on the profile screen: current password, new password,
 * confirmation, "Mettre à jour". The same checks and messages as the PWA's
 * Sécurité card (utils/passwordChecks).
 *
 * On success services/auth changePassword has already stored the new token
 * pair (SecureStore + auth store), so the student stays signed in; their other
 * devices are signed out by the server. All three fields are cleared. On an
 * error the current password is cleared and the other two are kept.
 *
 * Offline: every field and the button are disabled, with "Connexion requise".
 *
 * Keyboard: the screen's scroll view is a KeyboardAwareScrollView with
 * keyboardShouldPersistTaps="handled" (CLAUDE.md, Keyboard Handling Rules), so
 * a focused field is scrolled above the keyboard and the button takes the
 * first tap; the button dismisses the keyboard first.
 *
 * Nothing here logs: the axios error carries both passwords in config.data.
 */

const EMPTY: PasswordForm = { current: '', next: '', confirm: '' };

type Outcome = { kind: 'success' } | { kind: 'error'; key: string } | { kind: 'error'; text: string };

export function SecuritySection() {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isOnline = useNetworkStore((s) => s.isOnline);

  const [form, setForm] = useState<PasswordForm>(EMPTY);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const editable = isOnline && !submitting;

  const update = (field: keyof PasswordForm) => (value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => {
      if (e[field] === undefined) return e;
      const rest = { ...e };
      delete rest[field];
      return rest;
    });
    setOutcome(null);
  };

  const onSubmit = async () => {
    Keyboard.dismiss();
    if (!editable) return;

    const found = checkPasswordForm(form);
    setErrors(found);
    setOutcome(null);
    if (hasErrors(found)) return;

    setSubmitting(true);
    try {
      await changePassword(form.current, form.next);
      setForm(EMPTY);
      setOutcome({ kind: 'success' });
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      const message = isAxiosError(err)
        ? (err.response?.data as { error?: unknown } | undefined)?.error
        : undefined;
      setForm((f) => ({ ...f, current: '' }));
      setOutcome({ kind: 'error', ...failureMessage(status, message) });
    } finally {
      setSubmitting(false);
    }
  };

  const wrongCurrent = outcome?.kind === 'error' && 'key' in outcome && outcome.key === WRONG_CURRENT_KEY;

  return (
    <View>
      <Text style={styles.sectionHeader} accessibilityRole="header">
        {t('profile.security.title')}
      </Text>
      <View style={[styles.card, elevation.card]}>
        {!isOnline && <Text style={styles.offlineNote}>{t('profile.security.offline')}</Text>}

        <PasswordField
          label={t('profile.security.current')}
          value={form.current}
          onChangeText={update('current')}
          autoComplete="current-password"
          textContentType="password"
          error={errors.current ? t(fieldErrorKey(errors.current)) : null}
          invalid={wrongCurrent}
          editable={editable}
        />
        <PasswordField
          label={t('profile.security.new')}
          value={form.next}
          onChangeText={update('next')}
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.next ? t(fieldErrorKey(errors.next)) : null}
          hint={t('profile.security.hint')}
          editable={editable}
        />
        <PasswordField
          label={t('profile.security.confirm')}
          value={form.confirm}
          onChangeText={update('confirm')}
          autoComplete="new-password"
          textContentType="newPassword"
          error={errors.confirm ? t(fieldErrorKey(errors.confirm)) : null}
          editable={editable}
          returnKeyType="done"
          onSubmitEditing={onSubmit}
        />

        {outcome?.kind === 'success' && (
          <Text style={styles.success} accessibilityLiveRegion="polite">
            {t('profile.security.success')}
          </Text>
        )}
        {outcome?.kind === 'error' && (
          <Text style={styles.failure} accessibilityLiveRegion="assertive">
            {'key' in outcome ? t(outcome.key) : outcome.text}
          </Text>
        )}

        <PressBox
          tier="button"
          style={[styles.button, !isOnline && styles.buttonBlocked]}
          onPress={onSubmit}
          disabled={!editable}
          accessibilityRole="button"
          accessibilityState={{ disabled: !editable, busy: submitting }}
        >
          {submitting ? (
            <ActivityIndicator size={20} color={colors.surface} />
          ) : (
            <Text style={styles.buttonText}>{t('profile.security.submit')}</Text>
          )}
        </PressBox>
      </View>
    </View>
  );
}

// ─── One password field ───────────────────────────────────────────────────────

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  textContentType: 'password' | 'newPassword';
  error: string | null;
  hint?: string;
  invalid?: boolean;
  editable: boolean;
  returnKeyType?: 'next' | 'done';
  onSubmitEditing?: () => void;
}

function PasswordField({
  label,
  value,
  onChangeText,
  autoComplete,
  textContentType,
  error,
  hint,
  invalid = false,
  editable,
  returnKeyType = 'next',
  onSubmitEditing,
}: PasswordFieldProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const showError = error !== null || invalid;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          style={[
            styles.input,
            focused && styles.inputFocused,
            showError && styles.inputError,
            !editable && styles.inputDisabled,
          ]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoComplete={autoComplete}
          textContentType={textContentType}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          editable={editable}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
        />
        <PressBox
          tier="icon"
          style={styles.eye}
          onPress={() => setVisible((v) => !v)}
          disabled={!editable}
          accessibilityRole="button"
          accessibilityLabel={visible ? t('profile.security.hide') : t('profile.security.show')}
          accessibilityState={{ selected: visible }}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textSecondary}
          />
        </PressBox>
      </View>
      {error !== null ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    // The profile screen's section header and card, so the section reads as
    // one of its own.
    sectionHeader: {
      marginTop: 22,
      marginBottom: spacing.sp8,
      marginHorizontal: spacing.sp20,
      fontSize: fz(13),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.textSecondary,
      letterSpacing: 0.3,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.rXl,
      marginHorizontal: spacing.sp16,
      padding: spacing.sp16,
    },
    offlineNote: {
      marginBottom: spacing.sp12,
      fontSize: fz(12.5),
      fontFamily: fonts.sans,
      color: colors.textSecondary,
    },

    // Fields: the login screen's input (54 high, rBtn, 1.5 border), with room
    // at the end for the show/hide toggle.
    field: {
      marginBottom: spacing.sp16,
    },
    label: {
      marginBottom: spacing.sp6,
      fontSize: fz(14),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
    input: {
      height: 54, // design constant: input height (login)
      borderRadius: radius.rBtn,
      borderWidth: 1.5,
      borderColor: colors.hair,
      backgroundColor: colors.surface,
      paddingStart: spacing.sp16,
      paddingEnd: spacing.sp48,
      fontFamily: fonts.sans,
      fontSize: fz(15),
      color: colors.textPrimary,
    },
    inputFocused: {
      borderColor: colors.jade400,
    },
    inputError: {
      backgroundColor: colors.dangerBg,
      borderColor: colors.danger,
    },
    inputDisabled: {
      backgroundColor: colors.sunken,
      color: colors.textTertiary,
    },
    // 44x44 target at the input's end edge, vertically centred on its 54.
    eye: {
      position: 'absolute',
      top: (54 - 44) / 2,
      end: spacing.sp4,
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.rMd,
    },
    fieldError: {
      marginTop: spacing.sp6,
      fontSize: fz(12.5),
      fontFamily: fonts.sans,
      color: colors.danger,
    },
    hint: {
      marginTop: spacing.sp6,
      fontSize: fz(12.5),
      fontFamily: fonts.sans,
      color: colors.textSecondary,
    },

    success: {
      marginBottom: spacing.sp12,
      fontSize: fz(13),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.jade600,
    },
    failure: {
      marginBottom: spacing.sp12,
      fontSize: fz(13),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.danger,
    },

    button: {
      height: spacing.sp48,
      borderRadius: radius.rLg,
      backgroundColor: colors.jade400,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonBlocked: {
      opacity: 0.5,
    },
    buttonText: {
      fontSize: fz(14),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.surface,
    },
  });
