/**
 * utils/currentSemester — the rule that decides the current semester.
 *
 * Run:  cd backend && npm test
 *
 * Pure: every case passes its own `now`, so none depends on today's date.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  djiboutiDay,
  pickCurrentSemester,
  resolveCurrentSemester,
  withComputedCurrent,
} from '../src/utils/currentSemester';

/** A semester as the seed stores it: each date at 00:00 UTC. */
const sem = (id: string, start: string, end: string, isCurrent = false) => ({
  id,
  startDate: new Date(`${start}T00:00:00Z`),
  endDate: new Date(`${end}T00:00:00Z`),
  isCurrent,
});

// The live data's shape: 2024-2025 S1 and S2.
const S1 = sem('s1-2024', '2024-09-15', '2025-01-31');
const S2 = sem('s2-2024', '2025-02-01', '2025-06-30');
const S1_NEXT = sem('s1-2025', '2025-09-15', '2026-01-31');
const ALL = [S2, S1, S1_NEXT]; // deliberately not in date order

const at = (iso: string) => new Date(iso);

test('inside a semester: the semester whose dates contain today', () => {
  assert.equal(pickCurrentSemester(ALL, at('2024-11-20T09:00:00Z'))?.id, S1.id);
  assert.equal(pickCurrentSemester(ALL, at('2025-04-10T09:00:00Z'))?.id, S2.id);
  assert.equal(pickCurrentSemester(ALL, at('2025-10-01T09:00:00Z'))?.id, S1_NEXT.id);
});

test('the start and end days are both inside', () => {
  assert.equal(pickCurrentSemester(ALL, at('2024-09-15T06:00:00Z'))?.id, S1.id);
  assert.equal(pickCurrentSemester(ALL, at('2025-06-30T18:00:00Z'))?.id, S2.id);
});

test('in a break: the most recent semester that has started', () => {
  // Summer, between S2 2024-2025 and S1 2025-2026.
  assert.equal(pickCurrentSemester(ALL, at('2025-08-01T09:00:00Z'))?.id, S2.id);
  // After every semester has ended (today, on the live data): the latest.
  assert.equal(pickCurrentSemester([S1, S2], at('2026-11-20T09:00:00Z'))?.id, S2.id);
});

test('before any semester: the earliest upcoming one', () => {
  assert.equal(pickCurrentSemester(ALL, at('2024-06-01T09:00:00Z'))?.id, S1.id);
});

test('no semesters at all: null', () => {
  assert.equal(pickCurrentSemester([], at('2025-01-01T00:00:00Z')), null);
});

test('overlap: the one that started most recently wins', () => {
  const longS1 = sem('long-s1', '2024-09-15', '2025-03-15'); // runs into S2
  const now = at('2025-02-20T09:00:00Z');
  assert.equal(pickCurrentSemester([longS1, S2], now)?.id, S2.id);
  assert.equal(pickCurrentSemester([S2, longS1], now)?.id, S2.id, 'row order does not matter');
  // Before S2 starts, only the long S1 is in progress.
  assert.equal(pickCurrentSemester([longS1, S2], at('2025-01-20T09:00:00Z'))?.id, longS1.id);
});

test('overlap with the same start day: a stable answer whatever the row order', () => {
  const a = sem('a', '2025-02-01', '2025-06-30');
  const b = sem('b', '2025-02-01', '2025-07-15');
  const now = at('2025-03-01T09:00:00Z');
  assert.equal(pickCurrentSemester([a, b], now)?.id, b.id);
  assert.equal(pickCurrentSemester([b, a], now)?.id, b.id);
});

test('midnight in Djibouti (UTC+3) is the boundary, not midnight UTC', () => {
  // 31 January 23:59:59 in Djibouti: still S1's last day.
  assert.equal(pickCurrentSemester(ALL, at('2025-01-31T20:59:59Z'))?.id, S1.id);
  // 1 February 00:00 in Djibouti, still 31 January in UTC: S2 has begun.
  assert.equal(pickCurrentSemester(ALL, at('2025-01-31T21:00:00Z'))?.id, S2.id);
  assert.equal(djiboutiDay(at('2025-01-31T21:00:00Z')), '2025-02-01');
  assert.equal(djiboutiDay(at('2025-01-31T20:59:59Z')), '2025-01-31');
});

test('dates saved by the admin date picker (local midnight, 21:00 UTC the day before) read as the same days', () => {
  // The picker in Djibouti sends 1 February 00:00 local as 2025-01-31T21:00Z.
  const pickerS1 = { id: 'p1', startDate: at('2024-09-14T21:00:00Z'), endDate: at('2025-01-30T21:00:00Z') };
  const pickerS2 = { id: 'p2', startDate: at('2025-01-31T21:00:00Z'), endDate: at('2025-06-29T21:00:00Z') };
  assert.equal(pickCurrentSemester([pickerS1, pickerS2], at('2025-01-31T20:59:59Z'))?.id, 'p1');
  assert.equal(pickCurrentSemester([pickerS1, pickerS2], at('2025-01-31T21:00:00Z'))?.id, 'p2');
});

test('the stored is_current flag is ignored', () => {
  const flaggedS1 = { ...S1, isCurrent: true };
  const unflaggedS2 = { ...S2, isCurrent: false };
  assert.equal(pickCurrentSemester([flaggedS1, unflaggedS2], at('2025-04-10T09:00:00Z'))?.id, S2.id);
});

test('withComputedCurrent: exactly one isCurrent, the computed one', () => {
  const rows = withComputedCurrent([{ ...S1, isCurrent: true }, S2, S1_NEXT], at('2025-04-10T09:00:00Z'));
  assert.deepEqual(
    rows.map((r) => [r.id, r.isCurrent]),
    [
      [S1.id, false],
      [S2.id, true],
      [S1_NEXT.id, false],
    ]
  );
});

test('resolveCurrentSemester reads every semester and applies the rule', async () => {
  let calls = 0;
  const db = {
    semester: {
      findMany: async (args?: unknown) => {
        calls += 1;
        assert.equal(args, undefined, 'no filter: the rule, not a WHERE, decides');
        return ALL;
      },
    },
  };
  const got = await resolveCurrentSemester(db as never, at('2025-04-10T09:00:00Z'));
  assert.equal(got?.id, S2.id);
  assert.equal(calls, 1);
});
