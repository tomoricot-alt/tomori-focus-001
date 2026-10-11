import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Vibration } from 'react-native';
import {
  TimerState, DURATIONS_MS, initialState, start, pause, reset, switchMode,
  isFinished, advance, getRemainingMs, Mode,
} from './lib/timer';

interface Options {
  /** 集中セッション完了時に呼ばれる(秒数) */
  onFocusComplete: (seconds: number) => void;
}

function notifyDone() {
  if (Platform.OS === 'web') {
    try {
      const Ctx = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 660;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // 音が鳴らせない環境では何もしない
    }
  } else {
    Vibration.vibrate([0, 400, 200, 400]);
  }
}

export function useTimer({ onFocusComplete }: Options) {
  const [state, setState] = useState<TimerState>(() => initialState());
  const [now, setNow] = useState(() => Date.now());
  const stateRef = useRef(state);
  stateRef.current = state;
  const cbRef = useRef(onFocusComplete);
  cbRef.current = onFocusComplete;

  // 実行中のみ 250ms ごとに現在時刻を更新（終了時刻ベースなのでズレない）
  useEffect(() => {
    if (state.status !== 'running') return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const cur = stateRef.current;
      if (isFinished(cur, t)) {
        if (cur.mode === 'focus') cbRef.current(DURATIONS_MS.focus / 1000);
        notifyDone();
        setState(advance(cur));
      }
    }, 250);
    return () => clearInterval(id);
  }, [state.status]);

  const startTimer = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setState((s) => start(s, t));
  }, []);
  const pauseTimer = useCallback(() => {
    const t = Date.now();
    setNow(t);
    setState((s) => pause(s, t));
  }, []);
  const resetTimer = useCallback(() => setState((s) => reset(s)), []);
  const selectMode = useCallback((m: Mode) => setState(switchMode(m)), []);

  return {
    state,
    now,
    remainingMs: getRemainingMs(state, now),
    startTimer,
    pauseTimer,
    resetTimer,
    selectMode,
  };
}
