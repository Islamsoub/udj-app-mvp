'use client';

import { useMemo } from 'react';
import { useGrades } from '@/hooks/queries/use-grades';
import { useSubjects } from '@/hooks/queries/use-academics';
import type { GradeRow, Subject } from '@/lib/types';
import type { SubjectStage } from '@/components/shared/lifecycle-badge';

/**
 * Subject lifecycle staging (Pass C-2, change-set §30.2 / AD §3.5).
 *
 * `computeSubjectStage` derives the 1–7 stage of one subject from its grade
 * rows, matching the backend publication rules (a subject's grades share their
 * `publishedCcAt` / `publishedNfAt` timestamps, and "all entered" means every
 * existing grade row has the value — the same set the publish endpoint checks).
 *
 * `useSubjectStages` computes the stage of every subject in the scoped
 * programme + semester and rolls them up into the picker's publish-gating flags.
 */

/** Minimal grade shape needed to stage a subject. */
export type StageRow = Pick<
  GradeRow,
  'noteCc' | 'noteCf' | 'noteFinale' | 'publishedCcAt' | 'publishedNfAt'
>;

export function computeSubjectStage(rows: StageRow[]): SubjectStage {
  if (rows.length === 0) return 1; // Brouillon — nothing entered

  if (rows.some((r) => r.publishedNfAt != null)) return 7; // Publié

  const n = rows.length;
  const ccEntered = rows.filter((r) => r.noteCc != null).length;
  const cfEntered = rows.filter((r) => r.noteCf != null).length;
  const nfComputed = rows.filter((r) => r.noteFinale != null).length;
  const ccPublished = rows.some((r) => r.publishedCcAt != null);

  if (ccPublished) {
    if (nfComputed === n) return 6; // Prêt à publier — all NFs computed
    if (cfEntered > 0) return 5; // CF en cours — some CF entered
    return 4; // CC publié — CC locked, no CF yet
  }

  if (ccEntered === 0) return 1; // Brouillon
  if (ccEntered === n) return 3; // CC complet — all CC entered, not published
  return 2; // CC en cours — some CC entered
}

export interface SubjectStagesSummary {
  total: number;
  /** Every subject has published CC (stage ≥ 4). */
  everyCcPublished: boolean;
  /** Every subject has published NF (stage 7). */
  everyNfPublished: boolean;
  /** Every subject is ≥ CC complet (stage ≥ 3) — CC publication is allowed. */
  canPublishCc: boolean;
  /** Every subject is ≥ Prêt à publier (stage ≥ 6) — NF publication is allowed. */
  canPublishNf: boolean;
}

export interface SubjectStagesResult {
  subjects: Subject[];
  stageBySubject: Map<string, SubjectStage>;
  gradesBySubject: Map<string, GradeRow[]>;
  summary: SubjectStagesSummary;
  isLoading: boolean;
}

export function useSubjectStages(
  programmeId: string | null | undefined,
  semesterId: string | null | undefined
): SubjectStagesResult {
  const { data: subjects, isLoading: subjectsLoading } = useSubjects({
    programme: programmeId ?? undefined,
    semester: semesterId ?? undefined,
  });
  const { data: grades, isLoading: gradesLoading } = useGrades({
    semester: semesterId ?? undefined,
  });

  const gradesBySubject = useMemo(() => {
    const map = new Map<string, GradeRow[]>();
    for (const g of grades ?? []) {
      const list = map.get(g.subjectId);
      if (list) list.push(g);
      else map.set(g.subjectId, [g]);
    }
    return map;
  }, [grades]);

  const scopedSubjects = useMemo(
    () => (programmeId ? (subjects ?? []).filter((s) => s.programmeId === programmeId) : []),
    [subjects, programmeId]
  );

  const stageBySubject = useMemo(() => {
    const map = new Map<string, SubjectStage>();
    for (const s of scopedSubjects) {
      map.set(s.id, computeSubjectStage(gradesBySubject.get(s.id) ?? []));
    }
    return map;
  }, [scopedSubjects, gradesBySubject]);

  const summary = useMemo<SubjectStagesSummary>(() => {
    const stages = Array.from(stageBySubject.values());
    const total = stages.length;
    return {
      total,
      everyCcPublished: total > 0 && stages.every((s) => s >= 4),
      everyNfPublished: total > 0 && stages.every((s) => s >= 7),
      canPublishCc: total > 0 && stages.every((s) => s >= 3),
      canPublishNf: total > 0 && stages.every((s) => s >= 6),
    };
  }, [stageBySubject]);

  return {
    subjects: scopedSubjects,
    stageBySubject,
    gradesBySubject,
    summary,
    isLoading: subjectsLoading || gradesLoading,
  };
}
