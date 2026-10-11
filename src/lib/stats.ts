export interface DayRecord {
  sessions: number;
  seconds: number;
}
/** キーはローカル日付 YYYY-MM-DD */
export type Records = Record<string, DayRecord>;

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addSession(records: Records, date: Date, seconds: number): Records {
  const key = dateKey(date);
  const prev = records[key] ?? { sessions: 0, seconds: 0 };
  return { ...records, [key]: { sessions: prev.sessions + 1, seconds: prev.seconds + seconds } };
}

export interface DayStat extends DayRecord {
  key: string;
  date: Date;
}

/** today を含む過去 days 日分（古い→新しい順） */
export function lastDays(records: Records, today: Date, days = 7): DayStat[] {
  const out: DayStat[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = dateKey(d);
    const r = records[key] ?? { sessions: 0, seconds: 0 };
    out.push({ key, date: d, sessions: r.sessions, seconds: r.seconds });
  }
  return out;
}

export function formatDuration(seconds: number): string {
  const totalMin = Math.floor(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}分`;
  return `${h}時間${m}分`;
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];
export function formatDayLabel(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`;
}

/** 保存データの形式チェック。壊れた値は捨てる */
export function sanitizeRecords(raw: unknown): Records {
  const out: Records = {};
  if (typeof raw !== 'object' || raw === null) return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || typeof v !== 'object' || v === null) continue;
    const { sessions, seconds } = v as Partial<DayRecord>;
    if (
      typeof sessions === 'number' && Number.isFinite(sessions) && sessions >= 0 &&
      typeof seconds === 'number' && Number.isFinite(seconds) && seconds >= 0
    ) {
      out[k] = { sessions: Math.floor(sessions), seconds: Math.floor(seconds) };
    }
  }
  return out;
}
