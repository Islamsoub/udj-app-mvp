'use client';

import { useMemo, useState } from 'react';
import type { GradeItem } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import { CaretIcon } from './icons';
import {
  rowStatus,
  sortGrades,
  subjectName,
  visibleMark,
  type Published,
  type RowStatus,
  type Sort,
  type SortKey,
} from './model';
import { useRowFlip } from './useRowFlip';
import styles from './grades.module.css';

interface Column {
  key: SortKey;
  labelKey: TranslationKey;
  /** Latin face in both languages — codes and figures, per the design system. */
  num: boolean;
  /** Figures read better against the inline-end edge; words against the start. */
  end: boolean;
}

/**
 * The columns the screen specifies, in reading order. One list drives the header
 * cells, the body cells and the stacked cards, so the three cannot disagree
 * about what a column is called or how it is aligned.
 */
const COLUMNS: Column[] = [
  { key: 'subject', labelKey: 'grades.table.subject', num: false, end: false },
  { key: 'code', labelKey: 'grades.table.code', num: true, end: false },
  { key: 'coefficient', labelKey: 'grades.table.coefficient', num: true, end: true },
  { key: 'credits', labelKey: 'grades.table.credits', num: true, end: true },
  { key: 'cc', labelKey: 'grades.table.cc', num: true, end: true },
  { key: 'cf', labelKey: 'grades.table.cf', num: true, end: true },
  { key: 'final', labelKey: 'grades.table.final', num: true, end: true },
  { key: 'status', labelKey: 'grades.table.status', num: false, end: true },
];

const STATUS_KEYS: Record<RowStatus, TranslationKey> = {
  validated: 'grades.status.validated',
  failed: 'grades.status.failed',
  pending: 'grades.status.pending',
};

const STATUS_CLASS: Record<RowStatus, string> = {
  validated: styles.pillValidated,
  failed: styles.pillFailed,
  pending: styles.pillPending,
};

/**
 * One semester's grades: a sortable table on a cursor, stacked cards on a phone.
 *
 * BOTH RENDERINGS ARE IN THE DOM and the stylesheet shows one of them. A JS
 * breakpoint would have to guess a width before hydration and would swap layouts
 * a frame late on every resize; `display: none` is resolved by the browser
 * before first paint and hides the unused copy from assistive technology too, so
 * nothing is announced twice.
 *
 * The caller keys this component by semester, so a tab switch mounts a fresh
 * table: the sort resets with the data it described, and the FLIP measures from
 * the new rows' real positions rather than the previous semester's.
 */
export function GradesTable({
  grades,
  published,
}: {
  grades: GradeItem[];
  published: Published;
}) {
  const { t, lang } = useI18n();

  const [sort, setSort] = useState<Sort>({ key: 'subject', dir: 'asc' });

  /*
   * Sorted by subject name to begin with, rather than left in API order. The
   * backend returns whatever the database produced, which is stable for nobody:
   * the same student can get two different orderings from two requests, and "the
   * rows moved" would then be indistinguishable from "I sorted them".
   */
  const rows = useMemo(
    () => sortGrades(grades, sort, lang, published),
    [grades, sort, lang, published]
  );

  const register = useRowFlip(`${sort.key}:${sort.dir}`);

  const toggle = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  };

  /** A column's content for one subject. Shared by the table and the cards. */
  const cell = (grade: GradeItem, column: Column) => {
    switch (column.key) {
      case 'subject':
        return subjectName(grade, lang);
      case 'code':
        return grade.subject.code;
      case 'coefficient':
        return String(grade.subject.coefficient);
      case 'credits':
        return String(grade.subject.credits);
      case 'status': {
        const status = rowStatus(grade, published);
        /*
         * §5: "Status pill color never animates on its own." Nothing on the pill
         * transitions — it changes only when the underlying data does.
         */
        return (
          <span className={`${styles.pill} ${STATUS_CLASS[status]}`}>{t(STATUS_KEYS[status])}</span>
        );
      }
      default: {
        const mark = visibleMark(grade, column.key, published);
        /*
         * Not published: a word, never a 0 and never a dash. A dash in a column
         * of marks is read as a mark — an absence, a zero, a withdrawal — and
         * this screen's one unforgivable failure would be to show a student a
         * result for work that has not been marked.
         *
         * Deliberately NOT wrapped in `.num`: it is not a figure, and leaving it
         * on the body face is part of how it reads as something other than one.
         */
        return mark === null ? (
          <span className={styles.unpublished}>{t('grades.table.pending')}</span>
        ) : (
          // Two decimals, like the GPA these marks feed.
          mark.toFixed(2)
        );
      }
    }
  };

  return (
    <>
      <div className={styles.tableWrap}>
        <table className={styles.table} aria-label={t('grades.table.label')}>
          <thead>
            <tr>
              {COLUMNS.map((column) => {
                const active = sort.key === column.key;
                return (
                  <th
                    key={column.key}
                    scope="col"
                    className={column.end ? styles.thEnd : undefined}
                    /*
                     * §10: the sort state belongs on the cell, so it is announced
                     * with the column rather than buried in a button label.
                     */
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button
                      type="button"
                      className={`${styles.sortButton} ${active ? styles.sortActive : ''}`}
                      onClick={() => toggle(column.key)}
                    >
                      <span>{t(column.labelKey)}</span>
                      {/* §5: rotates 180° over --dur-fast. The rotation lives in
                          CSS so reduced motion collapses it with everything
                          else. */}
                      <CaretIcon
                        className={`${styles.caret} ${
                          active && sort.dir === 'desc' ? styles.caretUp : ''
                        }`}
                      />
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((grade) => (
              <tr key={grade.id} ref={register(`row:${grade.id}`)} className={styles.row}>
                {COLUMNS.map((column) => (
                  <td
                    key={column.key}
                    className={[
                      column.end ? styles.tdEnd : '',
                      column.key === 'subject' ? styles.tdSubject : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span className={column.num ? 'num' : undefined}>{cell(grade, column)}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/*
        Below 640px the same rows become one card per subject. A table this wide
        can only be reached on a phone by scrolling it sideways, which pushes the
        subject name off screen — the one column that says which row you are
        reading.
      */}
      <ul className={styles.cards}>
        {rows.map((grade) => {
          const status = rowStatus(grade, published);
          return (
            <li
              key={grade.id}
              ref={register(`card:${grade.id}`)}
              className={`${styles.card} ${styles.row}`}
            >
              <div className={styles.cardHead}>
                <p className={styles.cardSubject}>{subjectName(grade, lang)}</p>
                <span className={`${styles.pill} ${STATUS_CLASS[status]}`}>
                  {t(STATUS_KEYS[status])}
                </span>
              </div>

              <dl className={styles.cardGrid}>
                {COLUMNS.filter((c) => c.key !== 'subject' && c.key !== 'status').map((column) => (
                  <div key={column.key} className={styles.cardField}>
                    <dt className={styles.cardLabel}>{t(column.labelKey)}</dt>
                    <dd className={`${styles.cardValue} ${column.num ? 'num' : ''}`}>
                      {cell(grade, column)}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>

      {/* CC and CF are abbreviations a first-year student has no reason to know.
          Spelling them out once under the table is cheaper than three wider
          columns, and it is the same line in both layouts. */}
      <p className={styles.legend}>{t('grades.table.legend')}</p>
    </>
  );
}
