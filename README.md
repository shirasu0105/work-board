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

## データのバックアップ（手動）

データは単一ファイル `data/work-board.db` に保存される。バックアップは開発サーバを停止した状態でこのファイルをコピーするだけでよい。

```bash
# 例: タイムスタンプ付きでコピー
cp data/work-board.db "data/backup-$(date +%Y%m%d).db"
```

復元はコピーしたファイルを `data/work-board.db` に戻す。

## 実装状況

`docs/SPEC.md` のマイルストーンに沿って段階的に構築中。現在 **M0〜M3**（基盤 / カテゴリ管理 / プロジェクト管理 / タスク管理リスト）まで実装済み。M4 以降（かんばん・待ち・Inbox・メモ・ジャーナル・レビュー・ホーム）は未着手で、該当画面は「準備中」表示。
