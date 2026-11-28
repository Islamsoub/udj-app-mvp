'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { useI18n } from '@/lib/i18n';
import { fmtLtr } from '@/lib/bidi';
import { ApiError } from '@/lib/api-client';
import { tokenFromHash, verifyCardCode, type CardVerdict } from '@/lib/card-client';
import { LanguageChip } from '@/components/login/LanguageChip';
import styles from './verify.module.css';

type State =
  | { phase: 'idle' }
  | { phase: 'checking' }
  | { phase: 'done'; verdict: CardVerdict }
  | { phase: 'error'; tooMany: boolean; code: string };

const TZ = 'Africa/Djibouti';

/**
 * The public card check. Reads the token from the link's "#t=", asks the
 * server, and shows the answer the way a guard needs it: one big verdict, then
 * the photo to compare with the person, then name, number and programme.
 *
 * The token is removed from the address bar as soon as it is read, so it does
 * not stay in this phone's history.
 */
export function VerifyCard() {
  const { t } = useI18n();
  const [state, setState] = useState<State>({ phase: 'idle' });
  const [pasted, setPasted] = useState('');

  const check = useCallback(async (code: string) => {
    setState({ phase: 'checking' });
    try {
      setState({ phase: 'done', verdict: await verifyCardCode(code) });
    } catch (err) {
      setState({ phase: 'error', tooMany: err instanceof ApiError && err.status === 429, code });
    }
  }, []);

  useEffect(() => {
    // On load, and again whenever only the "#t=" part changes: a phone camera
    // that opens the next card's link in the tab already showing this page
    // changes the hash without reloading it.
    const read = () => {
      const token = tokenFromHash(window.location.hash);
      if (!token) return;
      window.history.replaceState(null, '', window.location.pathname);
      void check(token);
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, [check]);

  const onPaste = (e: FormEvent) => {
    e.preventDefault();
    const code = pasted.trim();
    if (!code) return;
    setPasted('');
    void check(code);
  };

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <header className={styles.head}>
          <LanguageChip />
          <h1 className={styles.heading}>{t('verify.heading')}</h1>
        </header>

        <div className={styles.body} aria-live="polite">
          {state.phase === 'checking' && <p className={styles.checking}>{t('verify.checking')}</p>}

          {state.phase === 'idle' && (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>{t('verify.no_code')}</p>
              <p className={styles.hint}>{t('verify.no_code_hint')}</p>
            </div>
          )}

          {state.phase === 'error' && (
            <div className={`${styles.verdict} ${styles.bad}`} role="alert">
              <p className={styles.verdictTitle}>{t('verify.error')}</p>
              <p className={styles.hint}>{state.tooMany ? t('verify.too_many') : t('verify.error_hint')}</p>
              {!state.tooMany && (
                <button type="button" className={styles.secondary} onClick={() => void check(state.code)}>
                  {t('verify.retry')}
                </button>
              )}
            </div>
          )}

          {state.phase === 'done' && <Verdict verdict={state.verdict} />}

          <form className={styles.paste} onSubmit={onPaste}>
            <label className={styles.label} htmlFor="card-code">
              {state.phase === 'done' ? t('verify.again') : t('verify.paste_label')}
            </label>
            <div className={styles.row}>
              <input
                id="card-code"
                className={styles.input}
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                dir="ltr"
                autoComplete="off"
                spellCheck={false}
                inputMode="url"
              />
              <button type="submit" className={styles.primary} disabled={!pasted.trim() || state.phase === 'checking'}>
                {t('verify.paste_submit')}
              </button>
            </div>
          </form>

          <p className={styles.privacy}>{t('verify.privacy')}</p>
        </div>
      </div>
    </main>
  );
}

function Verdict({ verdict }: { verdict: CardVerdict }) {
  const { t, lang } = useI18n();
  const locale = lang === 'ar' ? 'ar-u-nu-latn' : 'fr-FR';
  const time = (iso: string) =>
    new Intl.DateTimeFormat(locale, { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
  const date = (iso: string) =>
    new Intl.DateTimeFormat(locale, { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' }).format(
      new Date(iso)
    );
  const s = verdict.student;
  const tone = verdict.valid ? styles.good : verdict.reason === 'expired' ? styles.warn : styles.bad;
  const title = verdict.valid
    ? t('verify.valid')
    : verdict.reason === 'expired'
      ? t('verify.expired')
      : verdict.reason === 'inactive'
        ? t('verify.inactive')
        : t('verify.invalid');
  const hint = verdict.valid
    ? null
    : verdict.reason === 'expired'
      ? t('verify.expired_hint')
      : verdict.reason === 'inactive'
        ? t('verify.inactive_hint')
        : t('verify.invalid_hint');
  const statusLabel =
    s?.status === 'SUSPENDED' ? t('verify.status_suspended') : s?.status === 'GRADUATED' ? t('verify.status_graduated') : null;

  return (
    <>
      <div className={`${styles.verdict} ${tone}`} role="status">
        <span className={styles.mark} aria-hidden="true">
          {verdict.valid ? '✓' : verdict.reason === 'expired' ? '!' : '✕'}
        </span>
        <p className={styles.verdictTitle}>{title}</p>
        {hint && <p className={styles.hint}>{hint}</p>}
        {statusLabel && <p className={styles.status}>{statusLabel}</p>}
      </div>

      {s && (
        <div className={styles.holder}>
          <Photo url={s.photoUrl} initials={`${s.firstName[0] ?? ''}${s.lastName[0] ?? ''}`} />
          <p className={styles.name}>
            {s.firstName} {s.lastName}
          </p>
          <dl className={styles.facts}>
            <dt>{t('verify.matricule')}</dt>
            <dd className="num">{fmtLtr(s.studentIdDisplay)}</dd>
            <dt>{t('verify.programme')}</dt>
            <dd>
              {lang === 'ar' && s.programme.nameAr ? s.programme.nameAr : s.programme.nameFr} ·{' '}
              {t('verify.semester', { n: String(s.currentSemester) })}
            </dd>
            <dt>{t('verify.faculty')}</dt>
            <dd>{lang === 'ar' && s.faculty.nameAr ? s.faculty.nameAr : s.faculty.nameFr}</dd>
          </dl>
        </div>
      )}

      {s && verdict.kind && verdict.issuedAt && (
        <div className={verdict.kind === 'offline' ? styles.offlineNote : styles.meta}>
          <p>
            <strong>{verdict.kind === 'offline' ? t('verify.kind_offline') : t('verify.kind_live')}</strong> ·{' '}
            {t('verify.issued_at', { date: date(verdict.issuedAt), time: time(verdict.issuedAt) })}
          </p>
          {verdict.kind === 'offline' && <p>{t('verify.offline_hint')}</p>}
        </div>
      )}

      <p className={styles.checked}>{t('verify.checked_at', { time: time(verdict.checkedAt) })}</p>
    </>
  );
}

/** The student's photo, or their initials when there is none or it fails. */
function Photo({ url, initials }: { url: string | null; initials: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return (
      <div className={styles.initials} aria-hidden="true">
        {initials}
      </div>
    );
  }
  // A plain <img>: an external storage host, fixed-size box.
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={styles.photo} src={url} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
}
