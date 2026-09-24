'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useOnline } from '@/components/shell/useOnline';
import { updatePreferences } from '@/lib/api-client';
import type { PreferencesPayload, StudentPreferences } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import { BOOLEAN_PREFS, isValidTime, timeOptions, type TimePref } from './model';
import { Switch } from './Switch';
import styles from './profile.module.css';

type Field = keyof StudentPreferences;

type Status = { field: Field; kind: 'saved' | 'error' } | null;

/** §5's success flash: the confirmation stays up for 1200ms, then goes. */
const SAVED_FLASH_MS = 1200;

/**
 * The notification preferences — the only thing on this screen that writes.
 *
 * ── THESE ARE THE PHONE'S SETTINGS, AND THE COPY SAYS SO ─────────────────────
 *
 * The PWA sends no notifications: there is no service worker and no web push.
 * The three toggles are read by the backend's push sender
 * (backend/src/utils/push.ts) when it messages the native app, and the quiet
 * hours are read by the native app itself, against the phone's clock. So a
 * change here changes what arrives on the student's PHONE, and nothing about
 * this browser — which is what the section's intro tells them, rather than
 * letting three switches imply a feature this tab does not have.
 *
 * ── A SAVE IS SHOWN, NEVER ASSUMED ───────────────────────────────────────────
 *
 * The control moves at once, is marked busy, and the request goes out. On 200
 * the SERVER's copy of all five fields is adopted and "Enregistré" flashes
 * beside the row. On any failure the control goes back to the stored value and
 * the row says the change was not saved. A switch that shows "off" while the
 * account still says "on" is the one outcome this must not produce.
 *
 * One save at a time, for the whole section. Each PATCH returns every field,
 * so two in flight could land out of order and the older response would undo
 * the newer change on screen. Locking the section for a few hundred
 * milliseconds is cheaper than reasoning about that.
 *
 * Offline, everything is disabled with §8's "Connexion requise": a preference
 * change cannot be queued, because nothing here would replay it.
 */
export function NotificationPrefs({ initial }: { initial: StudentPreferences }) {
  const { t } = useI18n();
  const { online } = useOnline();
  const introId = useId();

  const [prefs, setPrefs] = useState<StudentPreferences>(initial);
  const [pending, setPending] = useState<PreferencesPayload>({});
  const [saving, setSaving] = useState<Field | null>(null);
  const [status, setStatus] = useState<Status>(null);

  const flashTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    },
    []
  );

  const shown: StudentPreferences = { ...prefs, ...pending };
  const locked = saving !== null || !online;

  const save = async (field: Field, patch: PreferencesPayload) => {
    if (locked) return;

    if (flashTimer.current !== null) window.clearTimeout(flashTimer.current);
    setStatus(null);
    setPending(patch);
    setSaving(field);

    try {
      const stored = await updatePreferences(patch);
      setPrefs(stored);
      setStatus({ field, kind: 'saved' });
      flashTimer.current = window.setTimeout(() => setStatus(null), SAVED_FLASH_MS);
    } catch {
      // The session-expiry case is the shell's (lib/api-client raises its
      // modal); the row only has to stop claiming a value that was not stored.
      setStatus({ field, kind: 'error' });
    } finally {
      setPending({});
      setSaving(null);
    }
  };

  const rowStatus = (field: Field) => (
    <RowStatus
      saving={saving === field}
      status={status !== null && status.field === field ? status.kind : null}
    />
  );

  return (
    <section className={styles.section} aria-labelledby={`${introId}-title`}>
      <h2 className={styles.sectionTitle} id={`${introId}-title`}>
        {t('profile.notifs.title')}
      </h2>
      <p className={styles.sectionNote} id={introId}>
        {t('profile.notifs.intro')}
      </p>

      <div className={styles.card}>
        {BOOLEAN_PREFS.map(({ key, label, hint }) => (
          <SwitchRow
            key={key}
            label={label}
            hint={hint}
            checked={shown[key]}
            busy={saving === key}
            locked={saving !== null}
            disabled={!online}
            onChange={(next) => save(key, { [key]: next })}
            status={rowStatus(key)}
          />
        ))}

        {/* Offline disables the selects; an in-flight save does not — it would
            drop focus — and `save` ignores a change made while one is running,
            which the controlled value then snaps back from. */}
        <QuietHours
          start={shown.quietHoursStart}
          end={shown.quietHoursEnd}
          disabled={!online}
          onChange={(field, value) => save(field, { [field]: value })}
          statusFor={rowStatus}
        />
      </div>

      {!online && (
        <p className={styles.offlineHint} role="status">
          {t('profile.notifs.offline')}
        </p>
      )}
    </section>
  );
}

function SwitchRow({
  label,
  hint,
  checked,
  busy,
  locked,
  disabled,
  onChange,
  status,
}: {
  label: TranslationKey;
  hint: TranslationKey;
  checked: boolean;
  busy: boolean;
  locked: boolean;
  disabled: boolean;
  onChange: (next: boolean) => void;
  status: React.ReactNode;
}) {
  const { t } = useI18n();
  const labelId = useId();
  const hintId = useId();

  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <p className={styles.rowLabel} id={labelId}>
          {t(label)}
        </p>
        <p className={styles.rowHint} id={hintId}>
          {t(hint)}
        </p>
        {status}
      </div>

      <Switch
        checked={checked}
        onChange={onChange}
        labelledBy={labelId}
        describedBy={hintId}
        busy={busy}
        locked={locked}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * Quiet hours: two <select>s of whole hours, as the native app's picker offers.
 *
 * A select rather than <input type="time">, because the time field renders in
 * the browser's locale — a 12-hour "10:00 PM" on some systems, Eastern Arabic
 * digits on others — which contradicts the "HH:MM, 24 h" the hint promises and
 * the Latin-numerals rule. A select shows exactly the string that is stored and
 * cannot produce one the backend's format-only check would let through.
 */
function QuietHours({
  start,
  end,
  disabled,
  onChange,
  statusFor,
}: {
  start: string | null;
  end: string | null;
  disabled: boolean;
  onChange: (field: TimePref, value: string) => void;
  statusFor: (field: Field) => React.ReactNode;
}) {
  const { t } = useI18n();
  const labelId = useId();
  const hintId = useId();

  const same = start !== null && end !== null && start === end;

  return (
    <div className={`${styles.row} ${styles.rowStacked}`}>
      <div className={styles.rowText}>
        <p className={styles.rowLabel} id={labelId}>
          {t('profile.quiet.title')}
        </p>
        <p className={styles.rowHint} id={hintId}>
          {t(same ? 'profile.quiet.same' : 'profile.quiet.hint')}
        </p>
      </div>

      <div className={styles.timeFields} role="group" aria-labelledby={labelId}>
        <TimeSelect
          label={t('profile.quiet.start')}
          value={start}
          disabled={disabled}
          describedBy={hintId}
          onChange={(value) => onChange('quietHoursStart', value)}
          status={statusFor('quietHoursStart')}
        />
        <TimeSelect
          label={t('profile.quiet.end')}
          value={end}
          disabled={disabled}
          describedBy={hintId}
          onChange={(value) => onChange('quietHoursEnd', value)}
          status={statusFor('quietHoursEnd')}
        />
      </div>
    </div>
  );
}

function TimeSelect({
  label,
  value,
  disabled,
  describedBy,
  onChange,
  status,
}: {
  label: string;
  value: string | null;
  disabled: boolean;
  describedBy: string;
  onChange: (value: string) => void;
  status: React.ReactNode;
}) {
  const { t } = useI18n();
  const id = useId();

  // A stored value outside the 24-hour clock is shown as unset rather than
  // offered back: it is not a time, and saving it again would keep it broken.
  const current = value !== null && isValidTime(value) ? value : '';

  return (
    <div className={styles.timeField}>
      <label className={styles.timeLabel} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        // `.num`: the times stay on the Latin face in Arabic, like every figure.
        className={`${styles.select} num`}
        value={current}
        disabled={disabled}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      >
        {current === '' && (
          <option value="" disabled>
            {t('profile.quiet.unset')}
          </option>
        )}
        {timeOptions(current === '' ? null : current).map((time) => (
          <option key={time} value={time}>
            {time}
          </option>
        ))}
      </select>
      {status}
    </div>
  );
}

/**
 * What happened to this row's last change. A live region, so a screen reader
 * hears "Enregistré" or the failure without moving focus off the control.
 */
function RowStatus({ saving, status }: { saving: boolean; status: 'saved' | 'error' | null }) {
  const { t } = useI18n();

  let text: string | null = null;
  let className = styles.rowStatus;
  if (saving) {
    text = t('profile.save.saving');
  } else if (status === 'saved') {
    text = t('profile.save.saved');
    className = `${styles.rowStatus} ${styles.rowStatusSaved}`;
  } else if (status === 'error') {
    text = t('profile.save.error');
    className = `${styles.rowStatus} ${styles.rowStatusError}`;
  }

  return (
    <p className={className} role="status" aria-live="polite">
      {text}
    </p>
  );
}
