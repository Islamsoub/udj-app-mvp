'use client';

import { Interpolated } from '@/components/dashboard/Interpolated';
import type { AttendanceSubject } from '@/lib/api-types';
import { fmtLtr, fmtPercent } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { ClockIcon } from './icons';
import { sortSubjects, subjectLevel, subjectRate, type SubjectLevel } from './model';
import styles from './attendance.module.css';

/** Level -> the prototype's .lvl-* (text) and .bg-lvl-* (dot, bar) classes. */
const TEXT_CLASS: Record<SubjectLevel, string> = {
  ok: styles.lvlOk,
  near: styles.lvlNear,
  below: styles.lvlBelow,
};

const FILL_CLASS: Record<SubjectLevel, string> = {
  ok: styles.bgLvlOk,
  near: styles.bgLvlNear,
  below: styles.bgLvlBelow,
};

/**
 * "Par matière", worst subject first (model.ts, sortSubjects).
 *
 * The prototype's two forms of one list, both rendered and switched by the
 * stylesheet at Design's 640px breakpoint (.data-table is hidden under it):
 *   - 640 and wider: the table — Matière, Présences "attended/total", Taux
 *     coloured by level, Absences restantes; figures right-aligned in mono.
 *   - phones: .attend-subject rows — level dot, name, "x/y séances", the
 *     percentage, the bar, then "N absences possibles" or "Limite atteinte".
 * The hidden one is display:none, so assistive tech reads only the visible one.
 *
 * The level is the SERVER's band (subjectLevel); the percentage is never
 * compared with the threshold. The threshold is stated once, in words, under
 * the title, and drawn as the tick on every phone bar.
 *
 * NO FIGURE IS NOT 0%: a subject without a rate (subjectRate null) says
 * "Aucune séance enregistrée" where the rate would be, draws no bar, and takes
 * no level colour.
 *
 * `absencesLeft: null` (the term is over) renders as a dash in the table and as
 * nothing in the phone row, never "0" (lib/api-types.ts).
 */
export function SubjectBreakdown({
  subjects,
  threshold,
}: {
  subjects: AttendanceSubject[];
  /** From the response; displayed only — each row's level comes from its band. */
  threshold: number;
}) {
  const { t, plural, lang } = useI18n();

  const ordered = sortSubjects(subjects, lang);
  const noFigure = t('attendance.empty.none.title');

  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>{t('attendance.subjects.title')}</h2>

      {/* The legend for the tick on the phone bars, and the threshold the
          table's colours are measured against. The value is the server's. */}
      <p className={styles.sectionNote}>
        <span className={styles.thresholdKey} aria-hidden="true" />
        <Interpolated
          template={t('attendance.subjects.note')}
          values={{ threshold: fmtPercent(threshold) }}
        />
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th scope="col">{t('attendance.subjects.col_subject')}</th>
              <th scope="col" className={styles.numCell}>
                {t('attendance.subjects.col_present')}
              </th>
              <th scope="col" className={styles.numCell}>
                {t('attendance.subjects.col_rate')}
              </th>
              <th scope="col" className={styles.numCell}>
                {t('attendance.subjects.col_left')}
              </th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((entry) => {
              const name = lang === 'ar' ? entry.subject.nameAr : entry.subject.nameFr;
              const rate = subjectRate(entry);
              const level = subjectLevel(entry);

              return (
                <tr key={entry.subject.id}>
                  <th scope="row" className={styles.tableSubject}>
                    {name}
                    {/* The code is an identifier, so it stays Latin in Arabic. */}
                    <span className={`${styles.subjectCode} num`}>{entry.subject.code}</span>
                  </th>
                  <td className={`${styles.numCell} mono`}>
                    {fmtLtr(`${entry.present}/${entry.total}`)}
                  </td>
                  {rate === null ? (
                    <td className={`${styles.numCell} ${styles.noFigure}`}>{noFigure}</td>
                  ) : (
                    <td
                      className={`${styles.numCell} ${level === null ? '' : TEXT_CLASS[level]} mono`}
                    >
                      {fmtPercent(rate)}
                    </td>
                  )}
                  <td className={`${styles.numCell} mono`}>
                    {entry.absencesLeft === null ? (
                      <span aria-hidden="true">—</span>
                    ) : (
                      entry.absencesLeft
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className={styles.subjectList}>
        {ordered.map((entry) => {
          const name = lang === 'ar' ? entry.subject.nameAr : entry.subject.nameFr;
          const rate = subjectRate(entry);
          const level = subjectLevel(entry);

          return (
            <li key={entry.subject.id} className={styles.attendSubject}>
              <div className={styles.asTop}>
                <span
                  className={`${styles.asDot} ${level === null ? styles.bgLvlNone : FILL_CLASS[level]}`}
                  aria-hidden="true"
                />
                <div className={styles.asMain}>
                  <p className={styles.asName}>
                    {name}
                    <span className={`${styles.subjectCode} num`}>{entry.subject.code}</span>
                  </p>
                  <p className={styles.asSessions}>
                    <Interpolated
                      template={t('attendance.subjects.sessions')}
                      values={{ count: fmtLtr(`${entry.present}/${entry.total}`) }}
                    />
                  </p>
                </div>
                {rate !== null && level !== null && (
                  <p className={`${styles.asPct} ${TEXT_CLASS[level]} mono`}>{fmtPercent(rate)}</p>
                )}
              </div>

              {rate === null || level === null ? (
                <p className={`${styles.asProj} ${styles.noFigure}`}>{noFigure}</p>
              ) : (
                <>
                  {/* The bar carries the reading for sighted users; the role
                      carries the same number to assistive tech. */}
                  <div
                    className={styles.asBar}
                    role="progressbar"
                    aria-valuenow={Math.round(rate)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={t('attendance.subjects.bar_label', { subject: name })}
                    style={
                      {
                        '--bar-value': `${Math.max(0, Math.min(100, rate))}%`,
                        '--bar-threshold': `${threshold}%`,
                      } as React.CSSProperties
                    }
                  >
                    <span className={`${styles.asFill} ${FILL_CLASS[level]}`} />
                    <span className={styles.barThreshold} aria-hidden="true" />
                  </div>

                  <Projection entry={entry} level={level} plural={plural} t={t} />
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * The prototype's .as-proj line: "Limite atteinte" for a subject below the
 * limit, otherwise how many absences remain. Nothing once the term is over and
 * the subject is not below (`absencesLeft: null` is not 0).
 */
function Projection({
  entry,
  level,
  plural,
  t,
}: {
  entry: AttendanceSubject;
  level: SubjectLevel;
  plural: ReturnType<typeof useI18n>['plural'];
  t: ReturnType<typeof useI18n>['t'];
}) {
  if (level !== 'below' && entry.absencesLeft === null) return null;

  return (
    <p className={`${styles.asProj} ${TEXT_CLASS[level]}`}>
      <ClockIcon className={styles.asProjIcon} />
      <span>
        {level === 'below' || entry.absencesLeft === null ? (
          t('attendance.subjects.limit_reached')
        ) : (
          <Interpolated
            template={plural('attendance.subjects.left', entry.absencesLeft)}
            values={{ n: entry.absencesLeft }}
          />
        )}
      </span>
    </p>
  );
}
