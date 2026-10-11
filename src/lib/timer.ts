export type Mode = 'focus' | 'break';
export type Status = 'idle' | 'running' | 'paused';

export const DURATIONS_MS: Record<Mode, number> = {
  focus: 25 * 60 * 1000,
  break: 5 * 60 * 1000,
};

export interface TimerState {
  mode: Mode;
  status: Status;
  /** 停止中・一時停止中の残り時間(ms)。実行中は endAt から算出する */
  remainingMs: number;
  /** 実行中の終了予定時刻(epoch ms) */
  endAt: number | null;
}

export function initialState(mode: Mode = 'focus'): TimerState {
  return { mode, status: 'idle', remainingMs: DURATIONS_MS[mode], endAt: null };
}

/** 現在の残り時間(ms)。端末のスリープ等で tick が止まっても正確。 */
export function getRemainingMs(state: TimerState, now: number): number {
  if (state.status === 'running' && state.endAt !== null) {
    return Math.max(0, state.endAt - now);
  }
  return state.remainingMs;
}

export function start(state: TimerState, now: number): TimerState {
  if (state.status === 'running') return state;
  return { ...state, status: 'running', endAt: now + state.remainingMs };
}

export function pause(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state;
  return { ...state, status: 'paused', remainingMs: getRemainingMs(state, now), endAt: null };
}

/** 現在のモードの最初の状態に戻す */
export function reset(state: TimerState): TimerState {
  return initialState(state.mode);
}

export function switchMode(mode: Mode): TimerState {
  return initialState(mode);
}

export function isFinished(state: TimerState, now: number): boolean {
  return state.status === 'running' && getRemainingMs(state, now) <= 0;
}

export function otherMode(mode: Mode): Mode {
  return mode === 'focus' ? 'break' : 'focus';
}

/** 完了後、次のモードの待機状態へ進む */
export function advance(state: TimerState): TimerState {
  return initialState(otherMode(state.mode));
}

/** 秒数を mm:ss に整形（残りは切り上げ表示） */
export function formatClock(ms: number): string {
  const total = Math.ceil(Math.max(0, ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** 0〜1 の進捗率 */
export function progress(state: TimerState, now: number): number {
  const total = DURATIONS_MS[state.mode];
  return Math.min(1, Math.max(0, 1 - getRemainingMs(state, now) / total));
}
