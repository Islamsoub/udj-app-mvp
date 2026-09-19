'use client';

import { useEffect, useMemo, useState } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import { SlidePanel } from '@/components/panel/SlidePanel';
import type { GradeItem } from '@/lib/api-types';
import { useI18n, type I18nValue } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import { useExitBackstop } from '@/lib/useExitBackstop';
import {
  MARK_MAX,
  isTargetInRange,
  parseTarget,
  requiredFinalMark,
  stepTarget,
  type CalcVerdict,
} from './calculator';
import { CalculatorIcon } from './icons';
import { sortGrades, subjectName, visibleMark, type Published } from './model';
import styles from './grades.module.css';

/** The design's default target: the pass mark. */
const DEFAULT_TARGET = '10';

/** §9: "the result updates live as the user types the target grade (debounced 150ms)". */
const DEBOUNCE_MS = 150;

/**
 * The grade calculator: a trigger beside the table, and §5's slide-in panel.
 *
 * NO "CALCULER" BUTTON. The prototype has one; §9 says the result updates live
 * as the student types, debounced 150ms, and the two cannot both be true — a
 * button that recomputes a number already on screen teaches the student that
 * what they can read is provisional until they press something. The result block
 * is a polite live region, so the recomputation is announced without one, and
 * dropping it is also what lets the panel do without a footer, which keeps the
 * bottom sheet short on a phone.
 *
 * The caller mounts this only where there is a table, which is the same thing as
 * "this semester has at least one published grade". That is not a preference:
 * the API omits unpublished grades entirely, so a semester with nothing
 * published has no subjects at all and the picker would be empty. The screen
 * already says why in that case.
 */
export function GradeCalculator({
  grades,
  published,
}: {
  grades: GradeItem[];
  published: Published;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.calcTrigger}
        onClick={() => setOpen(true)}
        /*
         * The panel is not in the DOM until it opens, so aria-controls would
         * point at nothing for the whole time the button is sitting there.
         * aria-haspopup="dialog" says what pressing it does without naming an
         * element that does not exist yet.
         */
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <CalculatorIcon className={styles.calcTriggerIcon} />
        {t('grades.calculator.open')}
      </button>

      <SlidePanel
        open={open}
        onClose={() => setOpen(false)}
        title={t('grades.calculator.title')}
        subtitle={t('grades.calculator.subtitle')}
      >
        <CalculatorBody grades={grades} published={published} />
      </SlidePanel>
    </>
  );
}

/** The picker, the read-only CC, the target field and the live result. */
function CalculatorBody({ grades, published }: { grades: GradeItem[]; published: Published }) {
  const { t, lang } = useI18n();

  /*
   * Ordered by subject name, which is the order the table defaults to. The API
   * returns whatever the database produced — stable for nobody — so an unsorted
   * picker would list the same student's subjects differently on two visits, and
   * differently again from the table she opened it from.
   */
  const options = useMemo(
    () => sortGrades(grades, { key: 'subject', dir: 'asc' }, lang, published),
    [grades, lang, published]
  );

  const [selectedId, setSelectedId] = useState(() => options[0]?.id ?? '');
  const [target, setTarget] = useState(DEFAULT_TARGET);

  /*
   * Debounced, per §9 — but only the TYPED value. Changing the subject is a
   * discrete choice rather than a keystroke, and holding its result back for
   * 150ms would make the picker feel broken; the subject is therefore read
   * directly and only `target` goes through the timer.
   */
  const [debouncedTarget, setDebouncedTarget] = useState(DEFAULT_TARGET);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedTarget(target), DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [target]);

  const selected = options.find((g) => g.id === selectedId) ?? options[0];

  /*
   * The CC this calculation rests on, read through the same gate the table uses
   * rather than off the row: a semester whose continuous assessment is not
   * published must not have it revealed by the calculator. Null here is the
   * honest answer, and the panel says so rather than showing a blank or a 0.
   */
  const cc = selected === undefined ? null : visibleMark(selected, 'cc', published);

  const parsed = parseTarget(debouncedTarget);

  const outcome = useMemo<Outcome>(() => {
    if (cc === null) return { kind: 'no_cc' };
    if (parsed === null) return { kind: 'no_target' };
    if (!isTargetInRange(parsed)) return { kind: 'out_of_range' };
    return { kind: 'verdict', verdict: requiredFinalMark(cc, parsed) };
  }, [cc, parsed]);

  if (selected === undefined) return null;

  return (
    <div className={styles.calcBody}>
      {/*
        The semester's finals are already out, so nothing here can change an
        outcome. Said once, plainly, because a calculator that quietly implies
        the result is still open would be lying by omission.
      */}
      {published.nf && (
        <p className={styles.calcNote} role="note">
          {t('grades.calculator.already_final')}
        </p>
      )}

      <label className={styles.calcLabel} htmlFor="calc-subject">
        {t('grades.calculator.subject')}
      </label>
      <select
        id="calc-subject"
        className={styles.calcSelect}
        value={selected.id}
        onChange={(event) => setSelectedId(event.target.value)}
      >
        {/* Only this semester's subjects: the panel is opened from one tab's
            results and must not offer marks from another. */}
        {options.map((grade) => (
          <option key={grade.id} value={grade.id}>
            {subjectName(grade, lang)}
          </option>
        ))}
      </select>

      <p className={styles.calcLabel}>{t('grades.calculator.current_cc')}</p>
      <p className={styles.calcCurrent}>
        {cc === null ? (
          /* The same wording the table uses for an unpublished mark — never a
             blank, never a zero. */
          <span className={styles.unpublished}>{t('grades.table.pending')}</span>
        ) : (
          <>
            <span className={`${styles.calcCurrentValue} num`}>{cc.toFixed(2)}</span>
            <span className={`${styles.calcSuffix} num`}>/ {MARK_MAX}</span>
          </>
        )}
      </p>

      <label className={styles.calcLabel} htmlFor="calc-target">
        {t('grades.calculator.target')}
      </label>
      <TargetField value={target} onChange={setTarget} disabled={cc === null} />

      <Result outcome={outcome} />
    </div>
  );
}

/**
 * The target input.
 *
 * `type="text"` with `inputMode="decimal"`, NOT `type="number"`. A number input
 * returns an empty string for anything its own locale rejects, and gives no way
 * to see what was typed — so a French student entering "13,8" in a browser
 * running en-US would have the comma silently swallowed and the panel would
 * answer a question she did not ask. Parsing it ourselves (see calculator.ts)
 * makes the same keystrokes mean the same thing in both languages whatever
 * locale the browser is in, and `inputMode` still brings up the decimal keypad
 * on a phone.
 *
 * What the number input would have given for free is given back by hand: the
 * arrow keys step by the design's half point, and the value is clamped to the
 * 0-20 scale on blur.
 */
function TargetField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled: boolean;
}) {
  const { t } = useI18n();

  const step = (direction: 1 | -1) => {
    const current = parseTarget(value) ?? 0;
    onChange(String(stepTarget(current, direction)));
  };

  return (
    <>
      <input
        id="calc-target"
        className={`${styles.calcInput} num`}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        disabled={disabled}
        aria-describedby="calc-target-hint"
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
          event.preventDefault();
          step(event.key === 'ArrowUp' ? 1 : -1);
        }}
        onBlur={() => {
          const parsed = parseTarget(value);
          if (parsed === null) return;
          const clamped = Math.min(MARK_MAX, Math.max(0, parsed));
          if (clamped !== parsed) onChange(String(clamped));
        }}
      />
      <p id="calc-target-hint" className={styles.calcHint}>
        <Interpolated template={t('grades.calculator.range_hint')} values={{ max: MARK_MAX }} />
      </p>
    </>
  );
}

/** Everything the result block can be. */
type Outcome =
  /** The subject's continuous assessment is not published. */
  | { kind: 'no_cc' }
  /** The field is empty or not a number yet. */
  | { kind: 'no_target' }
  /** A number, but outside the 0-20 scale. */
  | { kind: 'out_of_range' }
  | { kind: 'verdict'; verdict: CalcVerdict };

const VERDICT_CLASS: Record<CalcVerdict['kind'], string> = {
  achieved: styles.calcResultAchieved,
  achievable: styles.calcResultAchievable,
  /*
   * Deliberately not the danger tone. "Impossible" is the commonest answer a
   * student in trouble will get, and it is information about arithmetic, not a
   * fault she committed — colouring it like a failed request would turn a fact
   * into an accusation.
   */
  impossible: styles.calcResultImpossible,
};

/**
 * The live result, crossfading between values.
 *
 * §9: the result number uses "the same crossfade technique" as the GPA hero —
 * old out over 100ms, new in over the following 150ms with a slight overlap. It
 * is literally the same animation: heroOut and heroIn are shared keyframes in
 * grades.module.css, so the two can never drift to different timings.
 *
 * Keyed on the RENDERED TEXT rather than on the outcome object. Typing "13.7"
 * then "13.70" produces two different targets and the same required mark, and
 * crossfading a number into itself is a flicker with no information in it.
 */
function Result({ outcome }: { outcome: Outcome }) {
  const { t } = useI18n();

  const view = describe(outcome, t);

  const [shown, setShown] = useState(view);
  const [leaving, setLeaving] = useState<ResultView | null>(null);

  if (shown.key !== view.key) {
    setLeaving(shown);
    setShown(view);
  }

  // The ENTERING layer clears the outgoing one: the exit finishes at 100ms and
  // the entrance at ~230ms, so clearing on the exit would cut the entrance off.
  useExitBackstop(leaving?.key, () => setLeaving(null));

  return (
    <div
      className={styles.calcResult}
      // The value changes without anything being pressed, so it has to announce
      // itself. Polite: a student typing must not be interrupted mid-keystroke.
      role="status"
      aria-live="polite"
    >
      {leaving !== null && (
        <div className={`${styles.calcResultLayer} ${styles.resultLeaving}`} aria-hidden="true">
          <ResultBody view={leaving} />
        </div>
      )}

      <div
        className={`${styles.calcResultLayer} ${leaving !== null ? styles.resultEntering : ''}`}
        onAnimationEnd={() => setLeaving(null)}
      >
        <ResultBody view={shown} />
      </div>
    </div>
  );
}

interface ResultView {
  /** Identity for the crossfade: same key, same pixels, no fade. */
  key: string;
  /** The big figure, or null when there is nothing to show one for. */
  value: string | null;
  /** The verdict's raw template, still holding its {{placeholders}}. */
  template: string;
  values: Record<string, string | number>;
  className: string;
}

function ResultBody({ view }: { view: ResultView }) {
  return (
    <>
      {view.value !== null && (
        <p className={`${styles.calcResultValue} ${view.className}`}>
          <span className="num">{view.value}</span>
          <span className={`${styles.calcSuffix} num`}>/ {MARK_MAX}</span>
        </p>
      )}
      <p className={styles.calcResultVerdict}>
        {/*
          Interpolated rather than a resolved string: the verdicts carry marks
          inside their sentences ("même avec 20/20 ... serait de 13.28"), and
          those figures have to stay on the Latin face in Arabic like every other
          number in the product. Wrapping the whole sentence in `.num` would drag
          the Arabic words onto a font with no Arabic glyphs.
        */}
        <Interpolated template={view.template} values={view.values} />
      </p>
    </>
  );
}

const VERDICT_KEYS: Record<CalcVerdict['kind'], TranslationKey> = {
  achieved: 'grades.calculator.verdict_achieved',
  achievable: 'grades.calculator.verdict_achievable',
  impossible: 'grades.calculator.verdict_impossible',
};

const PROMPT_KEYS: Record<Exclude<Outcome['kind'], 'verdict'>, TranslationKey> = {
  no_cc: 'grades.calculator.needs_cc',
  no_target: 'grades.calculator.needs_target',
  out_of_range: 'grades.calculator.out_of_range',
};

/**
 * Turns an outcome into the two lines the block shows.
 *
 * THE FIGURE ALWAYS MEANS THE SAME THING — the mark required at the final exam —
 * including when it is above 20. Swapping in a different quantity for the
 * impossible case would make the number unreadable at a glance; leaving it as
 * "24.33 / 20" is what makes the verdict obvious before the sentence under it
 * has been read, and the sentence then says what is still reachable.
 */
function describe(outcome: Outcome, t: I18nValue['t']): ResultView {
  /*
   * Called with no params, `t` returns the template with its {{placeholders}}
   * intact — the provider leaves unmatched ones in place deliberately — which is
   * exactly what Interpolated needs to put the figures on the Latin face.
   */
  if (outcome.kind !== 'verdict') {
    return {
      key: outcome.kind,
      value: null,
      template: t(PROMPT_KEYS[outcome.kind]),
      values: { max: MARK_MAX },
      className: '',
    };
  }

  const { verdict } = outcome;
  const value = verdict.required.toFixed(2);

  return {
    key: `${verdict.kind}:${value}`,
    value,
    template: t(VERDICT_KEYS[verdict.kind]),
    values:
      verdict.kind === 'impossible'
        ? { scale: MARK_MAX, max: verdict.maxReachable.toFixed(2) }
        : {},
    className: VERDICT_CLASS[verdict.kind],
  };
}
