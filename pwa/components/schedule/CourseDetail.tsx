'use client';

import type { ReactNode } from 'react';
import type { ScheduleEntry } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import { courseType, typeClass, typeLabelKey } from './course-type';
import { ClockIcon, CodeIcon, ProfessorIcon, RoomIcon } from './icons';
import styles from './schedule.module.css';

/**
 * The body of the course detail panel — everything inside SlidePanel's chrome.
 *
 * NO NOTE FIELD, DELIBERATELY. §9 describes saving a note here, with the success
 * flash from §5 and the panel auto-closing 500ms later. There is no notes
 * endpoint on the backend: the native app keeps them in its own SQLite table
 * (`course_notes`), and this PWA has no local database and no caching layer. The
 * only ways to ship the control would be to invent a store the app does not
 * have, or to render a Save button that discards what the student typed — and a
 * note silently lost is worse than a note never offered. So the feature is left
 * out and reported as spec-without-backend.
 */
export function CourseDetail({ entry, dayLabel }: { entry: ScheduleEntry; dayLabel: string }) {
  const { t, lang } = useI18n();

  const type = courseType(entry.type);
  const subject = lang === 'ar' ? entry.subject.nameAr : entry.subject.nameFr;

  return (
    <div className={styles.detail}>
      <h3 className={styles.detailSubject}>{subject}</h3>

      {/*
        The type, as a coloured pill AND as a word — §10 forbids colour as the
        only signal, and this is the one place there is room for the long form
        ("Travaux pratiques") rather than the three-letter code the grid shows.
      */}
      <p className={styles.detailType}>
        <span className={`${styles.typePill} ${typeClass(type)}`}>{t(typeLabelKey(type))}</span>
      </p>

      <dl className={styles.detailList}>
        <DetailRow icon={<ClockIcon className={styles.detailIcon} />} label={t('schedule.detail.when')}>
          {/* Day name from the locale files; the clock times on the Latin face,
              like every other figure in the product. */}
          <span>{dayLabel}</span>{' '}
          <span className="num">
            {entry.startTime} – {entry.endTime}
          </span>
        </DetailRow>

        <DetailRow icon={<RoomIcon className={styles.detailIcon} />} label={t('schedule.detail.room')}>
          {/* A room is a code — "Amphi A1", "Labo Info 2" — so it stays Latin. */}
          <span className="num">{entry.room}</span>
        </DetailRow>

        <DetailRow
          icon={<ProfessorIcon className={styles.detailIcon} />}
          label={t('schedule.detail.professor')}
        >
          {entry.professorName}
        </DetailRow>

        <DetailRow icon={<CodeIcon className={styles.detailIcon} />} label={t('schedule.detail.code')}>
          <span className="num">{entry.subject.code}</span>
          <span className={styles.detailMuted}>
            {' · '}
            {t('schedule.detail.coefficient')} <span className="num">{entry.subject.coefficient}</span>
          </span>
        </DetailRow>
      </dl>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.detailRow}>
      <dt className={styles.detailLabel}>
        {icon}
        {label}
      </dt>
      <dd className={styles.detailValue}>{children}</dd>
    </div>
  );
}

/** The panel's title is the subject, so the heading and the chrome agree. */
export function courseTitle(entry: ScheduleEntry, lang: 'fr' | 'ar'): string {
  return lang === 'ar' ? entry.subject.nameAr : entry.subject.nameFr;
}

/** Day names live in the locale files, indexed by the stored weekday. */
export const DAY_KEYS: Record<number, TranslationKey> = {
  0: 'schedule.days.sunday',
  1: 'schedule.days.monday',
  2: 'schedule.days.tuesday',
  3: 'schedule.days.wednesday',
  4: 'schedule.days.thursday',
};

/** The short forms the week grid's column headers use. */
export const DAY_SHORT_KEYS: Record<number, TranslationKey> = {
  0: 'schedule.days_short.sunday',
  1: 'schedule.days_short.monday',
  2: 'schedule.days_short.tuesday',
  3: 'schedule.days_short.wednesday',
  4: 'schedule.days_short.thursday',
};
