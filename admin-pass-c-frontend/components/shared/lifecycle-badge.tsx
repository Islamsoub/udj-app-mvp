import { Badge } from '@/components/ui/badge';
import type { Tone } from '@/lib/tokens';

/**
 * LifecycleBadge (Pass C-2, change-set §30.2 / AD §3.5) — the 7-stage grading
 * lifecycle of a subject, rendered with the existing Badge primitive and tokens.
 *
 *   1 Brouillon (slate) → 2 CC en cours (amber) → 3 CC complet (blue)
 *   → 4 CC publié (jade) → 5 CF en cours (amber) → 6 Prêt à publier (blue)
 *   → 7 Publié (jade)
 */
export type SubjectStage = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface StageMeta {
  label: string;
  tone: Tone;
  /** Jade stages (published) render a leading dot. */
  dot: boolean;
}

export const STAGE_META: Record<SubjectStage, StageMeta> = {
  1: { label: 'Brouillon', tone: 'slate', dot: false },
  2: { label: 'CC en cours', tone: 'amber', dot: false },
  3: { label: 'CC complet', tone: 'blue', dot: false },
  4: { label: 'CC publié', tone: 'jade', dot: true },
  5: { label: 'CF en cours', tone: 'amber', dot: false },
  6: { label: 'Prêt à publier', tone: 'blue', dot: false },
  7: { label: 'Publié', tone: 'jade', dot: true },
};

/** Clamp any number into the 1–7 stage range. */
export function asStage(n: number): SubjectStage {
  return Math.min(7, Math.max(1, Math.round(n))) as SubjectStage;
}

export function LifecycleBadge({ stage, className }: { stage: number; className?: string }) {
  const meta = STAGE_META[asStage(stage)];
  return (
    <Badge tone={meta.tone} dot={meta.dot} className={className}>
      {meta.label}
    </Badge>
  );
}
