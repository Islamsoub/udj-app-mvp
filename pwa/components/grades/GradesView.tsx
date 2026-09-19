'use client';

import { Interpolated } from '@/components/dashboard/Interpolated';
import type { GradesResponse, SemesterSummary } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { GpaHero } from './GpaHero';
import { GradeCalculator } from './GradeCalculator';
import { GradesTable } from './GradesTable';
import { ArrowIcon } from './icons';
import { suggestedSemester, type Published } from './model';
import { SemesterTabs } from './SemesterTabs';
import { StateLayers } from './StateLayers';
import { TableSkeleton } from './skeletons';
import { useSemesterDetail } from './useSemesterDetail';
import styles from './grades.module.css';

const PANEL_ID = 'grades-panel';

export interface GradesBundle {
  /** The current semester, already fetched — this is where the screen opens. */
  current: GradesResponse;
  /** Every semester the student has, ordered, current one guaranteed present. */
  semesters: SemesterSummary[];
}

/**
 * The loaded grades screen: tab strip, hero, and one semester's table.
 *
 * The hero reads from the SEMESTER SUMMARY, not from the fetched detail. The
 * summary list arrives with the screen and already carries every semester's gpa,
 * mention and credits, so switching tabs has an average to crossfade to in the
 * same frame the click lands — which is what §9's 100/150ms crossfade describes,
 * and what it would stop being if the number had to wait for a round trip. The
 * table below is the only part that loads.
 */
export function GradesView({
  bundle,
  online,
  selectedId,
  onSelect,
}: {
  bundle: GradesBundle;
  online: boolean;
  /** null until the student picks a tab: "whichever semester is current". */
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();

  /*
   * The selection is held by the screen above, not here, and this is not
   * decoration: reconnecting re-runs the bootstrap, which puts the screen back
   * into its loading phase and unmounts this component. Owning the selection
   * locally meant a student who had switched to the semester her results are
   * actually in was dropped back onto the empty current one by a passing network
   * blip. The tab she chose has to outlive the data behind it.
   *
   * Resolved rather than stored so both the "not chosen yet" case and a stale id
   * — a semester that disappeared from the list between two loads — fall back to
   * the current semester instead of selecting nothing.
   */
  const fallbackId = bundle.current.semester.id;
  const activeId =
    selectedId !== null && bundle.semesters.some((s) => s.id === selectedId)
      ? selectedId
      : fallbackId;

  const detail = useSemesterDetail(activeId, bundle.current, online);

  // orderSemesters guarantees the active id is in the list; the fallback is
  // there so a future caller cannot turn a mistake into a crash.
  const summary = bundle.semesters.find((s) => s.id === activeId) ?? bundle.semesters[0];

  const suggestion = suggestedSemester(bundle.semesters, activeId);

  return (
    <>
      <SemesterTabs
        semesters={bundle.semesters}
        selectedId={activeId}
        onSelect={onSelect}
        panelId={PANEL_ID}
      />

      <GpaHero semester={summary} />

      <div
        id={PANEL_ID}
        role="tabpanel"
        aria-labelledby={`grades-tab-${activeId}`}
        // Focusable so a keyboard user can reach the table the tabs control;
        // -1 keeps it out of the tab sequence until they arrive there.
        tabIndex={-1}
        className={styles.panel}
      >
        <StateLayers loading={detail.phase === 'loading'} skeleton={<TableSkeleton />}>
          {detail.phase === 'ready' && (
            <SemesterResults
              data={detail.data}
              suggestion={suggestion}
              onSelect={onSelect}
            />
          )}

          {detail.phase === 'error' && (
            <div className={styles.stateBox} role="status" aria-live="polite">
              <p className={styles.stateText}>{t('grades.state.error')}</p>
              {/* Retries this semester alone. The tab strip stays usable, so a
                  semester that loaded earlier is still one click away. */}
              <button type="button" className={styles.retryButton} onClick={detail.retry}>
                {t('actions.retry')}
              </button>
            </div>
          )}

          {detail.phase === 'offline' && (
            <div className={styles.stateBox} role="status" aria-live="polite">
              {/* No retry: there is nothing cached for this semester and the
                  request cannot succeed until the connection returns, at which
                  point it is reissued without being asked. */}
              <p className={styles.stateText}>{t('grades.state.offline')}</p>
            </div>
          )}
        </StateLayers>
      </div>
    </>
  );
}

/** One semester's body: the table, or the reason there is no table. */
function SemesterResults({
  data,
  suggestion,
  onSelect,
}: {
  data: GradesResponse;
  suggestion: SemesterSummary | null;
  onSelect: (id: string) => void;
}) {
  const { t } = useI18n();

  const published: Published = { cc: data.ccPublished, nf: data.nfPublished };

  if (data.grades.length === 0) {
    return <NotPublished semester={data.semester.label} suggestion={suggestion} onSelect={onSelect} />;
  }

  return (
    <>
      {/*
        The two publication timestamps are independent columns, so "marks are
        out but finals are not" is a real, common state rather than a transient
        one. Saying so once above the table is what stops three columns of
        "en attente" from reading as an error.
      */}
      {published.cc && !published.nf && (
        <p className={styles.notice} role="status">
          {t('grades.notice.cc_only')}
        </p>
      )}

      {/*
        Mounted with the table, and only with it. A semester with nothing
        published has no `grades` at all — the API omits unpublished rows — so
        the calculator would open onto an empty subject picker; the empty state
        below already explains why there is nothing to work from.
      */}
      <div className={styles.resultsBar}>
        <GradeCalculator grades={data.grades} published={published} />
      </div>

      <GradesTable
        // Keyed by semester: a tab switch mounts a fresh table, so the sort
        // resets with the data it described and the FLIP measures from the new
        // rows rather than the previous semester's positions.
        key={data.semester.id}
        grades={data.grades}
        published={published}
      />
    </>
  );
}

/**
 * The empty state — and on this screen, the ORDINARY state.
 *
 * Exactly one student in the database has published grades, in one semester.
 * Everyone else has grades stored and nothing published, in either semester, so
 * this is what almost every student sees. It is written accordingly: it says the
 * faculty has not published this semester yet, never "you have no grades", and
 * it carries no warning colour, no error tone and no retry, because nothing has
 * gone wrong.
 *
 * The button is the other half. The one student with results opens on the
 * current semester, which is the unpublished one — her marks are one tab away
 * and nothing on an empty screen would tell her so. When another semester
 * actually has an average, the copy names it; otherwise the button is still
 * offered, just without the promise.
 */
function NotPublished({
  semester,
  suggestion,
  onSelect,
}: {
  semester: string;
  suggestion: SemesterSummary | null;
  onSelect: (id: string) => void;
}) {
  const { t, dir } = useI18n();

  return (
    <div className={styles.empty}>
      <p className={styles.emptyTitle}>{t('grades.empty.title')}</p>

      <p className={styles.emptyBody}>
        <Interpolated template={t('grades.empty.body')} values={{ semester }} />
      </p>

      {suggestion !== null && (
        <>
          {suggestion.gpa !== null && (
            <p className={styles.emptyBody}>
              <Interpolated
                template={t('grades.empty.other_available')}
                values={{ semester: suggestion.label }}
              />
            </p>
          )}

          <button
            type="button"
            className={styles.emptyAction}
            style={{ '--arrow-flip': dir === 'rtl' ? -1 : 1 } as React.CSSProperties}
            onClick={() => onSelect(suggestion.id)}
          >
            <Interpolated
              template={t('grades.empty.other_action')}
              values={{ semester: suggestion.label }}
            />
            {/* A transform is never mirrored by `dir`, so the flip is handed to
                the stylesheet as a value read from the active direction. */}
            <ArrowIcon className={styles.emptyArrow} />
          </button>
        </>
      )}
    </div>
  );
}
