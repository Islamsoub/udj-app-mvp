'use client';

import type { ReactNode } from 'react';
import { attendanceLine, type AttendanceLine } from '@/components/attendance/model';
import { getAttendance } from '@/lib/api-client';
import type { AttendanceBand, AttendanceResponse } from '@/lib/api-types';
import { fmtPercent, fmtPhrase, percentText } from '@/lib/bidi';
import { useI18n, type I18nValue } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n-shared';
import { Card, CardStates, EmptyState } from './Card';
import { Interpolated } from './Interpolated';
import { Ring } from './Ring';
import { useCardData } from './useCardData';
import styles from './dashboard.module.css';

/** The Seuil label's colour, from the server's overall band (§3, A2). */
const THRESHOLD_TONE: Record<AttendanceBand, string> = {
  ok: styles.attendanceThresholdOk,
  near: styles.attendanceThresholdNear,
  below: styles.attendanceThresholdBelow,
};

/** The line's colour, from the line's own state (§3's Colour column). */
const LINE_TONE: Record<AttendanceLine['kind'], string> = {
  ok: styles.attendanceLineOk,
  'ended-ok': styles.attendanceLineOk,
  near: styles.attendanceLineNear,
  below: styles.attendanceLineBelow,
  'ended-below': styles.attendanceLineBelow,
};

/**
 * " · " joins the sentence and §5's suffix. It is punctuation, not copy, and is
 * written as §5's example writes it.
 */
const SUFFIX_SEPARATOR = ' · ';

/** A count inside a sentence: Latin face, Western digits, in both languages. */
function num(value: number): ReactNode {
  return <span className="num">{value}</span>;
}

/**
 * Assiduité, with the §5 gauge, the Seuil label and the line under the ring
 * (ROUND2-CLOSEOUT §3 and §5).
 *
 * `overall` is null when no semester is marked current, and `percentage` is
 * separately null when no session lengths could be resolved. Either way there is
 * no figure to draw, so the ring is skipped entirely rather than rendered at
 * zero — an empty gauge reads as "you attended nothing", which is a different
 * and much worse claim than "nothing has been recorded".
 *
 * Every verdict on this card is the server's `band`. The threshold is shown,
 * never compared against: the response has already passed
 * checkAttendanceContract inside getAttendance, so `band` is always present.
 */
export function AttendanceCard({ index, animate, online }: { index: number; animate: boolean; online: boolean }) {
  const { t, plural, lang } = useI18n();
  const state = useCardData<AttendanceResponse>(() => getAttendance(), online);

  return (
    <Card
      title={t('dashboard.attendance.title')}
      href="/attendance"
      index={index}
      animate={animate}
    >
      <CardStates
        state={state}
        skeleton={
          <div className={styles.skeletonRow}>
            <div className={`${styles.skeleton} ${styles.skeletonRing}`} />
            <div className={styles.skeletonStack} style={{ flex: 1 }}>
              <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineWide}`} />
              <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            </div>
          </div>
        }
      >
        {(data) => {
          const overall = data.overall;
          // null only for an empty subject list: §3 has no row for it, and "ok"
          // would claim something about subjects that do not exist.
          const line = attendanceLine(data.subjects, lang);

          if (overall === null || overall.percentage === null || line === null) {
            return <EmptyState body={t('dashboard.attendance.empty')} />;
          }

          const percentage = overall.percentage;

          return (
            <div className={styles.heroRow}>
              <Ring
                percentage={percentage}
                band={overall.band}
                label={t('dashboard.attendance.title') + ' ' + percentText(percentage)}
                caption={t('dashboard.attendance.rate_caption')}
              />
              <div className={styles.attendanceText}>
                <p className={styles.stateText}>
                  {/* Interpolated, not t(...) with params: the two counts have to
                      land on the Latin face without taking the Arabic words with
                      them. */}
                  <Interpolated
                    template={t('dashboard.attendance.sessions')}
                    values={{ present: overall.present, total: overall.total }}
                  />
                </p>
                <p className={styles.stateText}>
                  <strong className={`${styles.attendanceThreshold} ${THRESHOLD_TONE[overall.band]}`}>
                    <Interpolated
                      template={t('dashboard.attendance.threshold')}
                      values={{ threshold: fmtPercent(data.attendanceThreshold) }}
                    />
                  </strong>
                  <span className={`${styles.attendanceLine} ${LINE_TONE[line.kind]}`}>
                    <LineText line={line} lang={lang} t={t} plural={plural} />
                  </span>
                </p>
              </div>
            </div>
          );
        }}
      </CardStates>
    </Card>
  );
}

/**
 * §3's sentence for one line state, then §5's suffix.
 *
 * fmtPhrase, not Interpolated: {{subject}} must sit in a <bdi> without being
 * forced onto the Latin face — an Arabic subject name in `.num` would render in
 * a font with no Arabic glyphs. The counts {{n}} and {{k}} are `.num` inside
 * their own <bdi>.
 *
 * The suffix goes at the end of the sentence, after " · ", inside the
 * sentence's element and in its colour; for near, below and term-over-below
 * only, and never at k = 0 (§5).
 */
function LineText({
  line,
  lang,
  t,
  plural,
}: {
  line: AttendanceLine;
  lang: Lang;
  t: I18nValue['t'];
  plural: I18nValue['plural'];
}) {
  switch (line.kind) {
    case 'ok':
      return <>{t('dashboard.attendance.ok')}</>;
    case 'ended-ok':
      return <>{t('dashboard.attendance.ended_ok')}</>;
    case 'near':
    case 'below':
    case 'ended-below': {
      const subject = lang === 'ar' ? line.subject.subject.nameAr : line.subject.subject.nameFr;
      const sentence =
        line.kind === 'near'
          ? fmtPhrase(plural('dashboard.attendance.near', line.n), { subject, n: num(line.n) })
          : fmtPhrase(
              t(line.kind === 'below' ? 'dashboard.attendance.below' : 'dashboard.attendance.ended_below'),
              { subject }
            );

      return (
        <>
          {sentence}
          {line.others > 0 && (
            <>
              {SUFFIX_SEPARATOR}
              <span className={styles.attendanceOthers}>
                {fmtPhrase(plural('dashboard.attendance.others', line.others), { k: num(line.others) })}
              </span>
            </>
          )}
        </>
      );
    }
  }
}
