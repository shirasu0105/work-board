---
version: v1.0.0
released_at: 2026-05-30
based_on: なし（初版）
mode: mvp
---

# Release v1.0.0

## 概要

仕事効率化Webアプリ「work-board」初版（個人利用・ローカル起動）の MVP。Inbox からの素早い収集と振り分けを起点に、タスク・プロジェクト・待ち状態・メモ・日次ジャーナル・週次レビューを横断管理できる。Next.js App Router ＋ Prisma/SQLite によるローカル完結型アプリとして全 9 画面を提供する。

## 変更内容（フェーズ別）

- Phase 1: アプリ基盤・サイドナビ・空画面雛形 ─ Next.js App Router の土台、DESIGN.md トークンの Tailwind 反映、サイドバー＋トップバーの 2 カラム共通レイアウト、全 9 画面への遷移雛形と UI プリミティブ群を整備
- Phase 2: データモデル整備とカテゴリ管理 ─ Prisma/SQLite による永続化基盤を構築し、全エンティティの最小スキーマと初回マイグレーションを作成。全作業対象の前提となるカテゴリの CRUD・並び替え・表示 ON/OFF を完成
- Phase 3: タスク管理（リスト CRUD＋ステータス）─ タスクの追加・編集・ステータス変更・完了・削除をリスト表示中心で実装し、カテゴリ分類のうえ永続化
- Phase 4: Inbox とプロジェクト管理 ─ Inbox の素早い収集とタスク/プロジェクト/Someday への振り分け、プロジェクト CRUD とタスクのプロジェクト紐付けを活性化
- Phase 5: 待ち状態管理とタスクかんばん表示 ─ 待ち相手・待ち理由を必須とする「待ち」サブ状態の付与/解除と、5 列のかんばん表示（リスト/かんばん切替）を追加
- Phase 6: メモ管理（種別フォーマット切替）─ 5 種別（議事録 / TTメモ / 思いつきメモ / 調査メモ / 作業ログ）の入力フォーマット切替と、タイムライン形式の一覧を実装
- Phase 7: ホーム集約と日次ジャーナル ─ タスク・待ち・Inbox・進行中プロジェクト・最近メモをホームに集約表示し、日次ジャーナルで選んだ「明日やること」が翌日のホームへ反映される導線を完成
- Phase 8: 週次レビュー・検索/絞り込み・仕上げ ─ 週次レビュー 6 ステップのステッパー UI、メモ/タスクの検索・絞り込み、Someday/Maybe の簡易実装、空状態・バリデーション・レスポンシブ整備で MVP を仕上げ

## 影響範囲（フェーズ横断サマリ）

- 主要な変更ファイル群:
  - `prisma/schema.prisma` ＋ `prisma/migrations/`（Category / Project / Task / Memo / InboxItem / SomedayItem / DailyJournal / JournalSelection / WaitingState）
  - `lib/db/*`（category / task / inbox / project / waiting / memo / journal / home / someday のサーバー側関数）
  - `app/api/**`（tasks / inbox / projects / memos / journals / someday など REST ルート）
  - `app/**/page.tsx`（ホーム / Inbox / タスク / タスク待ち / プロジェクト / メモ / メモ作成 / メモ詳細 / 日次ジャーナル / 週次レビュー / 設定）
  - `components/**`（layout / ui / task / memo 等のコンポーネント群）
- API スキーマ変更: 初版のため全 API が新規追加（破壊的変更なし）
- DB / 永続データの変更: SQLite を Prisma で新規導入。初版のため全テーブル新規

## 検証

- 当該リリースのフェーズ数: 8
- 当該リリースのチケット数: 0（mvp モードのためチケット概念なし）
- 関連過去シナリオ併走数（regression_targets）: 0（初版）
- すべて PASS（各 phase-N.md の総合判定が OK）

## 説明書整合

- `docs/manuals/user-guide.md` との差分: あり（`manual-drift.md` 参照）
- 補足: 現状の `manual-drift.md` の指摘はドリフト検出スクリプトの前提（`app/(app)/**/page.tsx` のルートグループ構成）と本プロジェクトの実構成（`app/**/page.tsx` 直下配置）の不一致に起因する。加えて `user-guide.md` がハーネス既定テンプレート（別アプリの /tools・/history 等を記載）のまま未更新。実装ルートとの整合には user-guide.md の本プロジェクト向け更新が必要。

## アップグレードノート

特になし（初版リリース）。
