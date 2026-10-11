// Web版の動作確認（Playwright + Chromium）。事前に `npm run build:web` が必要。
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { serve } from './serve-dist.mjs';

const executablePath = process.env.CHROMIUM_PATH || undefined;
const server = await serve(4173);
const url = 'http://localhost:4173/tomori-focus-001/';
const browser = await chromium.launch(executablePath ? { executablePath } : {});
const results = [];
const check = async (name, fn) => { await fn(); results.push(name); console.log('✔', name); };

try {
  // iPhone相当の画面サイズ
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, locale: 'ja-JP' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.clock.install({ time: new Date(2026, 9, 11, 10, 0, 0) });
  await page.goto(url);
  const text = (t) => page.getByText(t, { exact: true }).first();

  await check('初期表示: 25:00 と日本語UI', async () => {
    await text('25:00').waitFor();
    await text('TOMORI FOCUS').waitFor();
    await text('開始').waitFor();
  });
  await check('開始→カウントダウン→一時停止→再開', async () => {
    await text('開始').click();
    await page.clock.runFor(10_000);
    await text('24:50').waitFor();
    await text('一時停止').click();
    await page.clock.runFor(30_000);
    await text('24:50').waitFor(); // 停止中は進まない
    await text('再開').click();
    await page.clock.runFor(5_000);
    await text('24:45').waitFor();
  });
  await check('リセットで25:00に戻る', async () => {
    await text('リセット').click();
    await text('25:00').waitFor();
  });
  await check('25分完了で記録が1回/25分になり休憩へ切替', async () => {
    await text('開始').click();
    await page.clock.runFor(25 * 60 * 1000 + 1000);
    await text('05:00').waitFor();
    await text('合計 1回 ・ 25分').waitFor();
    await page.getByText('今日の集中回数').waitFor();
  });
  await check('休憩5分の完了後に集中へ戻る（記録は増えない）', async () => {
    await text('開始').click();
    await page.clock.runFor(5 * 60 * 1000 + 1000);
    await text('25:00').waitFor();
  });
  await check('7日間履歴に今日の記録が表示される', async () => {
    await text('過去7日間').waitFor();
    await text('今日').waitFor();
    await text('合計 1回 ・ 25分').waitFor();
  });
  await check('リロード後も記録が残る（端末内保存）', async () => {
    await page.reload();
    await text('合計 1回 ・ 25分').waitFor();
  });
  await check('休憩タブ切替で05:00', async () => {
    await text('休憩 5分').click();
    await text('05:00').waitFor();
  });
  await check('横スクロールなし(iPhone幅)', async () => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(overflow, false);
  });
  await page.screenshot({ path: process.env.SHOT || 'e2e-screenshot.png', fullPage: true });
  assert.deepEqual(errors, []);
  console.log(`\n${results.length} 件すべて成功`);
} catch (e) {
  console.error('✘ 失敗:', e);
  process.exitCode = 1;
} finally {
  await browser.close();
  server.close();
}
