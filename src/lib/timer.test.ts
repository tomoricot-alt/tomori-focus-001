import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DURATIONS_MS, initialState, start, pause, reset, getRemainingMs, isFinished,
  advance, formatClock, switchMode, progress,
} from './timer';

test('初期状態は25分の集中・停止中', () => {
  const s = initialState();
  assert.equal(s.mode, 'focus');
  assert.equal(s.status, 'idle');
  assert.equal(s.remainingMs, 25 * 60 * 1000);
});

test('休憩は5分', () => {
  assert.equal(switchMode('break').remainingMs, 5 * 60 * 1000);
});

test('開始後は経過時間に応じて残りが減る', () => {
  const s = start(initialState(), 1000);
  assert.equal(getRemainingMs(s, 1000 + 60_000), DURATIONS_MS.focus - 60_000);
});

test('一時停止で残りが固定され、再開で続きから進む', () => {
  let s = start(initialState(), 0);
  s = pause(s, 10_000);
  assert.equal(s.status, 'paused');
  assert.equal(getRemainingMs(s, 999_999), DURATIONS_MS.focus - 10_000);
  s = start(s, 50_000);
  assert.equal(getRemainingMs(s, 60_000), DURATIONS_MS.focus - 20_000);
});

test('リセットで同じモードの初期状態に戻る', () => {
  let s = start(switchMode('break'), 0);
  s = reset(pause(s, 1000));
  assert.deepEqual(s, initialState('break'));
});

test('終了判定と次モードへの遷移', () => {
  const s = start(initialState(), 0);
  assert.equal(isFinished(s, DURATIONS_MS.focus - 1), false);
  assert.equal(isFinished(s, DURATIONS_MS.focus), true);
  assert.equal(getRemainingMs(s, DURATIONS_MS.focus + 5000), 0);
  assert.equal(advance(s).mode, 'break');
  assert.equal(advance(advance(s)).mode, 'focus');
});

test('停止中は終了扱いにならない', () => {
  assert.equal(isFinished(initialState(), 10 ** 12), false);
});

test('mm:ss 表示（切り上げ）', () => {
  assert.equal(formatClock(25 * 60 * 1000), '25:00');
  assert.equal(formatClock(59_001), '01:00');
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(-5), '00:00');
});

test('進捗率', () => {
  const s = start(initialState(), 0);
  assert.equal(progress(s, 0), 0);
  assert.equal(progress(s, DURATIONS_MS.focus / 2), 0.5);
});
