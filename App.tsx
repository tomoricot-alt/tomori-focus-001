import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { formatClock, progress } from './src/lib/timer';
import { Records, addSession, dateKey, formatDuration, lastDays } from './src/lib/stats';
import { loadRecords, saveRecords } from './src/lib/storage';
import { useTimer } from './src/useTimer';
import { History } from './src/components/History';
import { colors } from './src/theme';

export default function App() {
  const [records, setRecords] = useState<Records>({});
  const loaded = useRef(false);

  useEffect(() => {
    loadRecords().then((r) => {
      // 読み込み中に完了した分を失わないようマージ
      setRecords((cur) => {
        const merged: Records = { ...r };
        for (const [k, v] of Object.entries(cur)) {
          const base = merged[k] ?? { sessions: 0, seconds: 0 };
          merged[k] = { sessions: base.sessions + v.sessions, seconds: base.seconds + v.seconds };
        }
        return merged;
      });
      loaded.current = true;
    });
  }, []);

  useEffect(() => {
    if (loaded.current) saveRecords(records);
  }, [records]);

  const onFocusComplete = useCallback((seconds: number) => {
    setRecords((r) => addSession(r, new Date(), seconds));
  }, []);

  const { state, now, remainingMs, startTimer, pauseTimer, resetTimer, selectMode } = useTimer({ onFocusComplete });

  const isFocus = state.mode === 'focus';
  const accent = isFocus ? colors.focus : colors.rest;
  const accentSoft = isFocus ? colors.focusSoft : colors.restSoft;
  const clock = formatClock(remainingMs);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = state.status === 'idle' ? 'TOMORI FOCUS' : `${clock} ${isFocus ? '集中' : '休憩'} - TOMORI FOCUS`;
    }
  }, [clock, isFocus, state.status]);

  const today = new Date();
  const todayKey = dateKey(today);
  const days = useMemo(() => lastDays(records, new Date(), 7), [records, todayKey]);
  const todayRec = records[todayKey] ?? { sessions: 0, seconds: 0 };
  const pct = progress(state, now) * 100;
  const running = state.status === 'running';

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.container}>
          <Text style={styles.brand}>TOMORI FOCUS</Text>

          <View style={styles.tabs}>
            {(['focus', 'break'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => selectMode(m)}
                accessibilityRole="button"
                accessibilityState={{ selected: state.mode === m }}
                style={[styles.tab, state.mode === m && { backgroundColor: accentSoft }]}
              >
                <Text style={[styles.tabText, state.mode === m && { color: accent, fontWeight: '700' }]}>
                  {m === 'focus' ? '集中 25分' : '休憩 5分'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.dial, { borderColor: accentSoft }]}>
            <Text style={[styles.clock, { color: accent }]}>{clock}</Text>
            <Text style={styles.status}>
              {running ? (isFocus ? '集中しています' : '休憩しています') : state.status === 'paused' ? '一時停止中' : '準備OK'}
            </Text>
          </View>

          <View style={[styles.progressTrack, { backgroundColor: accentSoft }]}>
            <View style={[styles.progressBar, { width: `${pct}%`, backgroundColor: accent }]} />
          </View>

          <View style={styles.buttons}>
            <Pressable
              onPress={running ? pauseTimer : startTimer}
              accessibilityRole="button"
              style={[styles.primary, { backgroundColor: accent }]}
            >
              <Text style={styles.primaryText}>{running ? '一時停止' : state.status === 'paused' ? '再開' : '開始'}</Text>
            </Pressable>
            <Pressable onPress={resetTimer} accessibilityRole="button" style={styles.secondary}>
              <Text style={styles.secondaryText}>リセット</Text>
            </Pressable>
          </View>

          <View style={styles.todayCard}>
            <View style={styles.todayCol}>
              <Text style={styles.todayLabel}>今日の集中回数</Text>
              <Text style={styles.todayValue}>{todayRec.sessions}<Text style={styles.unit}> 回</Text></Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.todayCol}>
              <Text style={styles.todayLabel}>今日の合計時間</Text>
              <Text style={styles.todayValue}>{formatDuration(todayRec.seconds)}</Text>
            </View>
          </View>

          <History days={days} todayKey={todayKey} />

          <Text style={styles.footer}>記録はこの端末内にのみ保存されます</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1, alignItems: 'center' },
  container: { width: '100%', maxWidth: 480, padding: 20, paddingTop: 28, gap: 20 },
  brand: { textAlign: 'center', fontSize: 14, letterSpacing: 4, color: colors.sub, fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: colors.line },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabText: { fontSize: 15, color: colors.sub },
  dial: {
    alignSelf: 'center', width: 260, height: 260, borderRadius: 130, borderWidth: 10,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card,
  },
  clock: { fontSize: 64, fontWeight: '300', fontVariant: ['tabular-nums'] },
  status: { fontSize: 14, color: colors.sub, marginTop: 4 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBar: { height: 6, borderRadius: 3 },
  buttons: { flexDirection: 'row', gap: 12 },
  primary: { flex: 2, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  secondary: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  secondaryText: { color: colors.ink, fontSize: 16 },
  todayCard: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.line },
  todayCol: { flex: 1, alignItems: 'center' },
  todayLabel: { fontSize: 12, color: colors.sub },
  todayValue: { fontSize: 26, color: colors.ink, fontWeight: '600', marginTop: 4 },
  unit: { fontSize: 14, fontWeight: '400' },
  divider: { width: 1, backgroundColor: colors.line },
  footer: { textAlign: 'center', fontSize: 12, color: colors.sub, paddingBottom: 24 },
});
