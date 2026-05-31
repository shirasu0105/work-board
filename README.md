# work-board

仕事効率化Webアプリ（GTD風のタスク/プロジェクト/メモ管理）。ローカルPCのブラウザで動作する個人用ツール。

詳細仕様は `docs/SPEC.md`、要件は `docs/requirements.md` を参照。

## 技術スタック

- Next.js 16（App Router） / React 19 / TypeScript
- Tailwind CSS v4（`@theme` トークン、ライト/ダーク両対応）
- SQLite + Drizzle ORM（better-sqlite3） / drizzle-kit でマイグレーション
- zod（Server Action 境界の入力検証） / @dnd-kit（ドラッグ&ドロップ）

## アーキテクチャ概要

- 読み取りは Server Components（`src/lib/queries/`）、書き込みは Server Actions（`src/lib/actions/`）。
- 純粋なドメインロジックは `src/lib/domain/`（並び替えの再採番・日付計算など。ユニットテスト対象）。
- UI は `src/components/ui`（汎用）/ `src/components/layout`（サイドバー・ヘッダー・テーマ）/ `src/components/<feature>`。
- DB ファイルは `data/work-board.db`（`.gitignore` 済み）。

## セットアップ・起動

```bash
npm install

# DB 初期化（マイグレーション適用 → サンプルデータ投入）
npm run db:migrate
npm run db:seed

# 開発サーバ
npm run dev
```

`http://localhost:3000` を開く。シード済みデータでホーム/タスク/プロジェクト/設定が確認できる。

### DB 関連スクリプト

- `npm run db:generate` — `schema.ts` から SQL マイグレーションを生成
- `npm run db:migrate` — マイグレーションを `data/work-board.db` に適用
- `npm run db:seed` — サンプルデータ投入（既存データがある場合はスキップ）

### テスト

- `npm run test` — Vitest によるユニットテスト（`tests/unit/`、ドメインロジック：並び替え再採番・日付計算・タスク抽出）
- `npm run test:watch` — ウォッチモード
- `npx playwright test` — Playwright による主要動線 E2E（`tests/e2e/`、タスク作成→完了 / メモ作成→検索）。専用のテスト用 DB（`data/e2e.db`）を都度構築して実行するため、開発用データには影響しない。

> E2E 初回のみブラウザ取得が必要：`npx playwright install chromium`

## データのバックアップ（手動）

データは単一ファイル `data/work-board.db` に保存される。バックアップは開発サーバを停止した状態でこのファイルをコピーするだけでよい。

```bash
# 例: タイムスタンプ付きでコピー
cp data/work-board.db "data/backup-$(date +%Y%m%d).db"
```

復元はコピーしたファイルを `data/work-board.db` に戻す。

## 実装状況

`docs/SPEC.md` のマイルストーン **M0〜M11 をすべて実装済み（MVP完成）**:

- M0 基盤 / M1 カテゴリ管理 / M2 プロジェクト管理 / M3 タスク管理（リスト）
- M4 タスクかんばん + 待ち（ViewToggle、列間D&Dでステータス遷移、待ち入力ドロワー、待ちフィルタ専用列）
- M5 Inbox（追加 + D&D整理：タスク/プロジェクト/Someday化・削除、関連元をトランザクションで保持）
- M6 Someday/Maybe（簡易。タスクへの昇格を含む）
- M7 メモ（種別テンプレ minutes/tt/idea/research/worklog の作成・編集、一覧、検索バー）
- M8 日次ジャーナル（今日のひとこと + 未完了タスクから明日やること選択 → planned_date）
- M9 ホーム（2カラム：今日やること D&D ＋ 確認予定の待ち / Inbox / 進行中PJ / 最近のメモ / 各導線）
- M10 週次レビュー（1画面チェックリスト6セクション + 実施記録）
- M11 仕上げ（ユニット/E2E テスト、手動バックアップ手順、ドキュメント整合）

対象外（SPEC §8）：タグ / 添付 / 通知 / AI連携 / 認証 / 複数ユーザー / クラウド同期 など。
