// The GPA history's data rule: real published averages only, no estimates.
// Run: npm test  (node --test, Node 22.18+ / 23.6+).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gpaHistoryPoints, publishedRuns, showsGpaHistory } from '../utils/gpaHistory.ts';

const sem = (label: string, academicYear: string, gpa: number | null) => ({ label, academicYear, gpa });

test('0 published averages: no history offered, no invented point', () => {
  const semesters = [sem('S1', '2024-2025', null), sem('S2', '2024-2025', null)];
  assert.equal(showsGpaHistory(semesters), false);
  assert.equal(showsGpaHistory([]), false);
  assert.deepEqual(gpaHistoryPoints(semesters), [
    { label: 'S1', value: null },
    { label: 'S2', value: null },
  ]);
});

test('1 published average: no history offered, and it stays the only value', () => {
  const semesters = [sem('S1', '2024-2025', 12.65), sem('S2', '2024-2025', null)];
  assert.equal(showsGpaHistory(semesters), false);
  const points = gpaHistoryPoints(semesters);
  assert.deepEqual(points, [
    { label: 'S1', value: 12.65 },
    { label: 'S2', value: null },
  ]);
  // Nothing beyond the server's figure: no estimates before or after it.
  assert.deepEqual(
    points.filter((p) => p.value !== null).map((p) => p.value),
    [12.65]
  );
});

test('2 published averages: history offered, the real values in semester order', () => {
  // Out of order on purpose: the server returns semesters in no set order.
  const semesters = [sem('S2', '2024-2025', 12.28), sem('S1', '2024-2025', 12.65)];
  assert.equal(showsGpaHistory(semesters), true);
  assert.deepEqual(gpaHistoryPoints(semesters), [
    { label: 'S1', value: 12.65 },
    { label: 'S2', value: 12.28 },
  ]);
  assert.deepEqual(publishedRuns(gpaHistoryPoints(semesters)), [[0, 1]]);
});

test('a gap in the middle: no point for it, never 0, and the line breaks there', () => {
  const semesters = [
    sem('S1', '2025-2026', 14.1),
    sem('S1', '2024-2025', 12.65),
    sem('S2', '2024-2025', null),
  ];
  assert.equal(showsGpaHistory(semesters), true);
  const points = gpaHistoryPoints(semesters);
  assert.deepEqual(points, [
    { label: 'S1', value: 12.65 },
    { label: 'S2', value: null },
    { label: 'S1', value: 14.1 },
  ]);
  assert.ok(!points.some((p) => p.value === 0));
  // Two lone dots, no segment across S2.
  assert.deepEqual(publishedRuns(points), [[0], [2]]);
});

test('runs: consecutive published points share a line, a gap splits it', () => {
  const v = (value: number | null) => ({ label: '', value });
  assert.deepEqual(publishedRuns([v(10), v(11), v(null), v(12), v(13), v(null)]), [
    [0, 1],
    [3, 4],
  ]);
  assert.deepEqual(publishedRuns([]), []);
});
