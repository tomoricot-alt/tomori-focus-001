import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DayStat, formatDayLabel, formatDuration } from '../lib/stats';
import { colors } from '../theme';

export function History({ days, todayKey }: { days: DayStat[]; todayKey: string }) {
  const max = Math.max(1, ...days.map((d) => d.sessions));
  const total = days.reduce((a, d) => a + d.seconds, 0);
  const count = days.reduce((a, d) => a + d.sessions, 0);
  return (
    <View style={styles.card} accessibilityLabel="過去7日間の履歴">
      <Text style={styles.title}>過去7日間</Text>
      <Text style={styles.summary}>
        合計 {count}回 ・ {formatDuration(total)}
      </Text>
      {[...days].reverse().map((d) => (
        <View key={d.key} style={styles.row}>
          <Text style={[styles.day, d.key === todayKey && styles.today]}>
            {d.key === todayKey ? '今日' : formatDayLabel(d.date)}
          </Text>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${(d.sessions / max) * 100}%` }]} />
          </View>
          <Text style={styles.value}>
            {d.sessions}回 / {formatDuration(d.seconds)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.line },
  title: { fontSize: 16, fontWeight: '600', color: colors.ink },
  summary: { fontSize: 13, color: colors.sub, marginTop: 4, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  day: { width: 70, fontSize: 13, color: colors.sub },
  today: { color: colors.focus, fontWeight: '700' },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.focusSoft, overflow: 'hidden', marginHorizontal: 8 },
  bar: { height: 8, borderRadius: 4, backgroundColor: colors.focus },
  value: { width: 96, fontSize: 12, color: colors.ink, textAlign: 'right' },
});
