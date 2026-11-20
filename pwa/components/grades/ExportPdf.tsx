'use client';

import { createPortal } from 'react-dom';
import { Interpolated } from '@/components/dashboard/Interpolated';
import { useStudent } from '@/components/shell/StudentContext';
import type { GradeItem, GradesResponse, MeResponse, SemesterSummary } from '@/lib/api-types';
import { fmtLtr } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { COLUMNS, STATUS_KEYS } from './GradesTable';
import { ExportIcon } from './icons';
import { mentionKey, rowStatus, sortGrades, subjectName, visibleMark, type Published } from './model';
import styles from './grades.module.css';

/**
 * "Exporter PDF" (ASK A4, decided (b) by the product owner, 2026-11-20): the
 * browser's own print dialog, whose "Save as PDF" destination is the export.
 * No PDF library — the PWA takes no runtime dependency for this (CLAUDE.md) —
 * and no server round trip: the report is the data already on screen.
 *
 * What prints is NOT the screen. A one-page report is rendered into a portal on
 * <body>, hidden on screen, and the print stylesheet (grades.module.css, "Print
 * report") hides every other child of <body> — the whole app shell, sidebar,
 * topbar, tab bar, banners, toasts, the page itself — and shows this alone,
 * black on white. Printing the live page instead would carry the hero's
 * gradient, the chart and the buttons, and lay the table out at whatever width
 * the window had.
 *
 * Mounted with the table only (see GradesView), so there is always a semester's
 * results to report: a semester with nothing published has neither the button
 * nor the report.
 */
export function ExportPdf({ data, summary }: { data: GradesResponse; summary: SemesterSummary }) {
  const { t } = useI18n();
  const { me } = useStudent();

  const exportPdf = () => {
    /*
     * The document title is what Chrome, Edge and Safari offer as the PDF's file
     * name. Restored after the dialog closes; `afterprint` fires on every
     * engine that has window.print, including the ones where print() returns
     * before the dialog does (mobile Safari, Chrome on Android).
     */
    const previous = document.title;
    document.title = t('grades.report.file_name', { semester: summary.label });
    const restore = () => {
      document.title = previous;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    window.print();
  };

  return (
    <>
      <button type="button" className={styles.ghostButton} onClick={exportPdf}>
        <ExportIcon className={styles.ghostButtonIcon} />
        {t('grades.export.open')}
      </button>

      {createPortal(<Report data={data} summary={summary} me={me} />, document.body)}
    </>
  );
}

function Report({
  data,
  summary,
  me,
}: {
  data: GradesResponse;
  summary: SemesterSummary;
  me: MeResponse | null;
}) {
  const { t, lang } = useI18n();

  const published: Published = { cc: data.ccPublished, nf: data.nfPublished };
  // The table's default order (subject, A→Z), so the paper matches the screen
  // a student opened before sorting anything.
  const rows = sortGrades(data.grades, { key: 'subject', dir: 'asc' }, lang, published);
  const wordKey = summary.mention === null ? null : mentionKey(summary.mention);

  const cell = (grade: GradeItem, key: (typeof COLUMNS)[number]['key']) => {
    switch (key) {
      case 'subject':
        return subjectName(grade, lang);
      case 'code':
        return grade.subject.code;
      case 'coefficient':
        return String(grade.subject.coefficient);
      case 'credits':
        return String(grade.subject.credits);
      case 'status':
        return t(STATUS_KEYS[rowStatus(grade, published)]);
      default: {
        const mark = visibleMark(grade, key, published);
        return mark === null ? t('grades.table.pending') : mark.toFixed(2);
      }
    }
  };

  return (
    <div className={styles.report}>
      <p className={styles.reportBrand}>
        {t('app.name')} · {t('app.university')}
      </p>
      <h2 className={styles.reportTitle}>{t('grades.report.title')}</h2>

      <dl className={styles.reportFacts}>
        {me !== null && (
          <>
            <div>
              <dt>{t('grades.report.student')}</dt>
              <dd>
                <bdi>
                  {me.firstName} {me.lastName}
                </bdi>
              </dd>
            </div>
            <div>
              <dt>{t('grades.report.student_id')}</dt>
              <dd className="mono">{fmtLtr(me.studentIdDisplay)}</dd>
            </div>
          </>
        )}
        <div>
          <dt>{t('grades.report.semester')}</dt>
          <dd className="num">{fmtLtr(summary.label)}</dd>
        </div>
        <div>
          <dt>{t('grades.report.year')}</dt>
          {/* "2024-2025" arrives as one string; isolated so Arabic does not
              draw it as "2025-2024". */}
          <dd className="num">{fmtLtr(summary.academicYear)}</dd>
        </div>
        <div>
          <dt>{t('grades.report.average')}</dt>
          <dd>
            {/* One inline LTR run, not fmtScaled: that groups the pair as a flex
                row for the hero, which in an RTL page sits at the field's left
                edge instead of its start. */}
            {summary.gpa === null ? (
              t('grades.hero.no_gpa')
            ) : (
              <bdi dir="ltr" className="num">
                {summary.gpa.toFixed(2)}
                {t('grades.hero.scale')}
              </bdi>
            )}
          </dd>
        </div>
        {summary.gpa !== null && summary.mention !== null && (
          <div>
            <dt>{t('grades.report.mention')}</dt>
            <dd>{wordKey === null ? summary.mention : t(wordKey)}</dd>
          </div>
        )}
        <div>
          <dt>{t('grades.report.credits')}</dt>
          <dd>
            {summary.gpa === null ? (
              <Interpolated template={t('grades.hero.at_stake')} values={{ total: summary.credits.total }} />
            ) : (
              <bdi dir="ltr" className="num">
                {summary.credits.earned}/{summary.credits.total}
              </bdi>
            )}
          </dd>
        </div>
      </dl>

      {published.cc && !published.nf && <p className={styles.reportNote}>{t('grades.notice.cc_only')}</p>}

      <table className={styles.reportTable}>
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th key={column.key} scope="col" className={column.end ? styles.reportEnd : undefined}>
                {t(column.labelKey)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((grade) => (
            <tr key={grade.id}>
              {COLUMNS.map((column) => (
                <td
                  key={column.key}
                  className={`${column.end ? styles.reportEnd : ''} ${column.num ? 'num' : ''}`}
                >
                  {cell(grade, column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <p className={styles.reportNote}>{t('grades.table.legend')}</p>
    </div>
  );
}
