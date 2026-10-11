import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addSession, dateKey, lastDays, formatDuration, formatDayLabel, sanitizeRecords,
} from './stats';

test('dateKey はローカル日付をゼロ埋めで返す', () => {
  assert.equal(dateKey(new Date(2026, 0, 5)), '2026-01-05');
});

test('addSession は同じ日に加算する', () => {
  const d = new Date(2026, 9, 11, 10);
  let r = addSession({}, d, 1500);
  r = addSession(r, new Date(2026, 9, 11, 23), 1500);
  assert.deepEqual(r['2026-10-11'], { sessions: 2, seconds: 3000 });
});

test('addSession は元のデータを変更しない', () => {
  const base = {};
  addSession(base, new Date(), 1500);
  assert.deepEqual(base, {});
});

test('lastDays は7日分を古い順に返し、記録なしは0', () => {
  const today = new Date(2026, 9, 11);
  const r = addSession({}, new Date(2026, 9, 9), 1500);
  const days = lastDays(r, today);
  assert.equal(days.length, 7);
  assert.equal(days[0].key, '2026-10-05');
  assert.equal(days[6].key, '2026-10-11');
  assert.equal(days[4].sessions, 1);
  assert.equal(days[6].sessions, 0);
});

test('lastDays は月またぎ・年またぎでも正しい', () => {
  const days = lastDays({}, new Date(2026, 0, 3));
  assert.equal(days[0].key, '2025-12-28');
});

test('formatDuration', () => {
  assert.equal(formatDuration(0), '0分');
  assert.equal(formatDuration(1500), '25分');
  assert.equal(formatDuration(5400), '1時間30分');
});

test('formatDayLabel', () => {
  assert.equal(formatDayLabel(new Date(2026, 9, 11)), '10/11(日)');
});

test('sanitizeRecords は不正な値を除外する', () => {
  const out = sanitizeRecords({
    '2026-10-11': { sessions: 2, seconds: 3000 },
    bad: { sessions: 1, seconds: 1 },
    '2026-10-10': { sessions: -1, seconds: 5 },
    '2026-10-09': 'x',
  });
  assert.deepEqual(out, { '2026-10-11': { sessions: 2, seconds: 3000 } });
  assert.deepEqual(sanitizeRecords(null), {});
});
