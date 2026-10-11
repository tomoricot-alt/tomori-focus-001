# TOMORI FOCUS

**TOMORI APP LAB 第1号アプリ** — 仕事や勉強のための、シンプルで落ち着いた集中タイマー。

サーバー・ログイン・有料API・外部通信は一切不要。記録はすべて端末内に保存されます。

## 機能

- 25分の集中タイマー / 5分の休憩タイマー（完了すると自動で次のモードへ切替）
- 開始・一時停止・再開・リセット
- 1日の集中回数と合計時間の記録（25分を完了したセッションのみカウント）
- 過去7日間の履歴表示（日別の回数・時間・棒グラフ）
- 端末内保存（AsyncStorage。Webではブラウザの localStorage）
- 日本語UI / iPhone Safari 対応のレスポンシブ表示
- 終了時に通知音（Web）またはバイブレーション（モバイル）

タイマーは「終了予定時刻」を基準に計算するため、画面のスリープやタブの非アクティブ化でズレにくい作りです。

## 技術構成

React Native / Expo (SDK 57) / TypeScript。Web版は `react-native-web` で出力し、将来のiOSアプリ化にも同一コードを使えます。

```
App.tsx              画面
src/lib/timer.ts     タイマーの純粋ロジック
src/lib/stats.ts     日別記録・7日間集計
src/lib/storage.ts   端末内保存
src/useTimer.ts      タイマー用フック
scripts/             Web版のE2E確認スクリプト
```

## 起動方法

Node.js 20 以上が必要です。

```bash
npm install
npm run web      # ブラウザで開く
npm start        # Expo開発サーバー（QRコードを Expo Go で読み取ればiPhone実機でも確認可）
npm run ios      # iOSシミュレーター（macOS + Xcode が必要）
```

## テスト手順

```bash
npm run typecheck    # 型チェック
npm test             # ユニットテスト（タイマー・集計ロジック）
npm run build:web    # Web版ビルド（dist/ に出力）

# ブラウザでの動作確認(E2E)。事前に build:web を実行
npx playwright-core install chromium   # 初回のみ
node scripts/e2e.mjs
```

E2E は、iPhone相当の画面サイズで 開始→一時停止→再開→リセット→25分完了→記録反映→リロード後の保持 までを自動確認します。

GitHub Actions（`.github/workflows/ci.yml`）が、Pull Request と作業ブランチへの push で上記すべてを自動実行します。

## GitHub Pages への公開手順

Web版は `https://<ユーザー名>.github.io/tomori-focus-001/` で公開されます（`app.json` の `experiments.baseUrl` で設定済み）。

**初回のみ（リポジトリ管理者の操作）**

1. GitHub のリポジトリ → **Settings → Pages**
2. **Build and deployment → Source** を **GitHub Actions** に変更

**以降は自動**

- `main` にマージされると `.github/workflows/deploy-pages.yml` が型チェック・テスト・ビルドを行い、自動で公開します。
- 手動で再公開する場合は Actions タブの「Deploy to GitHub Pages」から *Run workflow*。

> リポジトリ名を変える場合は `app.json` の `baseUrl` も同じ名前に変更してください。

### iPhone でホーム画面に追加する

Safari で公開URLを開き、共有ボタン →「ホーム画面に追加」。

## 今後の予定

- iOSアプリ化（EAS Build / App Store 提出。Apple Developer Program の登録が別途必要）
- 目標回数の設定、集中時間のカスタマイズ
- バックグラウンド時のローカル通知
