'use client';

import type { ReactNode } from 'react';
import { useStudent } from '@/components/shell/StudentContext';
import type { MeResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { levelKeyFor } from '@/lib/student';
import { Interpolated } from './Interpolated';
import styles from './dashboard.module.css';

/**
 * The dashboard's welcome block (app.css:165-168): "Bonjour, {firstName}" with
 * the name in jade, then the programme and the semester.
 *
 * It is the page's only <h1>. The topbar's title is a label that shows "Accueil"
 * (see PageTitle), so the dashboard no longer repeats that word as a heading.
 *
 * Reads the shell's /student/me — the same response the topbar initials come
 * from, so the two cannot name different students.
 */
export function Welcome() {
  const { t } = useI18n();
  const { meState } = useStudent();

  if (meState.phase === 'loading') {
    /*
     * Same two boxes, same font sizes, so nothing below moves when the name
     * arrives. The heading is still a heading, with the page's name in it for
     * a screen reader; only the shimmer is drawn.
     */
    return (
      <div className={styles.welcome}>
        <h1 className={styles.welcomeTitle}>
          <span className={styles.srOnly}>{t('dashboard.heading')}</span>
          <span className={`${styles.skeleton} ${styles.welcomeSkeletonTitle}`} aria-hidden="true" />
        </h1>
        <p className={styles.welcomeSubtitle} aria-hidden="true">
          <span className={`${styles.skeleton} ${styles.welcomeSkeletonSubtitle}`} />
        </p>
      </div>
    );
  }

  if (meState.phase !== 'ready') {
    /*
     * No record: a greeting without a name rather than an error box. The name is
     * a courtesy, not information the student came for, and the cards below
     * carry their own error and offline states. The topbar has fallen back to
     * its placeholder glyph for the same reason.
     */
    return (
      <div className={styles.welcome}>
        <h1 className={styles.welcomeTitle}>{t('dashboard.welcome.greeting_anonymous')}</h1>
      </div>
    );
  }

  const me = meState.data;

  return (
    <div className={styles.welcome}>
      <h1 className={styles.welcomeTitle}>
        <Interpolated
          template={t('dashboard.welcome.greeting')}
          values={{ name: me.firstName }}
          /*
           * The name is bidi content: a Latin name inside an Arabic sentence. The
           * <bdi> isolates it, so "مرحباً، Amina" keeps the comma beside the
           * greeting and the name reads in its own direction. Not .num — a name
           * is not a figure and keeps the language's font.
           */
          renderValue={(_, value) => <bdi className={styles.welcomeName}>{value}</bdi>}
        />
      </h1>
      <p className={styles.welcomeSubtitle}>
        <ProgrammeLine me={me} />
      </p>
    </div>
  );
}

/** "Licence Informatique · Semestre 4", the shape of dashboard.html:82. */
function ProgrammeLine({ me }: { me: MeResponse }) {
  const { t, lang } = useI18n();
  const levelKey = levelKeyFor(me.programme.level);
  const programme = lang === 'ar' ? me.programme.nameAr : me.programme.nameFr;

  const values: Record<string, ReactNode> = { programme, semester: me.currentSemester };
  if (levelKey) values.level = t(levelKey);

  return (
    <Interpolated
      // An unknown level is dropped rather than shown as profile.level.unknown's
      // "—", which reads as a stray dash at the start of a sentence.
      template={t(levelKey ? 'dashboard.welcome.programme' : 'dashboard.welcome.programme_no_level')}
      values={values}
      // Only the semester is a figure; the level and the programme are words.
      renderValue={(name, value) => (name === 'semester' ? <span className="num">{value}</span> : value)}
    />
  );
}
