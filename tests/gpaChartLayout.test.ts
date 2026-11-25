// The GPA history chart's x positions: each label sits under its own point,
// semesters left to right in French and right to left in Arabic.
// Run: npm test  (node --test, Node 22.18+ / 23.6+).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gpaChartLayout } from '../utils/gpaHistory.ts';

// The sheet's own numbers: gutters 28 (y-axis side) and 12, labels 40 wide.
const LABEL_W = 40;
const frame = (rtl: boolean) => ({ width: 340, padStart: 28, padEnd: 12, rtl });

const xs = (rtl: boolean, count: number) => gpaChartLayout(count, frame(rtl), LABEL_W).slots.map((s) => s.x);

test('French: semesters run left to right, the y-axis gutter on the left', () => {
  const layout = gpaChartLayout(4, frame(false), LABEL_W);
  assert.equal(layout.plotLeft, 28);
  assert.equal(layout.plotRight, 328);
  assert.deepEqual(xs(false, 4), [28, 128, 228, 328]);
});

test('Arabic: semesters run right to left, the y-axis gutter on the right', () => {
  const layout = gpaChartLayout(4, frame(true), LABEL_W);
  assert.equal(layout.plotLeft, 12);
  assert.equal(layout.plotRight, 312);
  assert.deepEqual(xs(true, 4), [312, 212, 112, 12]);
});

test('Arabic is French mirrored: the same semester sits at width − x', () => {
  const ltr = xs(false, 5);
  const rtl = xs(true, 5);
  ltr.forEach((x, i) => assert.equal(rtl[i], 340 - x, `semester ${i}`));
});

test('every label is centred on its own point, in both directions', () => {
  for (const rtl of [false, true]) {
    for (const count of [1, 2, 3, 6]) {
      gpaChartLayout(count, frame(rtl), LABEL_W).slots.forEach((s, i) => {
        assert.equal(s.labelLeft + LABEL_W / 2, s.x, `rtl=${rtl} count=${count} semester ${i}`);
      });
    }
  }
});

test('the oldest semester is on the reading-start edge, the newest on the reading-end edge', () => {
  const [ltrFirst, , ltrLast] = xs(false, 3);
  const [rtlFirst, , rtlLast] = xs(true, 3);
  assert.ok(ltrFirst < ltrLast);
  assert.ok(rtlFirst > rtlLast);
});

test('a single semester sits mid-plot, in both directions', () => {
  assert.deepEqual(xs(false, 1), [178]);
  assert.deepEqual(xs(true, 1), [162]);
});

test('no semesters: no slots', () => {
  assert.deepEqual(gpaChartLayout(0, frame(true), LABEL_W).slots, []);
});

test('an unmeasured chart (width 0) yields finite positions, never NaN', () => {
  for (const rtl of [false, true]) {
    gpaChartLayout(3, { ...frame(rtl), width: 0 }, LABEL_W).slots.forEach((s) => {
      assert.ok(Number.isFinite(s.x) && Number.isFinite(s.labelLeft));
    });
  }
});
