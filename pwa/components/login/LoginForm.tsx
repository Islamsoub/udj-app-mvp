'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth-client';
import { useI18n } from '@/lib/i18n';
import { ErrorCard } from './ErrorCard';
import { OfflineDataSwitch } from './OfflineDataSwitch';
import { deadlineOf, toLoginError, type LoginError } from './LoginError';
import { EyeIcon, EyeOffIcon } from './icons';
import { useCountdown } from './useCountdown';
import styles from './login.module.css';

export function LoginForm() {
  const { t } = useI18n();
  const router = useRouter();

  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const online = useOnline();

  // The lockout and the rate limit own the button until their deadline passes;
  // everything else leaves it alone.
  const waitSeconds = useCountdown(deadlineOf(error));

  // Only 401 tints the fields. A lockout is about the account and a rate limit
  // about the network — neither is a reason to mark what the student typed as
  // wrong, and on 429 the credentials may well be perfect.
  const fieldsInvalid = error?.kind === 'credentials';

  const waiting = waitSeconds > 0;
  const disabled = submitting || waiting || !online;

  // The two countdowns look and read differently, so the kind has to reach both
  // the button's style and its label. A lockout is about this account and shows
  // a red m:ss timer; a rate limit is about the network and shows a neutral
  // "Réessayer dans {n} s".
  const locked = waiting && error?.kind === 'locked';

  // §5 "Disabled" — opacity 0.5 — is only the plain unavailable case. Loading
  // and the countdowns are their own states with their own specified styling.
  const blocked = !online && !submitting && !waiting;

  // One-shot pulse when a countdown hands the button back (§9).
  const [pulsing, setPulsing] = useState(false);

  /**
   * Clears the error as soon as either field is edited — but not while a
   * countdown is running.
   *
   * A stale "wrong password" card has to go the moment the student starts
   * fixing it. A lockout or rate-limit card is different: the student cannot
   * fix it by typing, and removing the explanation while the button stays
   * disabled and counting leaves them with a dead control and no reason for it.
   * Those two clear themselves when their timer reaches zero.
   */
  const clearTransientError = () => {
    setError((current) => (deadlineOf(current) === null ? null : current));
  };

  // Self-clearing: when the countdown expires the card goes with the disable.
  //
  // This is also the moment the button becomes usable again, which §9 asks to
  // be signalled with a brief pulse. Setting it here rather than watching
  // `disabled` means it can only fire after a countdown actually ran — it
  // cannot go off on mount, or when the network comes back.
  useEffect(() => {
    if (error !== null && deadlineOf(error) !== null && waitSeconds === 0) {
      setError(null);
      setPulsing(true);
    }
  }, [error, waitSeconds]);

  // Removing the class is what makes the animation re-runnable; left on, the
  // button would pulse once and never again.
  useEffect(() => {
    if (!pulsing) return;
    const id = window.setTimeout(() => setPulsing(false), PULSE_MS);
    return () => window.clearTimeout(id);
  }, [pulsing]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    if (!studentId.trim()) return;
    if (!password) return;

    setSubmitting(true);
    setError(null);

    try {
      await login(studentId.trim(), password);
      // The token is already in memory, held by lib/auth-token. Nothing is
      // persisted here and there is no guard to satisfy yet.
      router.push('/');
    } catch (err) {
      setError(toLoginError(err));
      setSubmitting(false);
    }
  }

  return (
    <form className={styles.body} onSubmit={handleSubmit} noValidate>
      {error !== null && <ErrorCard error={error} />}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="student-id">
          {t('login.student_id_label')}
        </label>
        <input
          id="student-id"
          name="studentId"
          type="text"
          inputMode="text"
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          className={`${styles.input} ${styles.inputId} ${fieldsInvalid ? styles.inputError : ''}`}
          placeholder={t('login.student_id_placeholder')}
          value={studentId}
          aria-invalid={fieldsInvalid}
          onChange={(e) => {
            setStudentId(e.target.value);
            clearTransientError();
          }}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">
          {t('login.password_label')}
        </label>
        <div className={styles.passwordWrap}>
          <input
            id="password"
            name="password"
            type={passwordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            className={`${styles.input} ${styles.inputPassword} ${
              fieldsInvalid ? styles.inputError : ''
            }`}
            placeholder={t('login.password_placeholder')}
            value={password}
            aria-invalid={fieldsInvalid}
            onChange={(e) => {
              setPassword(e.target.value);
              clearTransientError();
            }}
          />
          {/*
            The toggle occupies a fixed 44x44 slot that exists in both states, so
            swapping the glyph cannot nudge the input — the field reserves the
            space with padding-inline-end whether the icon is an eye or not.
          */}
          <button
            type="button"
            className={styles.eyeButton}
            onClick={() => setPasswordVisible((v) => !v)}
            aria-label={passwordVisible ? t('login.hide_password') : t('login.show_password')}
            aria-pressed={passwordVisible}
          >
            {passwordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      <OfflineDataSwitch />

      <div className={styles.forgotRow}>
        {/*
          There is no password-reset endpoint, so this opens nothing. It stays
          visible because its absence reads as "you have no way out"; what it
          reveals is where to physically go. The copy names no faculty: at login
          we do not know which one the student belongs to.
        */}
        <button
          type="button"
          className={styles.linkButton}
          onClick={() => setForgotOpen((open) => !open)}
          aria-expanded={forgotOpen}
        >
          {t('login.forgot_password')}
        </button>
      </div>

      {forgotOpen && (
        <p className={styles.forgotHelp} role="status" aria-live="polite">
          {t('login.forgot_password_help')}
        </p>
      )}

      <button
        type="submit"
        className={[
          styles.submit,
          waiting ? (locked ? styles.submitLocked : styles.submitWaiting) : '',
          blocked ? styles.submitBlocked : '',
          pulsing ? styles.submitPulse : '',
        ]
          .filter(Boolean)
          .join(' ')}
        disabled={disabled}
      >
        <SubmitLabel
          submitting={submitting}
          waitSeconds={waitSeconds}
          locked={locked}
          online={online}
          t={t}
        />
      </button>
    </form>
  );
}

/**
 * The button's contents, in priority order.
 *
 * The button's own box never changes size — full width, fixed height — so
 * whatever goes in here can be swapped without shifting a single pixel of the
 * card. That is the spec's "lock the width" requirement, met structurally
 * rather than by measuring the label and pinning a value.
 */
function SubmitLabel({
  submitting,
  waitSeconds,
  locked,
  online,
  t,
}: {
  submitting: boolean;
  waitSeconds: number;
  locked: boolean;
  online: boolean;
  t: ReturnType<typeof useI18n>['t'];
}) {
  if (submitting) {
    return (
      <>
        <span className={styles.spinner} aria-hidden="true" />
        {/* The spinner is decorative; the state still has to be announced. */}
        <span className={styles.srOnly}>{t('login.submitting')}</span>
      </>
    );
  }

  if (waitSeconds > 0) {
    // Both run on DM Mono with tabular figures, so digits do not jitter as they
    // tick. What differs is the form, and it is not cosmetic:
    //
    //   Lockout (§9) — a live mono timer, m:ss. The wait is five minutes, and
    //   "Réessayer dans 300 s" is not a number anyone reads as time.
    //   Rate limit (additions spec) — "Réessayer dans {n} s". The wait is tens
    //   of seconds and the sentence is quoted verbatim there.
    return (
      <span className={styles.countdown}>
        {locked ? formatTimer(waitSeconds) : t('login.retry_in', { seconds: waitSeconds })}
      </span>
    );
  }

  if (!online) return <>{t('login.submit_offline')}</>;

  return <>{t('login.submit')}</>;
}

/**
 * Seconds as m:ss — the lockout timer's form per §9.
 *
 * No translated string: the output is digits and a colon, identical in French
 * and Arabic. Latin digits in both, which is what `.countdown`'s mono face
 * already enforces and what the design system requires of every number.
 *
 * The lockout's own explanation lives in the error card above the button, which
 * is announced, so the bare timer is not the only thing a screen reader gets.
 */
function formatTimer(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Matches --dur-base, the pulse animation's length in login.module.css. */
const PULSE_MS = 250;

/**
 * Live connectivity.
 *
 * Starts optimistic: `navigator` does not exist while rendering on the server,
 * and assuming offline would flash "Connexion requise" at every student who is
 * perfectly online. The effect corrects it on mount, before paint.
 *
 * navigator.onLine only reports whether the device has *a* network, not whether
 * the backend is reachable — a captive portal still reads as online. It is the
 * right signal for disabling the button, and 502/504 covers the rest.
 */
function useOnline(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();

    window.addEventListener('online', sync);
    window.addEventListener('offline', sync);
    return () => {
      window.removeEventListener('online', sync);
      window.removeEventListener('offline', sync);
    };
  }, []);

  return online;
}
