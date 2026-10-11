import AsyncStorage from '@react-native-async-storage/async-storage';
import { Records, sanitizeRecords } from './stats';

const KEY = 'tomori-focus:records:v1';

export async function loadRecords(): Promise<Records> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? sanitizeRecords(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export async function saveRecords(records: Records): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(records));
  } catch {
    // 保存失敗時もタイマー動作は継続する
  }
}
