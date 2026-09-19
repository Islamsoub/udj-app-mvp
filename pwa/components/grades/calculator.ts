/**
 * The grade calculator's arithmetic. No React, no formatting, no strings.
 *
 * THE FORMULA is the university's, verified against the database rather than
 * assumed:
 *
 *     note_finale = 0.4 x note_cc + 0.6 x note_cf
 *
 * exact on all eight of the published S1 subjects. Solving it for the mark still
 * needed at the final exam gives what this module answers:
 *
 *     required_cf = (target - 0.4 x cc) / 0.6
 *
 * The prototype used `target * 2 - cc`, which is the same solve against a 50/50
 * split. That weighting is not what the registrar uses, so it is not used here.
 */

const CC_WEIGHT = 0.4;
const CF_WEIGHT = 0.6;

/** Every mark in the product is out of 20. */
export const MARK_MAX = 20;

/** The design's step: half a point, which is how marks are actually awarded. */
export const TARGET_STEP = 0.5;

/** Two decimals, the same precision the table and the GPA hero render. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * What the student has to score at the final exam, and whether that is a thing
 * that can happen.
 *
 * `required` is carried on all three outcomes because it is the same quantity in
 * each — the panel shows one number whose meaning never changes, and the verdict
 * explains it. A figure above 20 is not an error to be suppressed; it is the
 * answer, and seeing "24.33 / 20" is what makes the verdict obvious before the
 * sentence beneath it has been read.
 */
export type CalcVerdict =
  /** required <= 0: the continuous assessment alone already reaches the target. */
  | { kind: 'achieved'; required: number }
  /** 0 < required <= 20. */
  | { kind: 'achievable'; required: number }
  /** required > 20, with the best average still reachable, for the explanation. */
  | { kind: 'impossible'; required: number; maxReachable: number };

/**
 * Solves for the required final-exam mark.
 *
 * THE THRESHOLDS ARE APPLIED TO THE ROUNDED VALUE, not the raw one. Rounding
 * afterwards would let a required of 20.001 be classified "impossible" and then
 * displayed as "20.00 / 20", which is a verdict the number on screen
 * contradicts.
 *
 * `maxReachable` answers the question the impossible case actually raises — not
 * "how much would I need", which is unattainable by definition, but "what is the
 * best I can still get".
 */
export function requiredFinalMark(cc: number, target: number): CalcVerdict {
  const required = round2((target - CC_WEIGHT * cc) / CF_WEIGHT);

  if (required <= 0) {
    /*
     * Reported as 0.00 rather than as the negative the algebra gives. Both are
     * true — any mark clears the target — but 0 is the lowest mark that exists,
     * so it is the honest floor, and "-1.50 / 20" would read as a broken
     * calculation rather than as good news.
     */
    return { kind: 'achieved', required: 0 };
  }

  if (required > MARK_MAX) {
    return {
      kind: 'impossible',
      required,
      maxReachable: round2(CC_WEIGHT * cc + CF_WEIGHT * MARK_MAX),
    };
  }

  return { kind: 'achievable', required };
}

/**
 * Reads a target typed by a student, in either language.
 *
 * ACCEPTS BOTH DECIMAL SEPARATORS, which is why the field is not an
 * `<input type="number">`. A number input hands back an empty string for
 * anything its own locale rejects, with no way to see what was typed — so a
 * French student entering "13,8" in a browser running en-US would have the
 * comma silently discarded, and the panel would compute a result for a target
 * she did not enter. Parsing here means the same keystrokes mean the same thing
 * in French, in Arabic, and whatever locale the browser happens to be in.
 *
 * Returns null for anything that is not a plain number — including an empty
 * field, which is not an error, just nothing to compute yet.
 */
export function parseTarget(raw: string): number | null {
  const normalised = raw.trim().replace(',', '.');
  if (normalised === '') return null;

  // Digits with at most one separator. Deliberately no sign and no exponent: a
  // target mark is neither negative nor written as 1e1.
  if (!/^\d*\.?\d*$/.test(normalised) || normalised === '.') return null;

  const value = Number(normalised);
  return Number.isFinite(value) ? value : null;
}

/** True when a parsed target is inside the 0-20 scale marks are awarded on. */
export function isTargetInRange(target: number): boolean {
  return target >= 0 && target <= MARK_MAX;
}

/**
 * Steps a target by half a point, for the arrow keys.
 *
 * An `<input type="number">` would have given this for free; parsing the value
 * ourselves means providing it ourselves, and leaving it out would make the
 * text field a downgrade for anyone driving the panel from the keyboard.
 * Snapped to the step so repeated presses from 13.2 give 13.5, 14.0, 14.5
 * rather than 13.7, 14.2.
 */
export function stepTarget(current: number, direction: 1 | -1): number {
  const snapped =
    direction === 1
      ? Math.floor(current / TARGET_STEP + 1e-9) + 1
      : Math.ceil(current / TARGET_STEP - 1e-9) - 1;

  return round2(Math.min(MARK_MAX, Math.max(0, snapped * TARGET_STEP)));
}
