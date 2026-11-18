'use client';

import type { ReactNode } from 'react';
import type { ScheduleEntry } from '@/lib/api-types';
import { fmtRange } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import { subjectStyle, type SubjectSwatch } from '@/lib/subject-colors';
import { CourseNotes } from './CourseNotes';
import { courseType, typeLabelKey } from './course-type';
import { ClockIcon, CodeIcon, ProfessorIcon, RoomIcon } from './icons';
import styles from './schedule.module.css';

/**
 * The body of the course detail panel — everything inside SlidePanel's chrome.
 *
 * The personal notes sit under the details (CourseNotes). The panel does NOT
 * auto-close after a save, unlike §9's sketch: a student often adds a second
 * note, and the new one is shown at the top of the list as the confirmation.
 */
export function CourseDetail({
  entry,
  dayLabel,
  swatch,
}: {
  entry: ScheduleEntry;
  dayLabel: string;
  /** The subject's colour, the same one its block and day row carry. */
  swatch: SubjectSwatch;
}) {
  const { t } = useI18n();

  const type = courseType(entry.type);

  /*
   * No subject heading here: the panel's own title is the subject (courseTitle,
   * below), and naming it twice in one panel was noise.
   */
  return (
    <div className={styles.detail}>
      {/*
        The type, as a pill in the subject's colour AND as a word — §10 forbids colour as the
        only signal, and this is the one place there is room for the long form
        ("Travaux pratiques") rather than the three-letter code the grid shows.
      */}
      <p className={styles.detailType}>
        <span className={`${styles.typePill} subject-color`} style={subjectStyle(swatch)}>
          {t(typeLabelKey(type))}
        </span>
      </p>

      <dl className={styles.detailList}>
        <DetailRow icon={<ClockIcon className={styles.detailIcon} />} label={t('schedule.detail.when')}>
          {/* Day name from the locale files; the clock times on the Latin face,
              like every other figure in the product. */}
          <span>{dayLabel}</span>{' '}
          <span className="num">{fmtRange(entry.startTime, entry.endTime)}</span>
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

      {/* Keyed on the class, so another class opened in the same panel starts
          from its own list and an empty field. */}
      <CourseNotes
        key={`${entry.subject.code}:${entry.dayOfWeek}`}
        subjectCode={entry.subject.code}
        dayOfWeek={entry.dayOfWeek}
      />
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
