'use client';

import { useMemo, useState } from 'react';
import { SlidePanel } from '@/components/panel/SlidePanel';
/*
 * Imported from Schedule rather than copied, the same way Schedule imports
 * StateLayers from Grades. It is §9's crossfade with nothing screen-specific in
 * it — two layers in one grid cell, the outgoing one held for exactly one
 * animation — and the rule it implements here is the same sentence: content
 * changes, the structure around it does not move.
 */
import { Crossfade } from '@/components/schedule/Crossfade';
import { SegmentedControl } from '@/components/segmented/SegmentedControl';
import { Interpolated } from '@/components/dashboard/Interpolated';
import type {
  AbsenceRecord,
  AttendanceOverall,
  AttendanceSubject,
  UploadJustificationResponse,
} from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { AbsenceList } from './AbsenceList';
import { Hero } from './Hero';
import { JustificationPanel } from './JustificationPanel';
import { flattenAbsences, needsAction, type FlatAbsence } from './model';
import { SubjectBreakdown } from './SubjectBreakdown';
import { useReducedMotion } from './useReducedMotion';
import styles from './attendance.module.css';

type Filter = 'todo' | 'all';

const PANEL_ID = 'attendance-absences';

/**
 * The loaded attendance screen: the hero gauge, the per-subject breakdown, the
 * filtered absence list, and the justification panel.
 *
 * The caller has already ruled out the two empty cases, so `overall` is non-null
 * here and its percentage is a number.
 */
export function AttendanceView({
  overall,
  subjects,
  percentage,
  threshold,
  deadlineDays,
}: {
  overall: AttendanceOverall;
  subjects: AttendanceSubject[];
  /** Non-null by construction: the caller renders an empty state without one. */
  percentage: number;
  /** `attendanceThreshold` from the response — the server's, never a local one. */
  threshold: number;
  /** `justificationDeadlineDays` from the response, stated by the expired panel. */
  deadlineDays: number;
}) {
  const { t, lang } = useI18n();

  const [filter, setFilter] = useState<Filter>('all');
  const [selected, setSelected] = useState<FlatAbsence | null>(null);

  /*
   * Records the student has just uploaded for, keyed by id.
   *
   * A LOCAL OVERLAY RATHER THAN A REFETCH. Re-running the attendance query
   * would drop the whole screen back to its skeleton for 400ms and replay
   * nothing the student needs to see again — the only thing that changed is one
   * record's justification, and the server told us exactly what it now is. The
   * overall counts are deliberately NOT touched: an upload leaves the record
   * ABSENT and only sets justificationStatus to PENDING, so the percentage and
   * the absence tallies are unchanged by construction.
   */
  const [patches, setPatches] = useState<Record<string, Partial<AbsenceRecord>>>({});

  const patched = useMemo(
    () =>
      Object.keys(patches).length === 0
        ? subjects
        : subjects.map((entry) => ({
            ...entry,
            absences: entry.absences.map((a) =>
              patches[a.id] === undefined ? a : { ...a, ...patches[a.id] }
            ),
          })),
    [subjects, patches]
  );

  /*
   * Flattened once per response rather than per render. The list is small, but
   * a fresh array every render would hand Crossfade new children on every
   * unrelated re-render — the panel opening, for instance — and it compares
   * children by identity to decide whether a swap is a filter change or noise.
   */
  const all = useMemo(() => flattenAbsences(patched), [patched]);
  const todo = useMemo(() => all.filter((entry) => needsAction(entry.record)), [all]);

  const shown = filter === 'todo' ? todo : all;

  /*
   * The open panel reads the record back out of the patched list rather than
   * holding the snapshot it was opened with. Without this the upload would
   * update the row behind the panel while the panel itself carried on showing
   * the form it was opened with — the student would send a justification and see
   * no change until they closed and reopened it.
   *
   * Falls back to the snapshot so closing the panel still has a title to render
   * during its exit animation, after the record has gone from the list.
   */
  const openRecord =
    selected === null
      ? null
      : (all.find((entry) => entry.record.id === selected.record.id)?.record ?? selected.record);

  const reducedMotion = useReducedMotion();

  const list =
    shown.length === 0 ? (
      /*
        TWO DIFFERENT EMPTIES. No absences at all is a perfect semester and is
        written as good news. Nothing left to justify covers settled absences AND
        ones whose window has closed, so its copy claims only that nothing is
        actionable — not that everything was dealt with. A student with nine
        absences must not be told they have none.

        Neither is the screen's "nothing recorded" state, which is real missing
        data and is handled one level up in Attendance.tsx.
      */
      <p className={styles.filterEmpty}>
        {t(
          all.length === 0 ? 'attendance.absences.none_at_all' : 'attendance.absences.none_todo'
        )}
      </p>
    ) : (
      <AbsenceList absences={shown} onSelect={setSelected} />
    );

  return (
    <>
      <Hero overall={overall} percentage={percentage} threshold={threshold} />

      <SubjectBreakdown subjects={subjects} threshold={threshold} />

      <section className={styles.section}>
        <div className={styles.absencesHead}>
          <h2 className={styles.sectionTitle}>{t('attendance.absences.title')}</h2>

          <SegmentedControl
            options={[
              { id: 'todo', label: t('attendance.filter.todo') },
              { id: 'all', label: t('attendance.filter.all') },
            ]}
            selectedId={filter}
            onSelect={(id) => setFilter(id as Filter)}
            label={t('attendance.filter.label')}
            panelId={PANEL_ID}
          />
        </div>

        <div
          id={PANEL_ID}
          role="tabpanel"
          aria-label={t(filter === 'todo' ? 'attendance.filter.todo' : 'attendance.filter.all')}
          tabIndex={-1}
          className={styles.absencesPanel}
        >
          {/*
            §9: filtering "crossfades the list rather than re-animating each row
            in — this is a filter, not new data". The whole list is one layer, so
            the rows common to both views fade through each other in place
            instead of restaging themselves; the heading and the control above
            are outside it and do not move.

            The token is the filter id, so a swap happens on a filter change and
            on nothing else — a re-render from the panel opening reaches
            Crossfade's "same token, new children" path and replaces the content
            without a fade, which is what keeps the list still while the panel
            slides in over it.

            SKIPPED ENTIRELY under reduced motion rather than neutered — see
            useReducedMotion for why disabling the animation inside Crossfade is
            not enough here.
          */}
          {reducedMotion ? list : <Crossfade token={filter}>{list}</Crossfade>}
        </div>

        {/*
          The count, outside the crossfade. It is a live region, so it announces
          the result of the filter change once — the list itself is not, because
          re-reading eight rows on every toggle is noise rather than feedback.
        */}
        <p className={styles.absencesCount} role="status" aria-live="polite">
          <Interpolated
            template={t('attendance.absences.count')}
            values={{ shown: shown.length, total: all.length }}
          />
        </p>
      </section>

      <SlidePanel
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={
          openRecord === null
            ? ''
            : lang === 'ar'
              ? openRecord.subjectNameAr
              : openRecord.subjectName
        }
      >
        {openRecord !== null && (
          <JustificationPanel
            record={openRecord}
            deadlineDays={deadlineDays}
            onUploaded={(result) =>
              /*
                Exactly the three fields the upload changes, taken from the
                server's own response rather than assumed. `status` stays ABSENT
                — only an admin approval moves it — which is why the hero and
                the per-subject percentages need no adjustment.
              */
              setPatches((current) => ({
                ...current,
                [openRecord.id]: {
                  justificationStatus: result.justificationStatus,
                  justificationUrl: result.justificationUrl,
                  justificationNote: result.justificationNote,
                },
              }))
            }
          />
        )}
      </SlidePanel>
    </>
  );
}
